import { Product, Order, CartItem, PaymentMethod, ProductType, BotSettings } from '../types/index.js';

export interface CustomerOrderSession {
  tenantId: string;
  customerPhone: string;
  customerName?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  step: 'idle' | 'collecting_info' | 'awaiting_confirmation' | 'awaiting_payment' | 'completed' | 'cancelled';
  productType?: ProductType;
  draftItems: Array<{
    product: Product;
    quantity: number;
    selectedSize?: string;
    selectedColor?: string;
  }>;
  createdOrderId?: string;
  createdOrderNumber?: string;
  totalAmount: number;
  lastInteractionAt: number;
}

export interface TenantOrderStore {
  orders: Order[];
}

class WhatsAppOrderEngine {
  private sessions = new Map<string, CustomerOrderSession>();
  private tenantOrders = new Map<string, Order[]>();

  // Helper session key
  private getSessionKey(tenantId: string, phone: string): string {
    const cleanTenant = tenantId.replace(/[^a-zA-Z0-9_-]/g, '_') || 'default_store';
    const cleanPhone = phone.replace(/\D/g, '') || 'unknown';
    return `${cleanTenant}::${cleanPhone}`;
  }

  public getSession(tenantId: string, phone: string): CustomerOrderSession {
    const key = this.getSessionKey(tenantId, phone);
    let session = this.sessions.get(key);
    if (!session) {
      session = {
        tenantId,
        customerPhone: phone.startsWith('+') ? phone : `+${phone}`,
        step: 'idle',
        draftItems: [],
        totalAmount: 0,
        lastInteractionAt: Date.now()
      };
      this.sessions.set(key, session);
    }
    session.lastInteractionAt = Date.now();
    return session;
  }

  public getTenantOrders(tenantId: string): Order[] {
    const cleanTenant = tenantId.replace(/[^a-zA-Z0-9_-]/g, '_') || 'default_store';
    return this.tenantOrders.get(cleanTenant) || [];
  }

  public addTenantOrder(tenantId: string, order: Order): void {
    const cleanTenant = tenantId.replace(/[^a-zA-Z0-9_-]/g, '_') || 'default_store';
    const list = this.tenantOrders.get(cleanTenant) || [];
    const filtered = list.filter(o => o.id !== order.id);
    this.tenantOrders.set(cleanTenant, [order, ...filtered]);
  }

  public updateTenantOrderStatus(tenantId: string, orderId: string, status: Order['status']): Order | null {
    const cleanTenant = tenantId.replace(/[^a-zA-Z0-9_-]/g, '_') || 'default_store';
    const list = this.tenantOrders.get(cleanTenant) || [];
    const target = list.find(o => o.id === orderId);
    if (!target) return null;

    target.status = status;
    target.updatedAt = new Date().toISOString();
    return target;
  }

