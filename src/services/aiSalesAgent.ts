import { Product, CartItem, ChatMessage, BotSettings, Order, AppointmentBooking, ProductType } from '../types';

export interface AgentContext {
  products: Product[];
  cart: CartItem[];
  settings: BotSettings;
  orders: Order[];
  appointments?: AppointmentBooking[];
}

export interface ConversationOrderState {
  step: 'idle' | 'collecting_info' | 'awaiting_confirmation' | 'awaiting_payment' | 'completed' | 'cancelled';
  productType?: ProductType;
  draftItems: Array<{
    product: Product;
    quantity: number;
    selectedSize?: string;
    selectedColor?: string;
  }>;
  customerName?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerPhone?: string;
  createdOrder?: Order;
}

// Global active conversation order state (remembers multi-turn context)
let currentOrderState: ConversationOrderState = {
  step: 'idle',
  draftItems: []
};

export function resetConversationOrderState(): void {
  currentOrderState = {
    step: 'idle',
    draftItems: []
  };
}

export function generateBotResponse(
  userText: string,
  context: AgentContext
): ChatMessage {
  const normalized = userText.toLowerCase().trim();
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // --------------------------------------------------------------------------
  // Rule 7d: Handle Customer Cancellation / Reset
  // --------------------------------------------------------------------------
  if (
    normalized === 'cancel' || 
    normalized === 'cancel order' || 
    normalized === 'stop' || 
    normalized === 'reset' || 
    normalized === 'never mind' ||
    normalized === 'clear cart'
  ) {
    resetConversationOrderState();
    return {
      id: `bot_${Date.now()}`,
      sender: 'bot',
      text: `🚫 *Order Cancelled*\n\nYour order draft has been cleared. Whenever you're ready, reply *CATALOG* to view our boutique collection or ask about any item!`,
      timestamp,
      type: 'text',
      payload: {
        quickReplies: ['Browse Catalog', 'VIP Discounts', 'Speak to Associate']
      },
      status: 'read'
    };
  }

  // --------------------------------------------------------------------------
  // Rule 7b: Handle Customer Correcting Details
  // --------------------------------------------------------------------------
  if (normalized.startsWith('change ') || normalized.startsWith('update ') || normalized.startsWith('correct ')) {
    const emailMatch = userText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      currentOrderState.customerEmail = emailMatch[0];
      return {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: `✓ Updated delivery email to: *${currentOrderState.customerEmail}*.\n\n` + generateSummaryText(currentOrderState, context.settings),
        timestamp,
        type: 'text',
        payload: {
          quickReplies: ['Confirm Order', 'Change Address', 'Cancel']
        },
        status: 'read'
      };
    }
    if (normalized.includes('address') || normalized.includes('street')) {
      const cleaned = userText.replace(/^(change|update|correct)\s+(my\s+)?(address\s+(to|is)\s+)?/i, '').trim();
      currentOrderState.customerAddress = cleaned;
      return {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: `✓ Updated delivery address to: *${currentOrderState.customerAddress}*.\n\n` + generateSummaryText(currentOrderState, context.settings),
        timestamp,
        type: 'text',
        payload: {
          quickReplies: ['Confirm Order', 'Change Email', 'Cancel']
        },
        status: 'read'
      };
    }
    if (normalized.includes('name')) {
      const cleaned = userText.replace(/^(change|update|correct)\s+(my\s+)?(name\s+(to|is)\s+)?/i, '').trim();
      currentOrderState.customerName = cleaned;
      return {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: `✓ Updated full name to: *${currentOrderState.customerName}*.\n\n` + generateSummaryText(currentOrderState, context.settings),
        timestamp,
        type: 'text',
        payload: {
          quickReplies: ['Confirm Order', 'Change Address', 'Cancel']
        },
        status: 'read'
      };
    }
  }

  // --------------------------------------------------------------------------
  // Rule 5: Handle Claims of Payment ("I have paid", "sent money", "proof")
  // NEVER mark order as paid simply because customer claims to have paid.
  // --------------------------------------------------------------------------
  if (
    normalized.includes('i have paid') || 
    normalized.includes('i paid') || 
    normalized.includes('payment sent') || 
    normalized.includes('just paid') || 
    normalized.includes('sent the money') ||
    normalized.includes('transfer done')
  ) {
    const orderNum = currentOrderState.createdOrder?.orderNumber || 'your order';
    return {
      id: `bot_${Date.now()}`,
      sender: 'bot',
      text: 
        `⏳ *Payment Verification In Progress*\n\n` +
        `We have received your payment notice for *${orderNum}*! The order remains securely marked as *PENDING PAYMENT* while our payment gateway verifies the transfer.\n\n` +
        `• *Security Rule*: Orders are only finalized upon verified gateway confirmation to protect both buyer and merchant.\n` +
        `• As soon as the transaction is confirmed, your receipt and fulfillment update will trigger instantly!\n\n` +
        `_(Store administrators can also verify manual transfers in the merchant dashboard)_`,
      timestamp,
      type: 'text',
      payload: {
        quickReplies: ['Check Order Status', 'Speak to Associate', 'Browse Catalog']
      },
      status: 'read'
    };
  }

  // --------------------------------------------------------------------------
  // Rule 5: Order Confirmation Affirmation
  // Only after the customer confirms the order should the AI provide payment instructions.
  // --------------------------------------------------------------------------
  if (currentOrderState.step === 'awaiting_confirmation') {
    const isAffirmative = 
      normalized === 'yes' || 
      normalized === 'confirm' || 
      normalized === 'confirm order' ||
      normalized === 'yes please' ||
      normalized === 'correct' || 
      normalized === 'proceed' || 
      normalized === 'looks good' || 
      normalized === 'pay' || 
      normalized === 'ok' || 
      normalized === 'okay' ||
      normalized.startsWith('yes');

    if (isAffirmative && currentOrderState.draftItems.length > 0) {
      const orderNumber = `WA-#${Math.floor(1000 + Math.random() * 9000)}`;
      const orderId = `ord_${Date.now()}`;
      const subtotal = currentOrderState.draftItems.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
      const isDigital = currentOrderState.productType === 'digital';
      const freeThreshold = context.settings.freeShippingThreshold ?? 100;
      const defaultShipping = context.settings.defaultShippingFee ?? 15;
      const shipping = isDigital ? 0 : (subtotal >= freeThreshold ? 0 : defaultShipping);
      const total = subtotal + shipping;

      const bankConfig = context.settings.merchantGateways?.bankTransfer;
      const bankName = bankConfig?.bankName || 'Standard Chartered';
      const bankAcct = bankConfig?.accountNumber || '0129482019';
      const bankAcctName = bankConfig?.accountName || context.settings.storeName || 'Store Merchant Account';
      const cryptoUsdt = context.settings.merchantGateways?.crypto?.usdtTrc20Address || 'TYDzsY8fFq2G2mYf6yXzUu3k5v4Hj2qP';

      const createdOrder: Order = {
        id: orderId,
        orderNumber,
        customerName: currentOrderState.customerName || 'Valued Client',
        customerPhone: currentOrderState.customerPhone || context.settings.whatsappPhoneNumber || '+1 (555) 019-9482',
        customerEmail: currentOrderState.customerEmail,
        customerAddress: currentOrderState.customerAddress,
        customerCity: currentOrderState.customerCity,
        customerState: currentOrderState.customerState,
        productType: currentOrderState.productType || 'physical',
        industry: context.settings.industry,
        items: currentOrderState.draftItems.map(item => ({
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
        paymentStatus: 'pending', // Starts pending! Never prematurely completed
        status: 'new',
        createdAt: 'Just now',
        updatedAt: 'Just now',
        notes: `WhatsApp automated purchase (Ref: ${orderNumber})`
      };

      currentOrderState.createdOrder = createdOrder;
      currentOrderState.step = 'awaiting_payment';

      const paymentLink = `https://checkout.omnichat.store/pay/${orderNumber.replace('#', '')}`;

      return {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: 
          `💳 *Order Logged — Pending Payment (${orderNumber})*\n\n` +
          `• Total Amount: *$${total.toFixed(2)}*\n` +
          `• Fulfillment: *${isDigital ? 'Instant Online Access via Email' : 'Doorstep Delivery'}*\n` +
          `• Status: *Pending Payment Verification*\n\n` +
          `To complete your order, please proceed through any of our official store payment channels:\n\n` +
          `🔗 *Online Checkout*: ${paymentLink}\n\n` +
          `🏦 *Direct Bank Transfer*:\n` +
          `• Bank: *${bankName}*\n` +
          `• Account Number: *${bankAcct}*\n` +
          `• Account Name: *${bankAcctName}*\n` +
          `• Reference: *${orderNumber}*\n\n` +
          (!isDigital ? `🚚 *Cash on Delivery*: Reply *COD* if you prefer paying at your doorstep upon delivery.\n\n` : '') +
          `🪙 *Crypto USDT (TRC-20)*: \`${cryptoUsdt}\`\n\n` +
          `⚠️ *Notice*: The order remains *PENDING* until payment is verified by our gateway or store owner. ${isDigital ? 'Your access and download links will activate as soon as payment is confirmed.' : 'Courier dispatch begins immediately upon verification.'}`,
        timestamp,
        type: 'order_confirmation',
        payload: {
          order: createdOrder,
          quickReplies: ['I Have Paid', 'Change Payment Method', 'Cancel Order']
        },
        status: 'read'
      };
    }
  }

  // --------------------------------------------------------------------------
  // Rule 2 & 3: Information Collection in Progress
  // --------------------------------------------------------------------------
  if (currentOrderState.step === 'collecting_info') {
    extractEntities(currentOrderState, userText);

    const missing = getMissingFields(currentOrderState);
    if (missing.length === 0) {
      currentOrderState.step = 'awaiting_confirmation';
      return {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: generateSummaryText(currentOrderState, context.settings),
        timestamp,
        type: 'text',
        payload: {
          quickReplies: ['Confirm Order', 'Change Details', 'Cancel']
        },
        status: 'read'
      };
    } else {
      return {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: promptForNextField(currentOrderState, missing),
        timestamp,
        type: 'text',
        status: 'read'
      };
    }
  }

  // --------------------------------------------------------------------------
  // Rule 1: Product Type Detection on Purchase Intent
  // --------------------------------------------------------------------------
  const purchaseIntent = 
    normalized.includes('buy') || 
    normalized.includes('order') || 
    normalized.includes('checkout') || 
    normalized.includes('purchase') || 
    normalized.includes('get this') || 
    normalized.includes('i want to buy') ||
    normalized.includes('add to bag') ||
    normalized.includes('order now');

  const matchedProduct = context.products.find(p => {
    const pName = (p.name || '').toLowerCase();
    const tagMatch = Array.isArray(p.tags) && p.tags.some(t => normalized.includes((t || '').toLowerCase()));
    return normalized.includes(pName) || tagMatch;
  });

  if (purchaseIntent || (matchedProduct && (normalized.includes('get') || normalized.includes('take') || normalized.includes('buy')))) {
    let targetProduct = matchedProduct;
    if (!targetProduct && context.cart.length > 0) {
      targetProduct = context.cart[0].product;
    } else if (!targetProduct && context.products.length > 0) {
      targetProduct = context.products[0];
    }

    if (targetProduct) {
      // Rule 1: Retrieve actual product type from store database - do NOT guess!
      const productType: ProductType = targetProduct.productType === 'digital' ? 'digital' : 'physical';
      const needsShipping = productType !== 'digital';

      // Parse quantity if mentioned e.g. "buy 2"
      let qty = 1;
      const qtyMatch = userText.match(/\b([1-9]|10)\b/);
      if (qtyMatch && (normalized.includes('unit') || normalized.includes('pcs') || normalized.includes('pieces') || normalized.includes('item') || normalized.includes('pair') || normalized.includes('copy') || normalized.includes('copies') || normalized.includes('buy') || normalized.includes('order'))) {
        qty = parseInt(qtyMatch[1], 10) || 1;
      }

      currentOrderState = {
        step: 'collecting_info',
        productType,
        draftItems: [{
          product: targetProduct,
          quantity: qty,
          selectedSize: (Array.isArray(targetProduct.sizes) && targetProduct.sizes[0]) || 'Standard',
          selectedColor: (Array.isArray(targetProduct.colors) && targetProduct.colors[0]) || 'Standard'
        }],
        customerPhone: context.settings.whatsappPhoneNumber || '+1 (555) 019-9482'
      };

      // Extract any details already in the message
      extractEntities(currentOrderState, userText);

      const missing = getMissingFields(currentOrderState);
      if (missing.length === 0) {
        currentOrderState.step = 'awaiting_confirmation';
        return {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: `🛍️ You selected *${targetProduct.name}* ($${targetProduct.price.toFixed(2)}).\n\n` + generateSummaryText(currentOrderState, context.settings),
          timestamp,
          type: 'text',
          payload: {
            quickReplies: ['Confirm Order', 'Change Details', 'Cancel']
          },
          status: 'read'
        };
      } else {
        const intro = `Great choice! I have reserved *${qty}x ${targetProduct.name}* ($${(targetProduct.price * qty).toFixed(2)}) for you.\n\n`;
        
        if (needsShipping) {
          // Ask entire shipping requirements at once
          return {
            id: `bot_${Date.now()}`,
            sender: 'bot',
            text: intro + `To prepare your order, please give us your shipping information including your *Full Name*, *Home Address* (Street & House/Apt Number), *City*, *State*, *Email Address*, and *Phone Number*:`,
            timestamp,
            type: 'text',
            status: 'read'
          };
        } else {
          return {
            id: `bot_${Date.now()}`,
            sender: 'bot',
            text: intro + `To send your instant access link and invoice receipt, please provide your *Full Name* and *Email Address* (and phone number if different from this WhatsApp chat):`,
            timestamp,
            type: 'text',
            status: 'read'
          };
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // Answering General Store & Account Queries Accurately
  // --------------------------------------------------------------------------
  // 1. Shipping cost & policy
  if (normalized.includes('shipping') || normalized.includes('delivery fee') || normalized.includes('deliver') || normalized.includes('delivery cost') || normalized.includes('how much to ship')) {
    const defaultShipping = context.settings.defaultShippingFee ?? 15;
    const freeThreshold = context.settings.freeShippingThreshold ?? 100;
    return {
      id: `bot_${Date.now()}`,
      sender: 'bot',
      text: 
        `📦 *Shipping & Delivery Information for ${context.settings.storeName}*:\n\n` +
        `• Standard Doorstep Delivery: *$${defaultShipping.toFixed(2)}*\n` +
        `• FREE Delivery on all orders over *$${freeThreshold.toFixed(2)}*!\n` +
        `• Delivery Timeline: Typically arrives within 1–3 business days.\n\n` +
        `Reply *CATALOG* to browse available items or tell us what you'd like to order!`,
      timestamp,
      type: 'text',
      payload: {
        quickReplies: ['Browse Catalog', 'Payment Methods', 'Speak to Associate']
      },
      status: 'read'
    };
  }

  // 2. Payment methods / bank transfer info
  if (normalized.includes('payment method') || normalized.includes('how to pay') || normalized.includes('bank details') || normalized.includes('account number') || normalized.includes('bank transfer')) {
    const bankConfig = context.settings.merchantGateways?.bankTransfer;
    const bankName = bankConfig?.bankName || 'Standard Chartered';
    const bankAcct = bankConfig?.accountNumber || '0129482019';
    const bankAcctName = bankConfig?.accountName || context.settings.storeName || 'Store Merchant Account';
    return {
      id: `bot_${Date.now()}`,
      sender: 'bot',
      text:
        `💳 *Payment Methods Accepted by ${context.settings.storeName}*:\n\n` +
        `🏦 *Direct Bank Transfer*:\n` +
        `• Bank: *${bankName}*\n` +
        `• Account: *${bankAcct}*\n` +
        `• Name: *${bankAcctName}*\n\n` +
        `💳 *Online Cards & Instant Checkout*: Paystack, Flutterwave, Stripe & Apple Pay\n` +
        `🪙 *Crypto*: USDT TRC-20\n` +
        `🚚 *Cash on Delivery*: Available on doorstep deliveries\n\n` +
        `Reply with any product name to place an instant order!`,
      timestamp,
      type: 'text',
      payload: {
        quickReplies: ['Browse Catalog', 'VIP Discount', 'Speak to Associate']
      },
      status: 'read'
    };
  }

  // 3. Store details / location
  if (normalized.includes('where are you') || normalized.includes('location') || normalized.includes('about store') || normalized.includes('who are you')) {
    return {
      id: `bot_${Date.now()}`,
      sender: 'bot',
      text:
        `✨ *About ${context.settings.storeName}*\n\n` +
        `${context.settings.storeTagline || 'Welcome to our verified WhatsApp store.'}\n\n` +
        `We provide full online WhatsApp concierge, doorstep delivery, and 24/7 automated order assistance. Reply *CATALOG* anytime to view items and prices!`,
      timestamp,
      type: 'text',
      payload: {
        quickReplies: ['Browse Catalog', 'Payment Methods', 'VIP Discount']
      },
      status: 'read'
    };
  }

  // --------------------------------------------------------------------------
  // 1. Appointment / Service Booking
  // --------------------------------------------------------------------------
  if (
    normalized.includes('book') || 
    normalized.includes('appointment') || 
    normalized.includes('schedule') || 
    normalized.includes('reserve') ||
    normalized.includes('facial') ||
    normalized.includes('treatment') ||
    normalized.includes('consultation') ||
    normalized.includes('fitting')
  ) {
    const defaultAppointment: AppointmentBooking = {
      id: `app_${Date.now()}`,
      customerName: 'Valued Client',
      customerPhone: context.settings.whatsappPhoneNumber || '+1 (555) 019-9482',
      serviceName: context.settings.industry === 'beauty_services' 
        ? 'Hydra-Infusion Glow Facial (60 Mins)' 
        : 'In-Atelier VIP Fitting & Styling Consultation',
      providerName: 'Clara Delacroix (Lead Specialist)',
      date: 'Tomorrow, 02:00 PM',
      time: '02:00 PM - 03:00 PM',
      price: context.settings.industry === 'beauty_services' ? 160 : 95,
      status: 'confirmed',
      notes: 'Automated 24h & 2h WhatsApp reminders activated.'
    };

    return {
      id: `bot_${Date.now()}`,
      sender: 'bot',
      text: `📅 *Appointment Slot Reserved for You!*\n\n` +
        `• Service: *${defaultAppointment.serviceName}*\n` +
        `• Specialist: *${defaultAppointment.providerName}*\n` +
        `• Date & Time: *${defaultAppointment.date}*\n` +
        `• Fee: *$${defaultAppointment.price.toFixed(2)}*\n\n` +
        `We have reserved this slot for 15 minutes. Tap below to confirm and receive your calendar reminder on WhatsApp:`,
      timestamp,
      type: 'appointment_booking',
      payload: {
        appointment: defaultAppointment,
        quickReplies: ['Confirm Booking', 'Reschedule Time', 'Ask Specialist Question']
      },
      status: 'read'
    };
  }

  // --------------------------------------------------------------------------
  // 2. Catalog / Products request
  // --------------------------------------------------------------------------
  if (
    normalized.includes('catalog') ||
    normalized.includes('collection') ||
    normalized.includes('products') ||
    normalized.includes('browse') ||
    normalized.includes('menu') ||
    normalized.includes('shop') ||
    normalized.includes('show all') ||
    normalized.includes('what do you sell')
  ) {
    return {
      id: `bot_${Date.now()}`,
      sender: 'bot',
      text: `Here is our current curated collection for *${context.settings.storeName}*. Tap any item below to view details, or say *"Buy [Product Name]"* to order:`,
      timestamp,
      type: 'catalog',
      payload: {
        products: context.products,
        quickReplies: context.products.slice(0, 3).map(p => `Buy ${p.name.split(' ')[0]}`)
      },
      status: 'read'
    };
  }

  // --------------------------------------------------------------------------
  // 3. Specific product queries
  // --------------------------------------------------------------------------
  if (matchedProduct && (normalized.includes('show') || normalized.includes('price') || normalized.includes('details') || normalized.includes('have'))) {
    const isDig = matchedProduct.productType === 'digital';
    return {
      id: `bot_${Date.now()}`,
      sender: 'bot',
      text: `Here are the details for the *${matchedProduct.name}*:\n\n` +
        `• *Price*: $${matchedProduct.price} ${matchedProduct.originalPrice ? `(was ~$${matchedProduct.originalPrice}~)` : ''}\n` +
        `• *Fulfillment*: ${isDig ? 'Instant Online Access via Email' : 'Doorstep Delivery'}\n` +
        `• *Available Options*: ${Array.isArray(matchedProduct.sizes) ? matchedProduct.sizes.join(', ') : 'Standard'}\n` +
        `• *Stock*: ${matchedProduct.stock > 0 ? `${matchedProduct.stock} units available` : 'Sold out'}\n\n` +
        `${matchedProduct.description}\n\n` +
        `Reply *"Buy ${matchedProduct.name.split(' ')[0]}"* to start an instant order!`,
      timestamp,
      type: 'product_card',
      payload: {
        product: matchedProduct,
        quickReplies: [`Buy ${matchedProduct.name.split(' ')[0]}`, 'Size Guide', 'View Catalog']
      },
      status: 'read'
    };
  }

  // --------------------------------------------------------------------------
  // 4. Sizing & Recommendation inquiries
  // --------------------------------------------------------------------------
  if (normalized.includes('size') || normalized.includes('fit') || normalized.includes('sizing') || normalized.includes('measurement') || normalized.includes('recommend')) {
    return {
      id: `bot_${Date.now()}`,
      sender: 'bot',
      text: `*Stylist & Size Recommendation* 📏\n\n` +
        `• *Apparel & Outerwear*: True-to-size with a relaxed modern drape. If layering over thicker garments, choose one size up.\n` +
        `• *Footwear*: Standard European sizing (40–45). If you are between sizes, we recommend your typical sneaker size.\n` +
        `• *Guides & Online Media*: Instant access format compatible with all iOS, Android, Mac and Windows PDF readers.\n\n` +
        `Would you like to order an item or browse the full collection?`,
      timestamp,
      type: 'text',
      payload: {
        quickReplies: ['View Curated Catalog', 'Current Promo Code', 'Speak with Associate']
      },
      status: 'read'
    };
  }

  // --------------------------------------------------------------------------
  // 5. Discount / Promo code
  // --------------------------------------------------------------------------
  if (normalized.includes('discount') || normalized.includes('promo') || normalized.includes('coupon') || normalized.includes('code') || normalized.includes('deal') || normalized.includes('offer')) {
    return {
      id: `bot_${Date.now()}`,
      sender: 'bot',
      text: `🎉 Exclusive WhatsApp VIP Benefit!\n\nUse code *${context.settings.activeDiscountCode}* at checkout to receive *${context.settings.discountPercentage}% OFF* your order today.\n\nPlus, all orders over $${context.settings.freeShippingThreshold} qualify for complimentary express dispatch.`,
      timestamp,
      type: 'text',
      payload: {
        quickReplies: ['Browse Catalog with Promo', 'Speak to Stylist']
      },
      status: 'read'
    };
  }

  // --------------------------------------------------------------------------
  // 6. Order tracking inquiry
  // --------------------------------------------------------------------------
  if (normalized.includes('track') || normalized.includes('where is my order') || normalized.includes('status') || normalized.includes('wa-#')) {
    const recentOrder = context.orders[0];
    if (recentOrder) {
      const isDig = recentOrder.productType === 'digital';
      return {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: `📦 *Order Tracking for ${recentOrder.orderNumber}*\n\n` +
          `• Customer: *${recentOrder.customerName}*\n` +
          `• Fulfillment: *${isDig ? 'Instant Access' : 'Courier Delivery'}*\n` +
          `• Payment: *${recentOrder.paymentStatus.toUpperCase()}*\n` +
          `• Status: *${recentOrder.status.toUpperCase()}*\n` +
          (isDig 
            ? `• Delivery: Sent to *${recentOrder.customerEmail}*\n` 
            : `• Courier Tracking: *${recentOrder.trackingNumber || 'Awaiting dispatch'}*\n• Address: ${recentOrder.customerAddress || 'On file'}\n`) +
          `\nNeed to update details? Let our team know right here!`,
        timestamp,
        type: 'status_update',
        payload: {
          order: recentOrder,
          quickReplies: ['Track Another Order', 'Speak to Associate', 'Browse Catalog']
        },
        status: 'read'
      };
    }

    return {
      id: `bot_${Date.now()}`,
      sender: 'bot',
      text: `Please provide your order number (e.g. *WA-#1088*) and I will retrieve your tracking status immediately!`,
      timestamp,
      type: 'text',
      status: 'read'
    };
  }

  // Fallback response
  return {
    id: `bot_${Date.now()}`,
    sender: 'bot',
    text: `Thanks for messaging *${context.settings.storeName}*! ✨ I can help you browse our collection, answer questions, or process your order with secure payment verification. What can I do for you today?`,
    timestamp,
    type: 'text',
    payload: {
      quickReplies: ['Browse Catalog', 'Book Appointment', 'VIP Discount']
    },
    status: 'read'
  };
}

// ----------------------------------------------------------------------------
// Entity Extraction
// ----------------------------------------------------------------------------
function extractEntities(state: ConversationOrderState, text: string): void {
  const trimmed = text.trim();

  // 1. Email extraction
  const emailMatch = trimmed.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch && !state.customerEmail) {
    state.customerEmail = emailMatch[0].trim();
  }

  // 2. Phone extraction
  const phoneMatch = trimmed.match(/(?:(?:\+?234|0|1|\+1)[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,5}\b/);
  if (phoneMatch && phoneMatch[0].replace(/\D/g, '').length >= 10 && !state.customerPhone) {
    const rawNum = phoneMatch[0].trim();
    state.customerPhone = rawNum.startsWith('+') ? rawNum : `+${rawNum}`;
  }

  // 3. City & State extraction (if requires shipping)
  if (state.productType !== 'digital') {
    const cityStateMatch = trimmed.match(/([a-zA-Z\s]{3,25}),\s*([a-zA-Z\s]{2,25}(?:state|ca|ny|tx|fl|province)?)/i);
    if (cityStateMatch && (!state.customerCity || !state.customerState)) {
      state.customerCity = cityStateMatch[1].trim();
      state.customerState = cityStateMatch[2].trim();
    }
  }

  // 4. Address extraction (if requires shipping)
  if (state.productType !== 'digital') {
    const addrMatch = trimmed.match(/(?:(?:home\s+)?address[:\s]+)?([0-9]+\s+[a-zA-Z0-9\s,.-]+(?:street|st|road|rd|avenue|ave|way|blvd|drive|dr|close|crescent|estate|flat|apt|suite|house))/i);
    if (addrMatch && !state.customerAddress) {
      state.customerAddress = addrMatch[1].trim();
    } else if (!state.customerAddress) {
      const segments = trimmed.split(/[\n,]+/).map(s => s.trim());
      const streetSeg = segments.find(s => 
        /\b(street|st|road|rd|way|avenue|ave|drive|crescent|close|estate|flat|apt|suite|house)\b/i.test(s) ||
        (/\d+\s+[a-zA-Z]+/.test(s) && !s.includes('@') && s.length > 5)
      );
      if (streetSeg) {
        state.customerAddress = streetSeg;
      }
    }
  }

  // 5. Name extraction
  const nameMatch = trimmed.match(/(?:my name is|i am|name[:\s]+)\s*([a-zA-Z\s]{2,30})/i);
  if (nameMatch && !state.customerName) {
    state.customerName = nameMatch[1].trim();
  } else if (!state.customerName) {
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
      state.customerName = firstSeg;
    }
  }
}

// ----------------------------------------------------------------------------
// Missing Fields Calculator (Rules 2 & 3)
// ----------------------------------------------------------------------------
function getMissingFields(state: ConversationOrderState): string[] {
  const missing: string[] = [];

  if (!state.customerName) {
    missing.push('name');
  }

  if (state.productType !== 'digital') {
    // Requires shipping: Full Name, Address, City/State, Email
    if (!state.customerAddress) missing.push('address');
    if (!state.customerCity || !state.customerState) missing.push('city_state');
    if (!state.customerEmail) missing.push('email');
  } else {
    // No shipping required: ONLY Full Name and Email. NEVER ask for delivery address!
    if (!state.customerEmail) missing.push('email');
  }

  return missing;
}

function promptForNextField(state: ConversationOrderState, missingFields: string[]): string {
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

// ----------------------------------------------------------------------------
// Rule 4: Order Summary and Confirmation Request
// ----------------------------------------------------------------------------
function generateSummaryText(state: ConversationOrderState, settings: BotSettings): string {
  const item = state.draftItems[0];
  const productName = item?.product.name || 'Selected Item';
  const qty = item?.quantity || 1;
  const unitPrice = item?.product.price || 0;
  const subtotal = unitPrice * qty;
  const needsShipping = state.productType !== 'digital';
  const freeThreshold = settings.freeShippingThreshold ?? 100;
  const shippingFee = settings.defaultShippingFee ?? 15;
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
    `• Name: *${state.customerName || 'Valued Client'}*\n` +
    `• Phone: *${state.customerPhone || settings.whatsappPhoneNumber || 'WhatsApp Phone'}*\n`;

  if (needsShipping) {
    summary += `• Home Address: *${state.customerAddress}*\n`;
    if (state.customerCity || state.customerState) {
      summary += `• City & State: *${[state.customerCity, state.customerState].filter(Boolean).join(', ')}*\n`;
    }
    summary += `• Email for Tracking: *${state.customerEmail}*\n\n`;
  } else {
    summary += `• Access Email: *${state.customerEmail}*\n\n`;
  }

  summary += `👉 Reply *YES* or *CONFIRM* to lock in this order, or say *"change [detail]"* to update any info!`;
  return summary;
}
