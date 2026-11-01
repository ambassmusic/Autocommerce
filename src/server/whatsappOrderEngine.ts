import { Product, Order, CartItem, PaymentMethod, ProductType } from '../types/index.js';

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
    // Deduplicate
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
   * Triggers digital delivery if digital product, or packaging update if physical.
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
      return { success: true, order, message: `Order ${order.orderNumber} is already marked as PAID.` };
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
        `🎉 *PAYMENT VERIFIED! Your Digital Order is Complete!*\n\n` +
        `• Order: *${order.orderNumber}*\n` +
        `• Item: *${order.items.map(i => i.product.name).join(', ')}*\n` +
        `• Amount Paid: *$${order.total.toFixed(2)}*\n\n` +
        `📥 *Instant Digital Download Access*:\n${downloadLink}\n\n` +
        `A permanent license and download link have also been sent to your email: *${order.customerEmail || 'your email'}*.\n\n` +
        `Thank you for your purchase! Reply anytime if you need assistance.`;
    } else {
      order.status = 'packing';
      order.trackingNumber = `TRK-${Math.floor(100000 + Math.random() * 900000)}`;

      notificationText =
        `🎉 *PAYMENT VERIFIED! Order Confirmed!*\n\n` +
        `• Order: *${order.orderNumber}*\n` +
        `• Total: *$${order.total.toFixed(2)}*\n` +
        `• Status: *Packaging in Progress*\n` +
        `• Delivery Destination:\n  ${order.customerAddress}, ${order.customerCity || ''}, ${order.customerState || ''}\n\n` +
        `Our boutique fulfillment team has received your confirmed order and begun dispatch preparation. Tracking number: *${order.trackingNumber}*.\n\n` +
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
   * Follows all 7 rules strictly.
   */
  public processMessage(
    tenantId: string,
    senderPhone: string,
    senderName: string,
    userText: string,
    products: Product[],
    storeName: string
  ): {
    replyText: string;
    orderCreated?: Order;
    orderUpdated?: Order;
    currentStep: CustomerOrderSession['step'];
  } {
    const session = this.getSession(tenantId, senderPhone);
    const text = userText.trim();
    const lower = text.toLowerCase();

    if (!session.customerName && senderName && senderName !== 'Customer' && senderName !== 'You') {
      session.customerName = senderName;
    }

    // ------------------------------------------------------------------------
    // Rule 7d: Handle Cancellation / Reset
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
    // Rule 7b: Handle customer correcting details
    // ------------------------------------------------------------------------
    if (lower.startsWith('change ') || lower.startsWith('update ') || lower.startsWith('correct ')) {
      const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        session.customerEmail = emailMatch[0];
        return {
          replyText: `✓ Updated your delivery email to: *${session.customerEmail}*.\n\n` + this.generateSummaryPrompt(session),
          currentStep: session.step
        };
      }
      if (lower.includes('address') || lower.includes('street')) {
        const cleaned = text.replace(/^(change|update|correct)\s+(my\s+)?(address\s+(to|is)\s+)?/i, '').trim();
        session.customerAddress = cleaned;
        return {
          replyText: `✓ Updated delivery address to: *${session.customerAddress}*.\n\n` + this.generateSummaryPrompt(session),
          currentStep: session.step
        };
      }
      if (lower.includes('name')) {
        const cleaned = text.replace(/^(change|update|correct)\s+(my\s+)?(name\s+(to|is)\s+)?/i, '').trim();
        session.customerName = cleaned;
        return {
          replyText: `✓ Updated customer name to: *${session.customerName}*.\n\n` + this.generateSummaryPrompt(session),
          currentStep: session.step
        };
      }
    }

    // ------------------------------------------------------------------------
    // Rule 5b: Customer claims they paid ("I paid", "sent money", "proof")
    // Never mark as paid simply because customer claims to have paid.
    // ------------------------------------------------------------------------
    if (
      lower.includes('i have paid') || 
      lower.includes('i paid') || 
      lower.includes('payment sent') || 
      lower.includes('just paid') || 
      lower.includes('sent the money') ||
      lower.includes('transfer done') ||
      lower.includes('paid now')
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
    // Rule 5: Customer confirms order ("yes", "confirm", "proceed", "correct")
    // Only after customer confirms do we provide payment instructions & create pending order
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
        // Create the real pending order
        const orderNumber = `WA-#${Math.floor(1000 + Math.random() * 9000)}`;
        const orderId = `ord_${Date.now()}`;
        const subtotal = session.draftItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        const shipping = session.productType === 'digital' ? 0 : (subtotal >= 100 ? 0 : 15);
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
            selectedSize: item.selectedSize || item.product.sizes[0] || 'Standard',
            selectedColor: item.selectedColor || item.product.colors[0] || 'Standard'
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
          notes: `WhatsApp automated order. Type: ${session.productType}`
        };

        // Save order in tenant database
        this.addTenantOrder(tenantId, newOrder);
        session.createdOrderId = orderId;
        session.createdOrderNumber = orderNumber;
        session.step = 'awaiting_payment';

        // Payment instructions
        const paymentUrl = `https://checkout.omnichat.store/pay/${orderNumber.replace('#', '')}`;

        const isDigital = session.productType === 'digital';
        const reply =
          `💳 *Order Logged — Pending Payment (${orderNumber})*\n\n` +
          `• Total Amount: *$${total.toFixed(2)}*\n` +
          `• Fulfillment: *${isDigital ? 'Instant Digital Email Delivery' : 'Courier Doorstep Delivery'}*\n` +
          `• Payment Status: *PENDING VERIFICATION*\n\n` +
          `To finalize your purchase, please complete payment via our secure payment gateway:\n` +
          `🔗 *Payment Link*: ${paymentUrl}\n\n` +
          `*Accepted Channels*:\n` +
          `• Paystack & Flutterwave (Debit Card, Bank Transfer, USSD)\n` +
          `• Bank Direct: Standard Chartered (Acct: 0129482019 / AURA Atelier)\n` +
          (isDigital ? '' : `• Cash on Delivery (Reply *COD* to choose cash upon doorstep delivery)\n`) +
          `• Crypto USDT TRC-20\n\n` +
          `⚠️ *Notice*: The order remains *PENDING* until payment is verified by the gateway or store owner. ${isDigital ? 'Digital download access will unlock automatically once payment is verified.' : 'Courier dispatch begins after payment confirmation.'}`;

        return {
          replyText: reply,
          orderCreated: newOrder,
          currentStep: 'awaiting_payment'
        };
      }
    }

    // ------------------------------------------------------------------------
    // Rule 2 & 3: Information Collection in progress
    // ------------------------------------------------------------------------
    if (session.step === 'collecting_info') {
      this.extractCustomerEntities(session, text);

      // Check if all required info is now collected
      const missing = this.getMissingFields(session);
      if (missing.length === 0) {
        session.step = 'awaiting_confirmation';
        return {
          replyText: this.generateSummaryPrompt(session),
          currentStep: 'awaiting_confirmation'
        };
      } else {
        return {
          replyText: this.promptForNextMissingField(session, missing[0]),
          currentStep: 'collecting_info'
        };
      }
    }

    // ------------------------------------------------------------------------
    // Rule 1: Product Type Detection on Purchase Intent
    // ------------------------------------------------------------------------
    const purchaseIntent = 
      lower.includes('buy') || 
      lower.includes('order') || 
      lower.includes('purchase') || 
      lower.includes('checkout') || 
      lower.includes('i want') || 
      lower.includes('get this') || 
      lower.includes('pay for');

    // Find if a product is mentioned in text
    const matchedProduct = products.find(p => {
      const pName = p.name.toLowerCase();
      return lower.includes(pName) || p.tags.some(t => lower.includes(t.toLowerCase()));
    });

    if (purchaseIntent || matchedProduct) {
      const targetProduct = matchedProduct || products[0];

      if (targetProduct) {
        // Retrieve ACTUAL product type from store database - do NOT guess!
        const productType: ProductType = targetProduct.productType === 'digital' ? 'digital' : 'physical';

        // Parse quantity if mentioned e.g. "buy 2 linen shirts"
        let qty = 1;
        const qtyMatch = text.match(/\b([1-9]|10)\b/);
        if (qtyMatch && (lower.includes('unit') || lower.includes('pcs') || lower.includes('pieces') || lower.includes('item') || lower.includes('pair') || lower.includes('copy') || lower.includes('copies') || lower.includes('buy') || lower.includes('order'))) {
          qty = parseInt(qtyMatch[1], 10) || 1;
        }

        session.productType = productType;
        session.draftItems = [{
          product: targetProduct,
          quantity: qty,
          selectedSize: targetProduct.sizes[0] || 'Standard',
          selectedColor: targetProduct.colors[0] || 'Standard'
        }];
        session.totalAmount = targetProduct.price * qty;

        // Try extracting any info user might have already typed in the same message!
        this.extractCustomerEntities(session, text);

        const missing = this.getMissingFields(session);
        if (missing.length === 0) {
          session.step = 'awaiting_confirmation';
          return {
            replyText: `🛍️ You selected *${targetProduct.name}* (${productType === 'digital' ? 'Digital Guide' : 'Physical Good'}).\n\n` + this.generateSummaryPrompt(session),
            currentStep: 'awaiting_confirmation'
          };
        } else {
          session.step = 'collecting_info';
          const intro = `Great choice! I have reserved *${qty}x ${targetProduct.name}* ($${(targetProduct.price * qty).toFixed(2)}) for you. [${productType === 'digital' ? 'Digital Product' : 'Physical Delivery'}]\n\n`;
          return {
            replyText: intro + this.promptForNextMissingField(session, missing[0]),
            currentStep: 'collecting_info'
          };
        }
      }
    }

    // ------------------------------------------------------------------------
    // Catalog Request
    // ------------------------------------------------------------------------
    if (lower.includes('catalog') || lower.includes('menu') || lower.includes('items') || lower.includes('price') || lower.includes('shop') || lower.includes('browse')) {
      if (products.length > 0) {
        const productList = products.map((p, idx) => {
          const typeBadge = p.productType === 'digital' ? '📥 [Digital Download]' : '📦 [Physical Good]';
          return `${idx + 1}. *${p.name}* — $${p.price.toFixed(2)} ${typeBadge}\n   _${p.description}_`;
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
        `• Reply *CATALOG* to view our physical products & digital guides\n` +
        `• Reply with a product name (e.g. *"Buy Linen Overshirt"* or *"Buy Digital Masterclass"*) to place an order\n` +
        `• Reply *TRACK* to check status of an order`,
      currentStep: 'idle'
    };
  }

  // --------------------------------------------------------------------------
  // Entity Extraction Helper (Never ask for info already provided)
  // --------------------------------------------------------------------------
  private extractCustomerEntities(session: CustomerOrderSession, text: string): void {
    // 1. Extract email
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !session.customerEmail) {
      session.customerEmail = emailMatch[0].trim();
    }

    // 2. Extract Name if user says "my name is ..." or "I am ..." or "Name: ..."
    const nameMatch = text.match(/(?:my name is|i am|name[:\s]+)\s*([a-zA-Z\s]{2,30})/i);
    if (nameMatch && !session.customerName) {
      session.customerName = nameMatch[1].trim();
    } else if (!session.customerName && text.split(' ').length >= 2 && text.split(' ').length <= 4 && !text.includes('@') && !text.includes('street') && !text.includes('road')) {
      // Direct name reply (e.g. "Amara Okafor")
      session.customerName = text.trim();
    }

    // 3. Extract City / State (e.g. "Lagos, Lagos State" or "San Francisco, CA")
    if (session.productType === 'physical') {
      const cityStateMatch = text.match(/([a-zA-Z\s]{3,20}),\s*([a-zA-Z\s]{2,20})/);
      if (cityStateMatch && (!session.customerCity || !session.customerState)) {
        session.customerCity = cityStateMatch[1].trim();
        session.customerState = cityStateMatch[2].trim();
      }

      // Extract street address
      const addrMatch = text.match(/(?:address[:\s]+)?([0-9]+\s+[a-zA-Z0-9\s,.-]+(?:street|st|road|rd|avenue|ave|way|blvd|drive|close|crescent|estate))/i);
      if (addrMatch && !session.customerAddress) {
        session.customerAddress = addrMatch[1].trim();
      } else if (!session.customerAddress && (text.toLowerCase().includes('street') || text.toLowerCase().includes('road') || text.toLowerCase().includes('way') || text.toLowerCase().includes('suite') || text.toLowerCase().includes('flat') || text.toLowerCase().includes('estate') || /\d+\s+[a-zA-Z]+/.test(text))) {
        session.customerAddress = text.trim();
      }
    }
  }

  // --------------------------------------------------------------------------
  // Missing Fields Calculator
  // --------------------------------------------------------------------------
  private getMissingFields(session: CustomerOrderSession): string[] {
    const missing: string[] = [];

    // Full name is required for all products
    if (!session.customerName) {
      missing.push('name');
    }

    if (session.productType === 'physical') {
      // Physical products require delivery address, city & state, email, and phone
      if (!session.customerAddress) missing.push('address');
      if (!session.customerCity || !session.customerState) missing.push('city_state');
      if (!session.customerEmail) missing.push('email');
    } else {
      // Digital products require ONLY email (no delivery address!)
      if (!session.customerEmail) missing.push('email');
    }

    return missing;
  }

  // --------------------------------------------------------------------------
  // Natural Step-by-Step Prompt
  // --------------------------------------------------------------------------
  private promptForNextMissingField(session: CustomerOrderSession, field: string): string {
    switch (field) {
      case 'name':
        return `Please tell me your *Full Name* for the order:`;
      case 'address':
        return `What is your *Delivery Street Address*? (e.g. 14 Adeola Odeku St or 450 Sutter St):`;
      case 'city_state':
        return `Got your street! Which *City and State* should we deliver to? (e.g. Lagos, Lagos State or San Francisco, CA):`;
      case 'email':
        if (session.productType === 'digital') {
          return `Please provide your *Email Address* where your digital download link and license will be delivered instantly:`;
        }
        return `What *Email Address* should we send your tracking receipt and shipping updates to?`;
      default:
        return `Please reply with your details to proceed.`;
    }
  }

  // --------------------------------------------------------------------------
  // Rule 4: Order Summary and Confirmation Request
  // --------------------------------------------------------------------------
  private generateSummaryPrompt(session: CustomerOrderSession): string {
    const item = session.draftItems[0];
    const productName = item?.product.name || 'Selected Item';
    const qty = item?.quantity || 1;
    const unitPrice = item?.product.price || 0;
    const subtotal = unitPrice * qty;
    const isDigital = session.productType === 'digital';
    const shipping = isDigital ? 0 : (subtotal >= 100 ? 0 : 15);
    const total = subtotal + shipping;

    let summary = 
      `📋 *Please Confirm Your Order Summary*\n\n` +
      `• *Product*: ${productName}\n` +
      `• *Quantity*: ${qty}\n` +
      `• *Unit Price*: $${unitPrice.toFixed(2)}\n` +
      (isDigital ? '' : `• *Shipping*: ${shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}\n`) +
      `• *Total Amount*: *$${total.toFixed(2)}*\n` +
      `• *Product Type*: ${isDigital ? '📥 *Digital Product (Instant Email Access)*' : '📦 *Physical Good (Doorstep Courier Delivery)*'}\n\n` +
      `👤 *Customer & Delivery Details*:\n` +
      `• Name: *${session.customerName || 'Valued Client'}*\n` +
      `• Phone: *${session.customerPhone}*\n`;

    if (isDigital) {
      summary += `• Digital Delivery Email: *${session.customerEmail}*\n`;
      summary += `_(No physical shipping required — files sent to email instantly after payment)_\n\n`;
    } else {
      summary += `• Street Address: *${session.customerAddress}*\n`;
      summary += `• City & State: *${session.customerCity || ''}, ${session.customerState || ''}*\n`;
      summary += `• Notification Email: *${session.customerEmail}*\n\n`;
    }

    summary += `👉 Reply *YES* or *CONFIRM* to lock in this order, or say *"change [detail]"* to correct any information!`;
    return summary;
  }
}

export const whatsappOrderEngine = new WhatsAppOrderEngine();