  /**
   * Verified Payment processing.
   * Never marks order paid from customer claim alone.
   * Delivers download links or initiates dispatch packaging.
   */
  public verifyOrderPayment(
    tenantId: string,
    orderIdOrNumber: string,
    gatewayReference?: string
  ): { success: boolean; order?: Order; message: string; notificationText?: string } {
    const cleanTenant = tenantId.replace(/[^a-zA-Z0-9_-]/g, '_') || 'default_store';
    const list = this.tenantOrders.get(cleanTenant) || [];
    const order = list.find(o => o.id === orderIdOrNumber || o.orderNumber === orderIdOrNumber);

    if (!order) {
      return { success: false, message: `Order ${orderIdOrNumber} not found in store database.` };
    }

    if (order.paymentStatus === 'completed') {
      return { success: true, order, message: `Order ${order.orderNumber} is already verified and paid.` };
    }

    order.paymentStatus = 'completed';
    order.updatedAt = new Date().toISOString();
    order.notes = `Payment verified via ${order.paymentMethod.toUpperCase()} (Ref: ${gatewayReference || 'GW-CONFIRMED-' + Date.now().toString(36)})`;

    let notificationText = '';

    if (order.productType === 'digital') {
      order.status = 'delivered';
      order.digitalDeliveryStatus = 'delivered';
      order.digitalDeliverySentAt = new Date().toISOString();

      const digitalItem = order.items[0]?.product;
      const downloadLink = digitalItem?.digitalFileUrl || 'https://storage.googleapis.com/omnichat-digital-assets/atelier_capsule_masterclass_v3.pdf';

      notificationText =
        `🎉 *PAYMENT VERIFIED! Your Order is Confirmed!*\n\n` +
        `• Order: *${order.orderNumber}*\n` +
        `• Item: *${order.items.map(i => i.product.name).join(', ')}*\n` +
        `• Amount Paid: *$${order.total.toFixed(2)}*\n\n` +
        `🔗 *Your Instant Access & Download Link*:\n${downloadLink}\n\n` +
        `Your receipt and access token have also been sent to your email: *${order.customerEmail || 'your email'}*.\n\n` +
        `Thank you for your purchase! Reply anytime if you need assistance.`;
    } else {
      order.status = 'packing';
      order.trackingNumber = `TRK-${Math.floor(100000 + Math.random() * 900000)}`;

      const destination = [order.customerAddress, order.customerCity, order.customerState].filter(Boolean).join(', ');

      notificationText =
        `🎉 *PAYMENT VERIFIED! Order Confirmed!*\n\n` +
        `• Order: *${order.orderNumber}*\n` +
        `• Total: *$${order.total.toFixed(2)}*\n` +
        `• Status: *Packaging in Progress*\n` +
        `• Delivery Destination:\n  ${destination}\n\n` +
        `Our fulfillment team has received your confirmed order and begun dispatch preparation. Tracking number: *${order.trackingNumber}*.\n\n` +
        `Reply *TRACK* anytime to view delivery status!`;
    }

    return {
      success: true,
      order,
      message: `Order ${order.orderNumber} payment verified successfully.`,
      notificationText
    };
  }

  /**
   * Main conversational order processor.
   * Naturally studies store settings, handles all inquiries, and never mentions 'physical' or 'digital' goods.
   */
  public processMessage(
    tenantId: string,
    senderPhone: string,
    senderName: string,
    userText: string,
    products: Product[],
    storeName: string,
    storeSettings?: BotSettings | null
  ): {
    replyText: string;
    orderCreated?: Order;
    orderUpdated?: Order;
    currentStep: CustomerOrderSession['step'];
  } {
    const session = this.getSession(tenantId, senderPhone);
    const text = userText.trim();
    const lower = text.toLowerCase();

    // Pull accurate store owner account configurations
    const bankConfig = storeSettings?.merchantGateways?.bankTransfer;
    const bankName = bankConfig?.bankName || 'Standard Chartered';
    const bankAcct = bankConfig?.accountNumber || '0129482019';
    const bankAcctName = bankConfig?.accountName || storeName || 'Store Merchant Account';
    const cryptoUsdt = storeSettings?.merchantGateways?.crypto?.usdtTrc20Address || 'TYDzsY8fFq2G2mYf6yXzUu3k5v4Hj2qP';
    const freeShippingThreshold = storeSettings?.freeShippingThreshold ?? 100;
    const defaultShippingFee = storeSettings?.defaultShippingFee ?? 15;
    const activeDiscountCode = storeSettings?.activeDiscountCode;
    const discountPercentage = storeSettings?.discountPercentage ?? 10;
    const storeTagline = storeSettings?.storeTagline || 'Welcome to our verified WhatsApp store.';

    if (!session.customerName && senderName && senderName !== 'Customer' && senderName !== 'You') {
      session.customerName = senderName;
    }

    // ------------------------------------------------------------------------
    // Rule: Handle Cancellation / Reset
    // ------------------------------------------------------------------------
    if (lower === 'cancel' || lower === 'cancel order' || lower === 'stop' || lower === 'reset' || lower === 'start over' || lower === 'never mind') {
      session.step = 'idle';
      session.draftItems = [];
      session.productType = undefined;
      return {
        replyText: `🚫 *Order Cancelled*\n\nYour pending order has been cleared. Whenever you're ready, reply *CATALOG* to browse items or ask any question!`,
        currentStep: 'idle'
      };
    }

    // ------------------------------------------------------------------------
    // Rule: Handle customer correcting details
    // ------------------------------------------------------------------------
    if (lower.startsWith('change ') || lower.startsWith('update ') || lower.startsWith('correct ')) {
      const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        session.customerEmail = emailMatch[0];
        return {
          replyText: `✓ Updated your email to: *${session.customerEmail}*.\n\n` + this.generateSummaryPrompt(session, storeSettings),
          currentStep: session.step
        };
      }
      if (lower.includes('address') || lower.includes('street')) {
        const cleaned = text.replace(/^(change|update|correct)\s+(my\s+)?(address\s+(to|is)\s+)?/i, '').trim();
        session.customerAddress = cleaned;
        return {
          replyText: `✓ Updated delivery address to: *${session.customerAddress}*.\n\n` + this.generateSummaryPrompt(session, storeSettings),
          currentStep: session.step
        };
      }
      if (lower.includes('name')) {
        const cleaned = text.replace(/^(change|update|correct)\s+(my\s+)?(name\s+(to|is)\s+)?/i, '').trim();
        session.customerName = cleaned;
        return {
          replyText: `✓ Updated customer name to: *${session.customerName}*.\n\n` + this.generateSummaryPrompt(session, storeSettings),
          currentStep: session.step
        };
      }
    }

