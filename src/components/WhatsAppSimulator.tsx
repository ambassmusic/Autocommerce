import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Phone, Video, MoreVertical, CheckCheck, ShoppingBag, 
  Sparkles, Package, Truck, ArrowRight, X, ChevronRight, ChevronLeft, RotateCcw,
  Volume2, VolumeX, ShieldCheck, Plus, Minus, CreditCard, Coins, Building
} from 'lucide-react';
import { Product, CartItem, ChatMessage, BotSettings, Order, PaymentMethod } from '../types';

interface WhatsAppSimulatorProps {
  products: Product[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  settings: BotSettings;
  orders: Order[];
  onNewOrder: (order: Order) => void;
  onSendMessage: (text: string) => void;
  isTyping: boolean;
  onResetChat: () => void;
}

export const WhatsAppSimulator: React.FC<WhatsAppSimulatorProps> = ({
  products,
  cart,
  setCart,
  messages,
  settings,
  onNewOrder,
  onSendMessage,
  isTyping,
  onResetChat
}) => {
  const [inputText, setInputText] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // Checkout form state
  const [customerName, setCustomerName] = useState('Alex Mercer');
  const [customerPhone, setCustomerPhone] = useState('+1 (415) 555-0199');
  const [customerEmail, setCustomerEmail] = useState('alex.mercer@gmail.com');
  const [customerAddress, setCustomerAddress] = useState('88 King Street, Suite 402, San Francisco, CA');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paystack');

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleQuickReply = (reply: string) => {
    onSendMessage(reply);
  };

  const handleOpenProduct = (product: Product) => {
    setSelectedProduct(product);
    setActiveImageIndex(0);
    setSelectedSize(product.sizes[0] || '');
    setSelectedColor(product.colors[0] || '');
  };

  const handleAddToCart = (product: Product, size?: string, color?: string) => {
    const chosenSize = size || product.sizes[0] || 'Standard';
    const chosenColor = color || product.colors[0] || 'Standard';

    setCart(prev => {
      const existing = prev.find(item => 
        item.product.id === product.id && 
        item.selectedSize === chosenSize &&
        item.selectedColor === chosenColor
      );
      if (existing) {
        return prev.map(item => 
          item === existing ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1, selectedSize: chosenSize, selectedColor: chosenColor }];
    });

    setSelectedProduct(null);
    onSendMessage(`Added ${product.name} (${chosenSize}) to cart! Show my current bag.`);
  };

  const handleUpdateCartQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const updated = [...prev];
      const target = updated[index];
      if (!target) return prev;
      const newQty = target.quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index] = { ...target, quantity: newQty };
      return updated;
    });
  };

  const isDigitalOnly = cart.length > 0 && cart.every(item => item.product.productType === 'digital');
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = settings.discountPercentage > 0 && subtotal > 0 ? (subtotal * settings.discountPercentage) / 100 : 0;
  const shipping = isDigitalOnly ? 0 : (subtotal >= settings.freeShippingThreshold || subtotal === 0 ? 0 : settings.defaultShippingFee);
  const total = Math.max(0, subtotal - discount + shipping);

  const handleCompleteOrder = () => {
    if (cart.length === 0) return;

    const orderNumber = `WA-#${Math.floor(1000 + Math.random() * 9000)}`;
    const effectivePaymentStatus: Order['paymentStatus'] = 
      (!isDigitalOnly && paymentMethod === 'cash_on_delivery') ? 'cod' : 'pending';

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      orderNumber,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress: isDigitalOnly ? 'Digital Delivery (Direct Link)' : customerAddress,
      productType: isDigitalOnly ? 'digital' : 'physical',
      industry: settings.industry,
      items: [...cart],
      subtotal,
      discount,
      shipping,
      total,
      paymentMethod,
      paymentStatus: effectivePaymentStatus,
      digitalDeliveryStatus: isDigitalOnly ? 'pending' : undefined,
      status: 'new',
      trackingNumber: isDigitalOnly ? `DIGI-${Math.floor(100000 + Math.random() * 900000)}` : `EXP-WA-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: 'Just now',
      updatedAt: 'Just now',
      notes: `Order created via WhatsApp (${paymentMethod.toUpperCase()}) - ${isDigitalOnly ? 'Digital Asset (Pending payment)' : 'Physical Item (Pending gateway verification)'}`
    };

    onNewOrder(newOrder);
    setCart([]);
    setIsCheckoutOpen(false);
    setIsCartDrawerOpen(false);

    onSendMessage(`Order ${orderNumber} created! Payment initiated via ${paymentMethod.replace('_', ' ').toUpperCase()} (Status: Pending Verification).`);
  };

  return (
    <div className="relative flex flex-col h-full max-h-[860px] w-full max-w-[420px] mx-auto bg-slate-900 rounded-[44px] p-3 shadow-2xl border-4 border-slate-700/80 ring-1 ring-slate-800">
      {/* Phone Notch & Status Bar */}
      <div className="relative w-full flex items-center justify-between px-6 pt-2 pb-1 shrink-0 text-[11px] font-medium text-slate-300">
        <span className="tabular-nums">09:41</span>
        <div className="w-20 h-4 bg-slate-950 rounded-full flex items-center justify-center gap-1.5 shadow-inner">
          <div className="w-2 h-2 rounded-full bg-slate-800" />
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]">5G</span>
          <div className="w-4 h-2.5 border border-slate-400 rounded-sm p-0.5 flex items-center">
            <div className="w-full h-full bg-emerald-400 rounded-[1px]" />
          </div>
        </div>
      </div>

      {/* WhatsApp Screen Body */}
      <div className="relative flex flex-col flex-1 bg-[#efeae2] rounded-[34px] overflow-hidden border border-slate-700">
        {/* WhatsApp Business Header (Teal/Emerald Green) */}
        <div className="bg-[#008069] text-white px-3.5 py-2.5 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              {settings.storeName.charAt(0)}
              <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${settings.whatsappConnected ? 'bg-emerald-400' : 'bg-amber-400'} border-2 border-[#008069] rounded-full flex items-center justify-center`}>
                <ShieldCheck className="w-2 h-2 text-slate-900" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold truncate max-w-[130px]">
                  {settings.storeName}
                </span>
                {settings.whatsappConnected && (
                  <span className="text-[10px] text-emerald-200" title="Verified Business Number">✓</span>
                )}
              </div>
              <span className="text-[10.5px] text-emerald-100 font-normal">
                {settings.whatsappConnected 
                  ? (settings.whatsappPhoneNumber ? `${settings.whatsappPhoneNumber} · Online` : 'WhatsApp Online')
                  : 'WhatsApp Offline · Device Unlinked'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-white">
            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative p-1.5 rounded-full hover:bg-white/10 transition-colors"
              title="View Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)} 
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
              title={soundEnabled ? "Mute audio" : "Enable audio"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-white/60" />}
            </button>
            <button 
              onClick={onResetChat} 
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
              title="Reset Chat"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* WhatsApp Message Stream */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-3 space-y-3 chat-scrollbar bg-[#efeae2]"
        >
          {/* Disconnected Warning Banner if not linked */}
          {!settings.whatsappConnected && (
            <div className="mx-auto my-1 max-w-[95%] bg-amber-50 border border-amber-300 rounded-xl p-2.5 text-xs text-amber-900 shadow-xs flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping mt-1 shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-[11px] text-amber-950 flex items-center justify-between">
                  <span>WhatsApp Unlinked (Test Sandbox)</span>
                  <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded font-mono font-medium">Evolution API</span>
                </p>
                <p className="text-[10.5px] text-amber-800 leading-tight mt-0.5">
                  Your store phone is disconnected. To link your real phone without CAC/Meta paperwork, go to <strong>Dashboard &gt; Connect WhatsApp</strong> (Scan QR or enter 8-digit pairing code).
                </p>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="mx-auto my-1 max-w-[90%] bg-[#ffeecd] border border-amber-200/80 rounded-lg px-2.5 py-1.5 text-center shadow-xs">
            <p className="text-[10px] text-amber-900 leading-tight">
              🔒 End-to-end encrypted. Automated AI checkout via Paystack, Flutterwave &amp; Crypto.
            </p>
          </div>

          {/* Messages */}
          {messages.map((msg) => {
            const isCustomer = msg.sender === 'customer';

            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'} max-w-full`}
              >
                {/* Bubble Container */}
                <div 
                  className={`relative max-w-[88%] rounded-2xl p-2.5 shadow-xs text-xs ${
                    isCustomer 
                      ? 'bg-[#d9fdd3] text-slate-900 rounded-tr-xs' 
                      : 'bg-white text-slate-900 rounded-tl-xs border border-slate-200/60'
                  }`}
                >
                  {/* Message Text */}
                  <p className="whitespace-pre-line leading-relaxed text-[12px]">
                    {msg.text}
                  </p>

                  {/* Rich Catalog Cards Payload */}
                  {msg.type === 'catalog' && msg.payload?.products && (
                    <div className="mt-2 space-y-2">
                      <div className="grid grid-cols-1 gap-2">
                        {msg.payload.products.map(product => (
                          <div 
                            key={product.id}
                            className="bg-slate-50 rounded-xl p-2 border border-slate-200 flex gap-2.5 items-center hover:border-emerald-500 transition-all cursor-pointer"
                            onClick={() => handleOpenProduct(product)}
                          >
                            <img 
                              src={product.image} 
                              alt={product.name}
                              referrerPolicy="no-referrer"
                              className="w-14 h-14 rounded-lg object-cover shrink-0 bg-slate-200"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-slate-900 text-xs truncate">
                                {product.name}
                              </h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-emerald-700 font-bold text-xs tabular-nums">
                                  ${product.price}
                                </span>
                                {product.originalPrice && (
                                  <span className="font-mono text-slate-400 line-through text-[10px] tabular-nums">
                                    ${product.originalPrice}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                {product.sizes.join(' · ')}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(product);
                              }}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-semibold shrink-0 flex items-center gap-1 transition-colors shadow-xs"
                            >
                              <Plus className="w-3 h-3" />
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Single Product Showcase Card */}
                  {msg.type === 'product_card' && msg.payload?.product && (
                    <div className="mt-2 bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                      <img 
                        src={msg.payload.product.image} 
                        alt={msg.payload.product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-32 object-cover bg-slate-200"
                      />
                      <div className="p-2.5">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-slate-900 text-xs">
                            {msg.payload.product.name}
                          </h4>
                          <span className="font-mono text-emerald-700 font-bold text-xs tabular-nums">
                            ${msg.payload.product.price}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                          {msg.payload.product.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200">
                          <button
                            onClick={() => handleOpenProduct(msg.payload!.product!)}
                            className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-medium text-center transition-colors shadow-xs"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleAddToCart(msg.payload!.product!)}
                            className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold text-center flex items-center justify-center gap-1 transition-colors shadow-xs"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            Add to Bag
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cart Summary Card */}
                  {msg.type === 'cart_summary' && msg.payload?.cart && (
                    <div className="mt-2 bg-slate-50 rounded-xl p-2.5 border border-slate-200 space-y-2">
                      <div className="space-y-1.5 max-h-36 overflow-y-auto chat-scrollbar pr-1">
                        {msg.payload.cart.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[11px] text-slate-700 py-0.5 border-b border-slate-200/80">
                            <span className="truncate max-w-[140px]">
                              {item.quantity}x {item.product.name}
                            </span>
                            <span className="font-mono font-medium text-slate-900 tabular-nums">
                              ${(item.product.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-1.5 flex items-center justify-between text-xs font-bold text-slate-900 border-t border-slate-200">
                        <span>Cart Total</span>
                        <span className="font-mono text-emerald-700 tabular-nums">
                          ${subtotal.toFixed(2)}
                        </span>
                      </div>

                      <button
                        onClick={() => setIsCheckoutOpen(true)}
                        className="w-full mt-1.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <span>Proceed to WhatsApp Checkout</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Order Confirmation Receipt */}
                  {msg.type === 'order_confirmation' && msg.payload?.order && (
                    <div className="mt-2 bg-emerald-50 rounded-xl p-2.5 border border-emerald-300 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-800">
                          ✓ Order Confirmed
                        </span>
                        <span className="font-mono text-[10px] text-slate-600 font-bold">
                          {msg.payload.order.orderNumber}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-700">
                        <p>Total Paid: <strong className="font-mono text-emerald-900">${msg.payload.order.total.toFixed(2)}</strong></p>
                        <p className="truncate text-slate-500 mt-0.5">Ship to: {msg.payload.order.customerAddress}</p>
                      </div>
                      <div className="bg-white border border-emerald-200 rounded-lg p-1.5 text-[10px] text-emerald-800 flex items-center gap-1.5 shadow-xs">
                        <Truck className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                        <span>Courier tracking: {msg.payload.order.trackingNumber}</span>
                      </div>
                    </div>
                  )}

                  {/* Status update timeline */}
                  {msg.type === 'status_update' && msg.payload?.order && (
                    <div className="mt-2 bg-slate-50 rounded-xl p-2.5 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 font-medium">Fulfillment Status</span>
                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px] uppercase">
                          {msg.payload.order.status}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                          style={{
                            width: msg.payload.order.status === 'delivered' ? '100%' :
                                   msg.payload.order.status === 'shipping' ? '75%' :
                                   msg.payload.order.status === 'packing' ? '50%' : '25%'
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Tracking: {msg.payload.order.trackingNumber}
                      </p>
                    </div>
                  )}

                  {/* Appointment Booking Card */}
                  {msg.type === 'appointment_booking' && msg.payload?.appointment && (
                    <div className="mt-2 bg-emerald-50 rounded-xl p-2.5 border border-emerald-300 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-800">
                          📅 Appointment Scheduled
                        </span>
                        <span className="font-mono text-[10px] text-emerald-700 font-bold">
                          ${msg.payload.appointment.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-800 space-y-0.5">
                        <p className="font-semibold">{msg.payload.appointment.serviceName}</p>
                        <p className="text-slate-600">Specialist: {msg.payload.appointment.providerName}</p>
                        <p className="text-emerald-700 font-medium">Time: {msg.payload.appointment.date} · {msg.payload.appointment.time}</p>
                      </div>
                      <button
                        onClick={() => handleQuickReply('Confirmed my appointment! See you then.')}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold shadow-xs transition-colors mt-1"
                      >
                        ✓ Confirm Appointment on WhatsApp
                      </button>
                    </div>
                  )}

                  {/* Message Timestamp & Checkmarks */}
                  <div className="flex items-center justify-end gap-1 mt-1 text-[9.5px] text-slate-400">
                    <span className="tabular-nums">{msg.timestamp}</span>
                    {isCustomer && (
                      <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                    )}
                  </div>
                </div>

                {/* Quick Reply Pills */}
                {msg.payload?.quickReplies && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                    {msg.payload.quickReplies.map((reply, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickReply(reply)}
                        className="text-[11px] px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 rounded-full transition-colors whitespace-nowrap shadow-xs font-medium"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-3 py-2 w-16 text-slate-400 shadow-xs">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form 
          onSubmit={handleSend}
          className="bg-[#f0f2f5] p-2 flex items-center gap-2 border-t border-slate-200 shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-white text-slate-900 placeholder:text-slate-400 text-xs px-3.5 py-2 rounded-full focus:outline-none focus:ring-1 focus:ring-emerald-500 border border-slate-200 shadow-xs"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-8 h-8 rounded-full bg-[#008069] hover:bg-[#00705b] disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0 shadow-xs"
            title="Send Message"
          >
            <Send className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </form>

        {/* Product Modal Drawer */}
        {selectedProduct && (
          <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-xs flex flex-col justify-end p-2 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 max-h-[85%] overflow-y-auto chat-scrollbar shadow-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{selectedProduct.name}</h3>
                  <span className="font-mono text-emerald-700 font-bold text-sm tabular-nums">${selectedProduct.price}</span>
                </div>
                <button 
                  onClick={() => setSelectedProduct(null)} 
                  className="p-1 text-slate-400 hover:text-slate-800 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Product Gallery Carousel with Multi-Image Support */}
              {(() => {
                const gallery = (selectedProduct.images && selectedProduct.images.length > 0)
                  ? selectedProduct.images
                  : [selectedProduct.image];
                const activeImg = gallery[activeImageIndex] || gallery[0];

                return (
                  <div className="space-y-2">
                    <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
                      <img 
                        src={activeImg} 
                        alt={`${selectedProduct.name} - Photo ${activeImageIndex + 1}`} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-all duration-300"
                      />

                      {/* Photo Counter Badge */}
                      {gallery.length > 1 && (
                        <div className="absolute top-2 right-2 bg-slate-900/70 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                          {activeImageIndex + 1} / {gallery.length}
                        </div>
                      )}

                      {/* Carousel Arrow Buttons */}
                      {gallery.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveImageIndex(prev => (prev === 0 ? gallery.length - 1 : prev - 1));
                            }}
                            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 hover:bg-white text-slate-800 rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer"
                            title="Previous Photo"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveImageIndex(prev => (prev === gallery.length - 1 ? 0 : prev + 1));
                            }}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 hover:bg-white text-slate-800 rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer"
                            title="Next Photo"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Dot Indicators */}
                      {gallery.length > 1 && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-900/40 backdrop-blur-xs px-2 py-1 rounded-full">
                          {gallery.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveImageIndex(idx);
                              }}
                              className={`rounded-full transition-all cursor-pointer ${
                                activeImageIndex === idx 
                                  ? 'w-2.5 h-1.5 bg-emerald-400' 
                                  : 'w-1.5 h-1.5 bg-white/70 hover:bg-white'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Thumbnail Strip */}
                    {gallery.length > 1 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 chat-scrollbar">
                        {gallery.map((thumbUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveImageIndex(idx)}
                            className={`w-12 h-12 rounded-lg overflow-hidden border shrink-0 transition-all cursor-pointer ${
                              activeImageIndex === idx 
                                ? 'border-emerald-600 ring-2 ring-emerald-600/40 shadow-xs' 
                                : 'border-slate-200 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img 
                              src={thumbUrl} 
                              alt={`Angle ${idx + 1}`} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover" 
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedProduct.description}
              </p>

              {/* Sizes / Options */}
              <div>
                <span className="text-[11px] text-slate-500 font-medium">Select Size / Option:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedProduct.sizes.map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                        selectedSize === size 
                          ? 'bg-emerald-600 text-white border-emerald-500 font-semibold' 
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleAddToCart(selectedProduct, selectedSize, selectedColor)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
              >
                <ShoppingBag className="w-4 h-4" />
                Add to WhatsApp Bag
              </button>
            </div>
          </div>
        )}

        {/* Cart Drawer */}
        {isCartDrawerOpen && (
          <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-xs flex flex-col justify-end p-2 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 max-h-[85%] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-700" />
                  <h3 className="font-bold text-slate-900 text-sm">Your WhatsApp Bag</h3>
                </div>
                <button 
                  onClick={() => setIsCartDrawerOpen(false)} 
                  className="p-1 text-slate-400 hover:text-slate-800 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="py-8 text-center text-slate-500 space-y-2">
                  <p className="text-xs">Your bag is empty.</p>
                  <button
                    onClick={() => {
                      setIsCartDrawerOpen(false);
                      onSendMessage('Show me the store catalog');
                    }}
                    className="text-xs text-emerald-700 font-semibold hover:underline"
                  >
                    Browse Collection
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 chat-scrollbar">
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-2 min-w-0">
                          <img 
                            src={item.product.image} 
                            alt={item.product.name} 
                            className="w-10 h-10 rounded-lg object-cover bg-white border border-slate-200"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-slate-900 truncate max-w-[130px]">
                              {item.product.name}
                            </h4>
                            <span className="text-[10px] text-slate-500">
                              {item.selectedSize}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                            <button
                              onClick={() => handleUpdateCartQuantity(idx, -1)}
                              className="px-1.5 py-0.5 text-slate-500 hover:text-slate-900"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="text-xs font-mono text-slate-800 px-1 tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateCartQuantity(idx, 1)}
                              className="px-1.5 py-0.5 text-slate-500 hover:text-slate-900"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                          <span className="text-xs font-mono font-bold text-emerald-700 tabular-nums">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span className="font-mono text-slate-800 tabular-nums">${subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>VIP Discount ({settings.activeDiscountCode})</span>
                        <span className="font-mono tabular-nums">-${discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-500">
                      <span>Express Shipping</span>
                      <span className="font-mono text-slate-800 tabular-nums">
                        {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                      <span>Total Due</span>
                      <span className="font-mono text-emerald-700 tabular-nums">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsCartDrawerOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md"
                  >
                    Proceed to Delivery &amp; Pay
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* WhatsApp In-Chat Checkout Modal (Paystack / Flutterwave / Crypto) */}
        {isCheckoutOpen && (
          <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-xs flex flex-col justify-end p-2 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 max-h-[90%] overflow-y-auto chat-scrollbar shadow-2xl">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">One-Tap WhatsApp Checkout</h3>
                </div>
                <button 
                  onClick={() => setIsCheckoutOpen(false)} 
                  className="p-1 text-slate-400 hover:text-slate-800 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="text-slate-600 text-[11px] font-medium block mb-0.5">Customer Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-600 text-[11px] font-medium block mb-0.5">WhatsApp Phone Number</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-600 text-[11px] font-medium block mb-0.5">
                    {isDigitalOnly ? 'Delivery Email (Digital Access & License)' : 'Email Address (Order Tracking)'}
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {isDigitalOnly ? (
                  <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl text-[11px] text-sky-900 flex items-start gap-2">
                    <span className="text-base">📥</span>
                    <div>
                      <strong className="block text-sky-950 font-semibold">Digital Product Order</strong>
                      <span>Direct download links and license tokens will be sent to your email instantly once payment is verified. No physical shipping required.</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-slate-600 text-[11px] font-medium block mb-0.5">Delivery Address (Street, City, State)</label>
                    <textarea
                      rows={2}
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="e.g. 14 Adeola Odeku St, Victoria Island, Lagos"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Select Multi-Gateway Payment */}
                <div>
                  <label className="text-slate-600 text-[11px] font-medium block mb-1">
                    Select Payment Method:
                  </label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto chat-scrollbar pr-0.5">
                    {/* PayPal */}
                    <label 
                      onClick={() => setPaymentMethod('paypal')}
                      className={`flex flex-col p-2 rounded-xl border cursor-pointer transition-colors ${
                        paymentMethod === 'paypal' 
                          ? 'bg-blue-50/80 border-blue-500 text-blue-950 font-semibold' 
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-[#003087] text-white font-bold text-[10px] flex items-center justify-center">P</span>
                          <span className="text-xs">PayPal (Balance &amp; Global Cards)</span>
                        </div>
                        <input 
                          type="radio" 
                          name="payMethod" 
                          checked={paymentMethod === 'paypal'} 
                          onChange={() => setPaymentMethod('paypal')} 
                          className="accent-blue-600"
                        />
                      </div>
                      {paymentMethod === 'paypal' && (
                        <span className="text-[10px] text-blue-700 font-normal mt-1 block">
                          Instant 1-tap checkout via PayPal Business gateway.
                        </span>
                      )}
                    </label>

                    {/* Stripe */}
                    <label 
                      onClick={() => setPaymentMethod('stripe')}
                      className={`flex flex-col p-2 rounded-xl border cursor-pointer transition-colors ${
                        paymentMethod === 'stripe' 
                          ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 font-semibold' 
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-[#635BFF] text-white font-bold text-[10px] flex items-center justify-center">S</span>
                          <span className="text-xs">Stripe (Cards &amp; Apple Pay)</span>
                        </div>
                        <input 
                          type="radio" 
                          name="payMethod" 
                          checked={paymentMethod === 'stripe'} 
                          onChange={() => setPaymentMethod('stripe')} 
                          className="accent-indigo-600"
                        />
                      </div>
                      {paymentMethod === 'stripe' && (
                        <span className="text-[10px] text-indigo-700 font-normal mt-1 block">
                          3D-Secure Visa, Mastercard &amp; Apple Pay supported.
                        </span>
                      )}
                    </label>

                    {/* Paystack */}
                    <label 
                      onClick={() => setPaymentMethod('paystack')}
                      className={`flex flex-col p-2 rounded-xl border cursor-pointer transition-colors ${
                        paymentMethod === 'paystack' 
                          ? 'bg-sky-50 border-sky-400 text-sky-950 font-semibold' 
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-[#0BA4DB] text-white font-bold text-[10px] flex items-center justify-center">P</span>
                          <span className="text-xs">Paystack (Cards / Bank / USSD)</span>
                        </div>
                        <input 
                          type="radio" 
                          name="payMethod" 
                          checked={paymentMethod === 'paystack'} 
                          onChange={() => setPaymentMethod('paystack')} 
                          className="accent-sky-600"
                        />
                      </div>
                    </label>

                    {/* Flutterwave */}
                    <label 
                      onClick={() => setPaymentMethod('flutterwave')}
                      className={`flex flex-col p-2 rounded-xl border cursor-pointer transition-colors ${
                        paymentMethod === 'flutterwave' 
                          ? 'bg-amber-50 border-amber-400 text-amber-950 font-semibold' 
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-[#FB9129] text-white font-bold text-[10px] flex items-center justify-center">FLW</span>
                          <span className="text-xs">Flutterwave (Pan-African &amp; M-Pesa)</span>
                        </div>
                        <input 
                          type="radio" 
                          name="payMethod" 
                          checked={paymentMethod === 'flutterwave'} 
                          onChange={() => setPaymentMethod('flutterwave')} 
                          className="accent-amber-600"
                        />
                      </div>
                    </label>

                    {/* Direct Bank Transfer */}
                    <label 
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`flex flex-col p-2 rounded-xl border cursor-pointer transition-colors ${
                        paymentMethod === 'bank_transfer' 
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold' 
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-emerald-700" />
                          <span className="text-xs">Direct Bank Payment (Domestic &amp; Wire)</span>
                        </div>
                        <input 
                          type="radio" 
                          name="payMethod" 
                          checked={paymentMethod === 'bank_transfer'} 
                          onChange={() => setPaymentMethod('bank_transfer')} 
                          className="accent-emerald-600"
                        />
                      </div>
                      {paymentMethod === 'bank_transfer' && (
                        <div className="mt-1.5 p-1.5 bg-white rounded-lg border border-emerald-200 text-[10.5px] font-mono text-emerald-900 space-y-0.5">
                          <div>Bank: <strong>{settings.merchantGateways?.bankTransfer?.bankName || 'Standard Chartered'}</strong></div>
                          <div>Acc: <strong>{settings.merchantGateways?.bankTransfer?.accountNumber || '0129482019'}</strong> ({settings.merchantGateways?.bankTransfer?.accountName || 'AURA Atelier LLC'})</div>
                          <div className="text-[9.5px] text-slate-500 font-sans">Use order number as memo · Instant confirmation</div>
                        </div>
                      )}
                    </label>

                    {/* Crypto USDT */}
                    <label 
                      onClick={() => setPaymentMethod('crypto_usdt')}
                      className={`flex flex-col p-2 rounded-xl border cursor-pointer transition-colors ${
                        paymentMethod === 'crypto_usdt' 
                          ? 'bg-purple-50 border-purple-500 text-purple-950 font-semibold' 
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-purple-600" />
                          <span className="text-xs">Crypto (USDT TRC-20 / Bitcoin / SOL)</span>
                        </div>
                        <input 
                          type="radio" 
                          name="payMethod" 
                          checked={paymentMethod === 'crypto_usdt'} 
                          onChange={() => setPaymentMethod('crypto_usdt')} 
                          className="accent-purple-600"
                        />
                      </div>
                      {paymentMethod === 'crypto_usdt' && (
                        <div className="mt-1.5 p-1.5 bg-white rounded-lg border border-purple-200 text-[10.5px] font-mono text-purple-900 space-y-0.5 truncate">
                          <div>Wallet: {settings.merchantGateways?.crypto?.usdtTrc20Address || 'TYDzsY8fFq2G2mYf6yXzUu3k5v4Hj2qP'}</div>
                          <div className="text-[9.5px] text-slate-500 font-sans">TRON TRC20 network · Instant 1-block verify</div>
                        </div>
                      )}
                    </label>

                    {/* Cash on Delivery (Physical products only) */}
                    {!isDigitalOnly && (
                      <label 
                        onClick={() => setPaymentMethod('cash_on_delivery')}
                        className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-colors ${
                          paymentMethod === 'cash_on_delivery' 
                            ? 'bg-slate-100 border-slate-400 text-slate-900 font-semibold' 
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-slate-600" />
                          <span className="text-xs">Cash on Delivery (Pay at Door)</span>
                        </div>
                        <input 
                          type="radio" 
                          name="payMethod" 
                          checked={paymentMethod === 'cash_on_delivery'} 
                          onChange={() => setPaymentMethod('cash_on_delivery')} 
                          className="accent-slate-600"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Total to Pay</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm tabular-nums">${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCompleteOrder}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-emerald-600/20"
              >
                Confirm &amp; Place Order (${total.toFixed(2)})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
