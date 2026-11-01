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
      const shipping = isDigital ? 0 : (subtotal >= context.settings.freeShippingThreshold ? 0 : context.settings.defaultShippingFee);
      const total = subtotal + shipping;

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
          selectedSize: item.selectedSize || item.product.sizes[0] || 'Standard',
          selectedColor: item.selectedColor || item.product.colors[0] || 'Standard'
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
        notes: `WhatsApp automated purchase (${isDigital ? 'Digital Asset' : 'Physical Good'})`
      };

      currentOrderState.createdOrder = createdOrder;
      currentOrderState.step = 'awaiting_payment';

      const paymentLink = `https://checkout.omnichat.store/pay/${orderNumber.replace('#', '')}`;

      return {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: 
          `💳 *Order Logged — Pending Payment (${orderNumber})*\n\n` +
          `• Total: *$${total.toFixed(2)}*\n` +
          `• Product Type: *${isDigital ? '📥 Digital Product (Instant Email Access)' : '📦 Physical Good (Courier Delivery)'}*\n` +
          `• Status: *PENDING PAYMENT*\n\n` +
          `Please proceed to complete payment via our secure checkout gateway:\n` +
          `🔗 *Payment Link*: ${paymentLink}\n\n` +
          `*Supported Payment Gateways*:\n` +
          `• Paystack & Flutterwave (Cards, Bank Transfer, USSD)\n` +
          `• Stripe (Visa, Mastercard, Apple Pay)\n` +
          (isDigital ? '' : `• Cash on Delivery (Reply *COD* for doorstep payment)\n`) +
          `• Crypto (USDT TRC-20)\n\n` +
          `⚠️ *Notice*: The order remains *PENDING* until payment is verified by the gateway or store owner. ${isDigital ? 'Digital files will unlock automatically once payment is verified.' : 'Courier dispatch begins after payment confirmation.'}`,
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
        text: promptForNextField(currentOrderState, missing[0]),
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
    const pName = p.name.toLowerCase();
    return normalized.includes(pName) || (p.tags && p.tags.some(t => normalized.includes(t.toLowerCase())));
  });

  if (purchaseIntent || (matchedProduct && (normalized.includes('get') || normalized.includes('take') || normalized.includes('buy')))) {
    // If cart has items and user just says "checkout"
    let targetProduct = matchedProduct;
    if (!targetProduct && context.cart.length > 0) {
      targetProduct = context.cart[0].product;
    } else if (!targetProduct && context.products.length > 0) {
      targetProduct = context.products[0];
    }

    if (targetProduct) {
      // Rule 1: Retrieve actual product type from store database - do NOT guess!
      const productType: ProductType = targetProduct.productType === 'digital' ? 'digital' : 'physical';

      // Parse quantity if mentioned e.g. "buy 2"
      let qty = 1;
      const qtyMatch = userText.match(/\b([1-9]|10)\b/);
      if (qtyMatch && (normalized.includes('unit') || normalized.includes('pcs') || normalized.includes('copy') || normalized.includes('copies') || normalized.includes('buy') || normalized.includes('order'))) {
        qty = parseInt(qtyMatch[1], 10) || 1;
      }

      currentOrderState = {
        step: 'collecting_info',
        productType,
        draftItems: [{
          product: targetProduct,
          quantity: qty,
          selectedSize: targetProduct.sizes[0] || 'Standard',
          selectedColor: targetProduct.colors[0] || 'Standard'
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
          text: `🛍️ You selected *${targetProduct.name}* (${productType === 'digital' ? 'Digital Asset' : 'Physical Good'}).\n\n` + generateSummaryText(currentOrderState, context.settings),
          timestamp,
          type: 'text',
          payload: {
            quickReplies: ['Confirm Order', 'Change Details', 'Cancel']
          },
          status: 'read'
        };
      } else {
        const intro = `Great choice! I have reserved *${qty}x ${targetProduct.name}* ($${(targetProduct.price * qty).toFixed(2)}) for you [${productType === 'digital' ? 'Digital Download' : 'Physical Good'}].\n\n`;
        return {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: intro + promptForNextField(currentOrderState, missing[0]),
          timestamp,
          type: 'text',
          status: 'read'
        };
      }
    }
  }

  // --------------------------------------------------------------------------
  // 1. Appointment / Service Booking (Feature 5)
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
  // 2. Catalog / Products request (Feature 3)
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
        `• *Type*: ${isDig ? '📥 Digital Asset (Instant Email Access)' : '📦 Physical Good (Shipped to Address)'}\n` +
        `• *Available Options*: ${matchedProduct.sizes.join(', ')}\n` +
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
        `• *Digital Guides*: Instant access format compatible with all iOS, Android, Mac and Windows PDF readers.\n\n` +
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
      text: `🎉 Exclusive WhatsApp VIP Benefit!\n\nUse code *${context.settings.activeDiscountCode}* at checkout to receive *${context.settings.discountPercentage}% OFF* your order today.\n\nPlus, all physical orders over $${context.settings.freeShippingThreshold} qualify for complimentary express dispatch.`,
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
          `• Type: *${isDig ? 'Digital Download' : 'Physical Goods'}*\n` +
          `• Payment: *${recentOrder.paymentStatus.toUpperCase()}*\n` +
          `• Fulfillment: *${recentOrder.status.toUpperCase()}*\n` +
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
    text: `Thanks for messaging *${context.settings.storeName}*! ✨ I can help you browse our physical & digital products, answer sizing questions, or process your order with secure payment verification. What can I do for you today?`,
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
  // 1. Email extraction
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch && !state.customerEmail) {
    state.customerEmail = emailMatch[0].trim();
  }

  // 2. Name extraction
  const nameMatch = text.match(/(?:my name is|i am|name[:\s]+)\s*([a-zA-Z\s]{2,30})/i);
  if (nameMatch && !state.customerName) {
    state.customerName = nameMatch[1].trim();
  } else if (!state.customerName && text.split(' ').length >= 2 && text.split(' ').length <= 4 && !text.includes('@') && !text.includes('street')) {
    state.customerName = text.trim();
  }

  // 3. Address & City/State extraction (Only for physical products)
  if (state.productType === 'physical') {
    const cityStateMatch = text.match(/([a-zA-Z\s]{3,20}),\s*([a-zA-Z\s]{2,20})/);
    if (cityStateMatch && (!state.customerCity || !state.customerState)) {
      state.customerCity = cityStateMatch[1].trim();
      state.customerState = cityStateMatch[2].trim();
    }

    const addrMatch = text.match(/(?:address[:\s]+)?([0-9]+\s+[a-zA-Z0-9\s,.-]+(?:street|st|road|rd|avenue|ave|way|blvd|drive|close|crescent|estate))/i);
    if (addrMatch && !state.customerAddress) {
      state.customerAddress = addrMatch[1].trim();
    } else if (!state.customerAddress && (text.toLowerCase().includes('street') || text.toLowerCase().includes('road') || text.toLowerCase().includes('way') || /\d+\s+[a-zA-Z]+/.test(text))) {
      state.customerAddress = text.trim();
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

  if (state.productType === 'physical') {
    // Physical products: Full Name, Address, City/State, Email
    if (!state.customerAddress) missing.push('address');
    if (!state.customerCity || !state.customerState) missing.push('city_state');
    if (!state.customerEmail) missing.push('email');
  } else {
    // Digital products: ONLY Full Name and Email. NEVER ask for delivery address!
    if (!state.customerEmail) missing.push('email');
  }

  return missing;
}

function promptForNextField(state: ConversationOrderState, field: string): string {
  switch (field) {
    case 'name':
      return `Please tell me your *Full Name* for the order:`;
    case 'address':
      return `What is your *Delivery Street Address*? (e.g. 14 Adeola Odeku St or 450 Sutter St):`;
    case 'city_state':
      return `Got your street! Which *City and State* should we deliver to? (e.g. Lagos, Lagos State or San Francisco, CA):`;
    case 'email':
      if (state.productType === 'digital') {
        return `Please provide your *Email Address* where your digital download link and license will be delivered instantly:`;
      }
      return `What *Email Address* should we send your tracking receipt and shipping updates to?`;
    default:
      return `Please reply with your details to proceed.`;
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
  const isDigital = state.productType === 'digital';
  const shipping = isDigital ? 0 : (subtotal >= settings.freeShippingThreshold ? 0 : settings.defaultShippingFee);
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
    `• Name: *${state.customerName || 'Valued Client'}*\n` +
    `• Phone: *${state.customerPhone || settings.whatsappPhoneNumber || 'WhatsApp Phone'}*\n`;

  if (isDigital) {
    summary += `• Digital Delivery Email: *${state.customerEmail}*\n`;
    summary += `_(No physical shipping required — files sent to email instantly after payment)_\n\n`;
  } else {
    summary += `• Street Address: *${state.customerAddress}*\n`;
    summary += `• City & State: *${state.customerCity || ''}, ${state.customerState || ''}*\n`;
    summary += `• Notification Email: *${state.customerEmail}*\n\n`;
  }

  summary += `👉 Reply *YES* or *CONFIRM* to lock in this order, or say *"change [detail]"* to update any info!`;
  return summary;
}