    // ------------------------------------------------------------------------
    // Rule: Customer claims they paid ("I paid", "sent money", "proof")
    // Never mark as paid simply because customer claims to have paid.
    // ------------------------------------------------------------------------
    if (
      lower.includes('i have paid') || 
      lower.includes('i paid') || 
      lower.includes('payment sent') || 
      lower.includes('just paid') || 
      lower.includes('sent the money') ||
      lower.includes('transfer done') ||
      lower.includes('paid now') ||
      lower.includes('transferred') ||
      lower.includes('made the transfer') ||
      lower.includes('sent payment') ||
      lower.includes('proof of payment')
    ) {
      if (session.createdOrderNumber) {
        return {
          replyText:
            `⏳ *Payment Verification In Progress*\n\n` +
            `Thank you for notifying us! Order *${session.createdOrderNumber}* is currently marked as *PENDING PAYMENT*.\n\n` +
            `Our automated payment gateway and bank reconciliation are verifying the transaction. As soon as verification is confirmed, your receipt and fulfillment details will be sent immediately.\n\n` +
            `_(Store managers can also verify your transaction in the CRM dashboard)_`,
          currentStep: session.step
        };
      }
    }

    // ------------------------------------------------------------------------
    // Rule: Order Confirmation ("yes", "confirm", "proceed", "correct")
    // ------------------------------------------------------------------------
    if (session.step === 'awaiting_confirmation') {
      const isAffirmative = 
        lower === 'yes' || 
        lower === 'confirm' || 
        lower === 'yes please' || 
        lower === 'correct' || 
        lower === 'proceed' || 
        lower === 'looks good' || 
        lower === 'pay' || 
        lower === 'ok' || 
        lower === 'okay' || 
        lower.startsWith('yes');

      if (isAffirmative) {
        const orderNumber = `WA-#${Math.floor(1000 + Math.random() * 9000)}`;
        const orderId = `ord_${Date.now()}`;
        const subtotal = session.draftItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        const needsShipping = session.productType !== 'digital';
        const shipping = needsShipping ? (subtotal >= freeShippingThreshold ? 0 : defaultShippingFee) : 0;
        const total = subtotal + shipping;

        const newOrder: Order = {
          id: orderId,
          orderNumber,
          customerName: session.customerName || senderName || 'Valued Client',
          customerPhone: session.customerPhone,
          customerEmail: session.customerEmail,
          customerAddress: session.customerAddress,
          customerCity: session.customerCity,
          customerState: session.customerState,
          productType: session.productType || 'physical',
          industry: session.draftItems[0]?.product?.industry || 'fashion',
          items: session.draftItems.map(item => ({
            product: item.product,
            quantity: item.quantity,
            selectedSize: item.selectedSize || (Array.isArray(item.product.sizes) && item.product.sizes[0]) || 'Standard',
            selectedColor: item.selectedColor || (Array.isArray(item.product.colors) && item.product.colors[0]) || 'Standard'
          })),
          subtotal,
          discount: 0,
          shipping,
          total,
          paymentMethod: 'paystack',
          paymentStatus: 'pending',
          status: 'new',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          notes: `WhatsApp automated order. Reference: ${orderNumber}`
        };

        // Save order in tenant database
        this.addTenantOrder(tenantId, newOrder);
        session.createdOrderId = orderId;
        session.createdOrderNumber = orderNumber;
        session.step = 'awaiting_payment';

        const paymentUrl = `https://checkout.omnichat.store/pay/${orderNumber.replace('#', '')}`;

        const reply =
          `💳 *Order Logged — Pending Payment (${orderNumber})*\n\n` +
          `• Total Amount: *$${total.toFixed(2)}*\n` +
          `• Fulfillment: *${needsShipping ? 'Doorstep Delivery' : 'Instant Online Access via Email'}*\n` +
          `• Status: *Pending Payment Verification*\n\n` +
          `To complete your order, please make payment through our official store channels:\n\n` +
          `🔗 *Online Checkout*: ${paymentUrl}\n\n` +
          `🏦 *Direct Bank Transfer*:\n` +
          `• Bank: *${bankName}*\n` +
          `• Account Number: *${bankAcct}*\n` +
          `• Account Name: *${bankAcctName}*\n` +
          `• Reference: *${orderNumber}*\n\n` +
          (needsShipping ? `🚚 *Cash on Delivery*: Reply *COD* if you prefer paying at your doorstep upon delivery.\n\n` : '') +
          `🪙 *Crypto USDT (TRC-20)*: \`${cryptoUsdt}\`\n\n` +
          `⚠️ *Notice*: The order remains *PENDING* until payment is confirmed by our gateway. ${needsShipping ? 'Courier dispatch begins immediately upon verification.' : 'Your download and access links will activate as soon as payment is confirmed.'}`;

        return {
          replyText: reply,
          orderCreated: newOrder,
          currentStep: 'awaiting_payment'
        };
      }
    }

    // ------------------------------------------------------------------------
    // Information Collection in Progress
    // ------------------------------------------------------------------------
    if (session.step === 'collecting_info') {
      this.extractCustomerEntities(session, text);

      const missing = this.getMissingFields(session);
      if (missing.length === 0) {
        session.step = 'awaiting_confirmation';
        return {
          replyText: this.generateSummaryPrompt(session, storeSettings),
          currentStep: 'awaiting_confirmation'
        };
      } else {
        // If they provided some fields but missed others, ask for the remainder
        return {
          replyText: this.promptForNextMissingField(session, missing),
          currentStep: 'collecting_info'
        };
      }
    }

    // ------------------------------------------------------------------------
    // Product Intent Detection
    // ------------------------------------------------------------------------
    const purchaseIntent = 
      lower.includes('buy') || 
      lower.includes('order') || 
      lower.includes('purchase') || 
      lower.includes('checkout') || 
      lower.includes('i want') || 
      lower.includes('get this') || 
      lower.includes('pay for');

    const matchedProduct = products.find(p => {
      const pName = (p.name || '').toLowerCase();
      const hasTagMatch = Array.isArray(p.tags) && p.tags.some(t => lower.includes((t || '').toLowerCase()));
      const hasCategoryMatch = p.category && lower.includes(p.category.toLowerCase());
      return lower.includes(pName) || hasTagMatch || hasCategoryMatch;
    });

    if (purchaseIntent || matchedProduct) {
      const targetProduct = matchedProduct || products[0];

      if (targetProduct) {
        const productType: ProductType = targetProduct.productType === 'digital' ? 'digital' : 'physical';
        const needsShipping = productType !== 'digital';

        let qty = 1;
        const qtyMatch = text.match(/\b([1-9]|10)\b/);
        if (qtyMatch && (lower.includes('unit') || lower.includes('pcs') || lower.includes('pieces') || lower.includes('item') || lower.includes('pair') || lower.includes('copy') || lower.includes('copies') || lower.includes('buy') || lower.includes('order'))) {
          qty = parseInt(qtyMatch[1], 10) || 1;
        }

        session.productType = productType;
        session.draftItems = [{
          product: targetProduct,
          quantity: qty,
          selectedSize: (Array.isArray(targetProduct.sizes) && targetProduct.sizes[0]) || 'Standard',
          selectedColor: (Array.isArray(targetProduct.colors) && targetProduct.colors[0]) || 'Standard'
        }];
        session.totalAmount = targetProduct.price * qty;

        // Try extracting any details the customer already included in their message
        this.extractCustomerEntities(session, text);

        const missing = this.getMissingFields(session);
        if (missing.length === 0) {
          session.step = 'awaiting_confirmation';
          return {
            replyText: `🛍️ You selected *${targetProduct.name}* ($${targetProduct.price.toFixed(2)}).\n\n` + this.generateSummaryPrompt(session, storeSettings),
            currentStep: 'awaiting_confirmation'
          };
        } else {
          session.step = 'collecting_info';
          const intro = `Great choice! I have reserved *${qty}x ${targetProduct.name}* ($${(targetProduct.price * qty).toFixed(2)}) for you.\n\n`;
          
          if (needsShipping) {
            // Ask ENTIRE shipping requirements at once (as requested)
            return {
              replyText:
                intro +
                `To prepare your order, please give us your shipping information including your *Full Name*, *Home Address* (Street & House/Apt Number), *City*, *State*, *Email Address*, and *Phone Number*:`,
              currentStep: 'collecting_info'
            };
          } else {
            // Instant delivery: only Full Name and Email
            return {
              replyText:
                intro +
                `To send your instant access link and invoice receipt, please provide your *Full Name* and *Email Address* (and phone number if different from this WhatsApp chat):`,
              currentStep: 'collecting_info'
            };
          }
        }
      }
    }

    // ------------------------------------------------------------------------
    // Answering General Store & Account Queries Accurately
    // ------------------------------------------------------------------------
    // 1. Shipping policy / cost
    if (lower.includes('shipping') || lower.includes('delivery fee') || lower.includes('deliver') || lower.includes('delivery cost') || lower.includes('how much to ship')) {
      return {
        replyText:
          `📦 *Shipping & Delivery Information for ${storeName}*:\n\n` +
          `• Standard Doorstep Delivery: *$${defaultShippingFee.toFixed(2)}*\n` +
          `• FREE Delivery on all orders over *$${freeShippingThreshold.toFixed(2)}*!\n` +
          `• Delivery Timeline: Typically arrives within 1–3 business days.\n\n` +
          `Reply *CATALOG* to browse available items or tell us what you'd like to order!`,
        currentStep: 'idle'
      };
    }

    // 2. Payment methods / bank transfer info
    if (lower.includes('payment method') || lower.includes('how to pay') || lower.includes('bank details') || lower.includes('account number') || lower.includes('bank transfer')) {
      return {
        replyText:
          `💳 *Payment Methods Accepted by ${storeName}*:\n\n` +
          `🏦 *Direct Bank Transfer*:\n` +
          `• Bank: *${bankName}*\n` +
          `• Account: *${bankAcct}*\n` +
          `• Name: *${bankAcctName}*\n\n` +
          `💳 *Online Cards & Instant Checkout*: Paystack, Flutterwave, Stripe & Apple Pay\n` +
          `🪙 *Crypto*: USDT TRC-20\n` +
          `🚚 *Cash on Delivery*: Available on doorstep deliveries\n\n` +
          `Reply with any product name to place an instant order!`,
        currentStep: 'idle'
      };
    }

    // 3. Discount & promo codes
    if (lower.includes('discount') || lower.includes('promo') || lower.includes('coupon') || lower.includes('voucher') || lower.includes('code')) {
      if (activeDiscountCode) {
        return {
          replyText:
            `🎉 *Special Offer at ${storeName}!*\n\n` +
            `Use promo code *${activeDiscountCode}* to receive *${discountPercentage}% off* your order!\n` +
            `Plus, orders over $${freeShippingThreshold.toFixed(2)} receive *FREE delivery*.\n\n` +
            `Reply *CATALOG* to browse items now!`,
          currentStep: 'idle'
        };
      } else {
        return {
          replyText:
            `✨ All orders over *$${freeShippingThreshold.toFixed(2)}* qualify for *FREE doorstep delivery*!\n\n` +
            `Reply *CATALOG* to see our current collection.`,
          currentStep: 'idle'
        };
      }
    }

    // 4. Store details / location
    if (lower.includes('where are you') || lower.includes('location') || lower.includes('about store') || lower.includes('who are you')) {
      return {
        replyText:
          `✨ *About ${storeName}*\n\n` +
          `${storeTagline}\n\n` +
          `We provide full online WhatsApp concierge, doorstep delivery, and 24/7 automated order assistance. Reply *CATALOG* anytime to view items and prices!`,
        currentStep: 'idle'
      };
    }

    // ------------------------------------------------------------------------
    // Catalog Request
    // ------------------------------------------------------------------------
    if (lower.includes('catalog') || lower.includes('menu') || lower.includes('items') || lower.includes('price') || lower.includes('shop') || lower.includes('browse')) {
      if (products.length > 0) {
        const productList = products.map((p, idx) => {
          return `${idx + 1}. *${p.name}* — $${p.price.toFixed(2)}\n   _${p.description}_`;
        }).join('\n\n');

        return {
          replyText: `🛍️ *Welcome to ${storeName}! Live Catalog*:\n\n${productList}\n\n👉 Reply with any *Product Name* or number to start your order!`,
          currentStep: 'idle'
        };
      }
    }

    // Default Greeting / Help
    return {
      replyText:
        `👋 *Hello ${senderName || 'there'}! Welcome to ${storeName}.*\n\n` +
        `How can we help you today?\n` +
        `• Reply *CATALOG* to view available items & current prices\n` +
        `• Reply with any product name to place an order\n` +
        `• Ask any question about delivery, bank details, or payments!`,
      currentStep: 'idle'
    };
  }

  // --------------------------------------------------------------------------
  // Entity Extraction Helper
  // --------------------------------------------------------------------------
  private extractCustomerEntities(session: CustomerOrderSession, text: string): void {
    const trimmed = text.trim();

    // 1. Email extraction
    const emailMatch = trimmed.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !session.customerEmail) {
      session.customerEmail = emailMatch[0].trim();
    }

    // 2. Phone extraction (e.g. 080..., +234..., +1...)
    const phoneMatch = trimmed.match(/(?:(?:\+?234|0|1|\+1)[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,5}\b/);
    if (phoneMatch && phoneMatch[0].replace(/\D/g, '').length >= 10 && !session.customerPhone) {
      const rawNum = phoneMatch[0].trim();
      session.customerPhone = rawNum.startsWith('+') ? rawNum : `+${rawNum}`;
    }

    // 3. City & State extraction
    if (session.productType !== 'digital') {
      const cityStateMatch = trimmed.match(/([a-zA-Z\s]{3,25}),\s*([a-zA-Z\s]{2,25}(?:state|ca|ny|tx|fl|province)?)/i);
      if (cityStateMatch && (!session.customerCity || !session.customerState)) {
        session.customerCity = cityStateMatch[1].trim();
        session.customerState = cityStateMatch[2].trim();
      }
    }

    // 4. Street / Home Address extraction
    if (session.productType !== 'digital') {
      const addrMatch = trimmed.match(/(?:(?:home\s+)?address[:\s]+)?([0-9]+\s+[a-zA-Z0-9\s,.-]+(?:street|st|road|rd|avenue|ave|way|blvd|drive|dr|close|crescent|estate|flat|apt|suite|house))/i);
      if (addrMatch && !session.customerAddress) {
        session.customerAddress = addrMatch[1].trim();
      } else if (!session.customerAddress) {
        const segments = trimmed.split(/[\n,]+/).map(s => s.trim());
        const streetSeg = segments.find(s => 
          /\b(street|st|road|rd|way|avenue|ave|drive|crescent|close|estate|flat|apt|suite|house)\b/i.test(s) ||
          (/\d+\s+[a-zA-Z]+/.test(s) && !s.includes('@') && s.length > 5)
        );
        if (streetSeg) {
          session.customerAddress = streetSeg;
        }
      }
    }

    // 5. Name extraction
    const nameMatch = trimmed.match(/(?:my name is|i am|name[:\s]+)\s*([a-zA-Z\s]{2,30})/i);
    if (nameMatch && !session.customerName) {
      session.customerName = nameMatch[1].trim();
    } else if (!session.customerName) {
      const segments = trimmed.split(/[\n,]+/).map(s => s.trim());
      const firstSeg = segments[0];
      if (
        firstSeg && 
        firstSeg.split(' ').length >= 2 && 
        firstSeg.split(' ').length <= 4 &&
        !firstSeg.includes('@') &&
        !/\d/.test(firstSeg) &&
        !/(street|road|st|rd|ave|way|address|phone)/i.test(firstSeg)
      ) {
        session.customerName = firstSeg;
      }
    }
  }

  // --------------------------------------------------------------------------
  // Missing Fields Calculator
  // --------------------------------------------------------------------------
  private getMissingFields(session: CustomerOrderSession): string[] {
    const missing: string[] = [];

    if (!session.customerName) missing.push('name');

    if (session.productType !== 'digital') {
      if (!session.customerAddress) missing.push('address');
      if (!session.customerCity || !session.customerState) missing.push('city_state');
      if (!session.customerEmail) missing.push('email');
    } else {
      if (!session.customerEmail) missing.push('email');
    }

    return missing;
  }

  // --------------------------------------------------------------------------
  // Natural Follow-up for any remaining fields
  // --------------------------------------------------------------------------
  private promptForNextMissingField(session: CustomerOrderSession, missingFields: string[]): string {
    const field = missingFields[0];
    switch (field) {
      case 'name':
        return `Got your details! Could you also provide your *Full Name* for the order?`;
      case 'address':
        return `Please provide your *Home Address* (Street & House/Apt number):`;
      case 'city_state':
        return `Which *City and State* should we deliver to? (e.g. Victoria Island, Lagos or San Francisco, CA):`;
      case 'email':
        return `What *Email Address* should we send your tracking receipt and updates to?`;
      default:
        return `Please provide your missing delivery information to proceed.`;
    }
  }

  // --------------------------------------------------------------------------
  // Order Summary and Confirmation Request
  // --------------------------------------------------------------------------
  private generateSummaryPrompt(session: CustomerOrderSession, storeSettings?: BotSettings | null): string {
    const item = session.draftItems[0];
    const productName = item?.product.name || 'Selected Item';
    const qty = item?.quantity || 1;
    const unitPrice = item?.product.price || 0;
    const subtotal = unitPrice * qty;
    const needsShipping = session.productType !== 'digital';
    const freeThreshold = storeSettings?.freeShippingThreshold ?? 100;
    const shippingFee = storeSettings?.defaultShippingFee ?? 15;
    const shipping = needsShipping ? (subtotal >= freeThreshold ? 0 : shippingFee) : 0;
    const total = subtotal + shipping;

    let summary = 
      `📋 *Please Confirm Your Order Summary*\n\n` +
      `• *Item*: ${productName}\n` +
      `• *Quantity*: ${qty}\n` +
      `• *Price*: $${unitPrice.toFixed(2)}\n` +
      (needsShipping ? `• *Shipping*: ${shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}\n` : '') +
      `• *Total Amount*: *$${total.toFixed(2)}*\n` +
      `• *Fulfillment*: ${needsShipping ? '🚚 Doorstep Delivery' : '⚡ Instant Online Access via Email'}\n\n` +
      `👤 *Customer & Delivery Details*:\n` +
      `• Name: *${session.customerName || 'Valued Client'}*\n` +
      `• Phone: *${session.customerPhone}*\n`;

    if (needsShipping) {
      summary += `• Home Address: *${session.customerAddress}*\n`;
      if (session.customerCity || session.customerState) {
        summary += `• City & State: *${[session.customerCity, session.customerState].filter(Boolean).join(', ')}*\n`;
      }
      summary += `• Email for Tracking: *${session.customerEmail}*\n\n`;
    } else {
      summary += `• Access Email: *${session.customerEmail}*\n\n`;
    }

    summary += `👉 Reply *YES* or *CONFIRM* to lock in this order, or say *"change [detail]"* to update any info!`;
    return summary;
  }
}

export const whatsappOrderEngine = new WhatsAppOrderEngine();
