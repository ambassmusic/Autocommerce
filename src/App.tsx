import React, { useState, useEffect } from 'react';
import { 
  INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_BOT_SETTINGS, 
  INITIAL_CHAT_MESSAGES, MULTI_INDUSTRY_PRESETS,
  INITIAL_PAYMENT_GATEWAYS, INITIAL_GEMINI_KEYS,
  INITIAL_WHATSAPP_CLOUD_API, INITIAL_ADMIN_USERS, INITIAL_SUPPORT_TICKETS,
  INITIAL_AUTH_PROVIDERS
} from './data/initialData';
import { 
  Product, Order, BotSettings, ChatMessage, CartItem, 
  MarketingCampaign, OrderStatus, BusinessIndustry, AuthUser,
  PaymentGatewaysConfig, GeminiKeyRotation, WhatsAppCloudApiConfig,
  AdminUser, SupportTicket, PLAN_TIER_CONFIGS, AuthProvidersConfig
} from './types';
import { generateBotResponse } from './services/aiSalesAgent';
import { WhatsAppSimulator } from './components/WhatsAppSimulator';
import { MerchantDashboard } from './components/MerchantDashboard';
import { LandingPage } from './components/LandingPage';
import { SuperAdminConsole } from './components/SuperAdminConsole';
import { AuthModal } from './components/AuthModal';
import { sounds } from './utils/audio';
import { 
  Store, Smartphone, CheckCircle, ArrowLeft, LogOut, ShieldCheck, 
  ArrowRight, LayoutDashboard, User, Database, Cloud
} from 'lucide-react';
import { 
  subscribeToStoreProducts, 
  subscribeToStoreOrders, 
  saveStoreOrder, 
  saveStoreProduct, 
  saveStoreSettings, 
  loadStoreSettings 
} from './services/firebase';

// Helper to read persistent user session from localStorage
const getPersistedSession = (): AuthUser | null => {
  try {
    const saved = localStorage.getItem('omnichat_session');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // ignore
  }
  return null;
};

export default function App() {
  // Navigation / View State with session recovery
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getPersistedSession);
  const [activeScreen, setActiveScreen] = useState<'landing' | 'store' | 'superadmin'>(() => {
    const session = getPersistedSession();
    if (session) {
      return session.role === 'superadmin' ? 'superadmin' : 'store';
    }
    return 'landing';
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register' | 'google'>('login');

  // Super Admin States
  const [gateways, setGateways] = useState<PaymentGatewaysConfig>(INITIAL_PAYMENT_GATEWAYS);
  const [geminiKeys, setGeminiKeys] = useState<GeminiKeyRotation[]>(INITIAL_GEMINI_KEYS);
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppCloudApiConfig>(INITIAL_WHATSAPP_CLOUD_API);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(INITIAL_ADMIN_USERS);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(INITIAL_SUPPORT_TICKETS);
  const [authProviders, setAuthProviders] = useState<AuthProvidersConfig>(INITIAL_AUTH_PROVIDERS);

  // Store & Simulation States
  const [activeIndustry, setActiveIndustry] = useState<BusinessIndustry>(() => {
    return getPersistedSession()?.industry || 'fashion';
  });
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [settings, setSettings] = useState<BotSettings>(() => {
    const session = getPersistedSession();
    let waConnected = false;
    let waPhone = '';
    try {
      const waSaved = localStorage.getItem('omnichat_whatsapp_session');
      if (waSaved) {
        const parsed = JSON.parse(waSaved);
        waConnected = !!parsed.connected;
        waPhone = parsed.phone || '';
      }
    } catch {
      // ignore
    }

    if (session) {
      const tierConfig = PLAN_TIER_CONFIGS[session.planTier] || PLAN_TIER_CONFIGS.starter;
      return {
        ...INITIAL_BOT_SETTINGS,
        ownerName: session.name,
        contactEmail: session.email,
        storeName: session.businessName,
        industry: session.industry,
        planTier: session.planTier,
        whatsappConnected: waConnected,
        whatsappPhoneNumber: waPhone,
        monthlyAiRepliesLimit: tierConfig.maxAiReplies
      };
    }
    return {
      ...INITIAL_BOT_SETTINGS,
      whatsappConnected: waConnected,
      whatsappPhoneNumber: waPhone
    };
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isMobileSimulatorActive, setIsMobileSimulatorActive] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // External Firestore Cloud Storage Real-Time Multi-Tenant Sync
  useEffect(() => {
    const activeStoreId = currentUser?.id || 'default_store';

    // Real-time synchronization of store products from Firestore cloud storage (with fallback seed)
    const unsubProducts = subscribeToStoreProducts(activeStoreId, (cloudProds) => {
      if (cloudProds && cloudProds.length > 0) {
        setProducts(prev => {
          // Prevent re-render loop if list content is identical
          if (prev.length === cloudProds.length && prev[0]?.id === cloudProds[0]?.id && prev[prev.length - 1]?.id === cloudProds[cloudProds.length - 1]?.id) {
            return prev;
          }
          return cloudProds;
        });
      }
    }, INITIAL_PRODUCTS);

    // Real-time synchronization of store orders from Firestore cloud storage
    const unsubOrders = subscribeToStoreOrders(activeStoreId, (cloudOrders) => {
      if (cloudOrders && cloudOrders.length > 0) {
        setOrders(prev => {
          if (prev.length === cloudOrders.length && prev[0]?.id === cloudOrders[0]?.id) {
            return prev;
          }
          return cloudOrders;
        });
      }
    });

    // Restore cloud settings for this store
    loadStoreSettings(activeStoreId).then(cloudSettings => {
      if (cloudSettings) {
        setSettings(prev => ({
          ...prev,
          ...cloudSettings
        }));
      }
    });

    return () => {
      unsubProducts();
      unsubOrders();
    };
  }, [currentUser?.id]);

  // Synchronize live catalog with backend WhatsApp bot auto-responder
  useEffect(() => {
    const activeStoreId = currentUser?.id || 'default_store';
    if (products.length > 0) {
      fetch('/api/whatsapp/catalog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': activeStoreId
        },
        body: JSON.stringify({
          storeName: settings.storeName || 'Our WhatsApp Store',
          products: products.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: p.price,
            stock: p.stock,
            description: p.description,
            image: p.image?.startsWith('data:') ? 'uploaded_image' : p.image,
            sizes: p.sizes,
            colors: p.colors
          }))
        })
      }).catch(() => {});
    }
  }, [products, settings.storeName, currentUser?.id]);

  // Switch Business Industry
  const handleSwitchIndustry = (industry: BusinessIndustry) => {
    setActiveIndustry(industry);
    const targetPreset = MULTI_INDUSTRY_PRESETS.find(p => p.industry === industry) || MULTI_INDUSTRY_PRESETS[0];

    setProducts(targetPreset.products);
    setCart([]);
    setSettings(prev => ({
      ...prev,
      storeName: targetPreset.name,
      storeTagline: targetPreset.tagline,
      industry: targetPreset.industry
    }));

    // Sync switch to Firestore cloud
    const activeStoreId = currentUser?.id || 'default_store';
    saveStoreSettings(activeStoreId, {
      ...settings,
      storeName: targetPreset.name,
      storeTagline: targetPreset.tagline,
      industry: targetPreset.industry
    });

    const newWelcome: ChatMessage = {
      id: `welcome_${Date.now()}`,
      sender: 'bot',
      text: `Welcome to *${targetPreset.name}*! 👋\n${targetPreset.tagline}.\n\nBrowse our curated menu/catalog below or ask our AI assistant for advice:`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'catalog',
      payload: {
        products: targetPreset.products,
        quickReplies: targetPreset.products.slice(0, 3).map(p => `Check ${p.name.split(' ')[0]}`)
      },
      status: 'read'
    };

    setMessages([newWelcome]);
    showToast(`Switched active industry to ${targetPreset.name}`);
  };

  // Customer sends message in WhatsApp simulator
  const handleCustomerSendMessage = (text: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const customerMsg: ChatMessage = {
      id: `msg_cust_${Date.now()}`,
      sender: 'customer',
      text,
      timestamp,
      type: 'text',
      status: 'read'
    };

    setMessages(prev => [...prev, customerMsg]);
    setIsTyping(true);

    // Increment Gemini request telemetry
    setGeminiKeys(prev => prev.map(k => k.isPrimary ? { ...k, totalRequests: k.totalRequests + 1, lastUsedAt: 'Just now' } : k));

    setTimeout(() => {
      const botReply = generateBotResponse(text, {
        products,
        cart,
        settings,
        orders
      });

      setMessages(prev => [...prev, botReply]);
      setIsTyping(false);
      sounds.playMessagePop();

      // If the conversation generated an order confirmation, persist it to cloud & backend
      if (botReply.payload?.order && botReply.type === 'order_confirmation') {
        handleNewOrder(botReply.payload.order);
      }
    }, 450);
  };

  // Customer completes checkout in WhatsApp simulator
  const handleNewOrder = (newOrder: Order) => {
    setOrders(prev => {
      const exists = prev.some(o => o.id === newOrder.id || o.orderNumber === newOrder.orderNumber);
      if (exists) return prev;
      return [newOrder, ...prev];
    });

    setProducts(prev => prev.map(p => {
      const purchasedItem = newOrder.items.find(i => i.product.id === p.id);
      if (purchasedItem) {
        return { ...p, stock: Math.max(0, p.stock - purchasedItem.quantity) };
      }
      return p;
    }));

    // Persist new order into external Firestore cloud storage and backend order engine
    const activeStoreId = currentUser?.id || 'default_store';
    saveStoreOrder(activeStoreId, newOrder);

    fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': activeStoreId
      },
      body: JSON.stringify(newOrder)
    }).catch(() => {});

    sounds.playOrderChime();
    showToast(`🎉 New WhatsApp Order ${newOrder.orderNumber} ($${newOrder.total.toFixed(2)}) via ${newOrder.paymentMethod.toUpperCase()}! Stored in Cloud.`);
  };

  // Merchant changes status or clicks "Notify Customer" from CRM
  const handleOrderStatusUpdate = (order: Order, newStatus: OrderStatus) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedOrder: Order = {
      ...order,
      status: newStatus,
      updatedAt: 'Just now'
    };

    setOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));

    // Persist status change to external Firestore cloud storage
    const activeStoreId = currentUser?.id || 'default_store';
    saveStoreOrder(activeStoreId, updatedOrder);

    const statusLabels: Record<OrderStatus, string> = {
      new: 'Order Confirmed',
      paid: 'Payment Verified via Gateway',
      packing: 'Packaging In Progress',
      shipping: 'Dispatched with Courier',
      delivered: 'Delivered Successfully',
      cancelled: 'Order Cancelled'
    };

    const trackingMsg: ChatMessage = {
      id: `bot_status_${Date.now()}`,
      sender: 'bot',
      text: `📦 *Status Update for ${order.orderNumber}*\n\nStatus: *${statusLabels[newStatus]}*\nCourier Tracking: *${order.trackingNumber || 'Pending dispatch'}*\n\nYour order is on schedule! Reply here for live support.`,
      timestamp: now,
      type: 'status_update',
      payload: {
        order: updatedOrder
      },
      status: 'read'
    };

    setMessages(prev => [...prev, trackingMsg]);
    sounds.playMessagePop();
    showToast(`WhatsApp status notification sent to ${order.customerName} (${statusLabels[newStatus]})`);
  };

  // Merchant sends broadcast marketing campaign
  const handleSendBotBroadcast = (campaign: MarketingCampaign) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const featured = products.find(p => p.id === campaign.featuredProductId) || products[0];

    const broadcastMsg: ChatMessage = {
      id: `broadcast_${Date.now()}`,
      sender: 'bot',
      text: `📢 *${campaign.title}*\n\n${campaign.message}\n\nTap below to claim or view details:`,
      timestamp: now,
      type: 'product_card',
      payload: {
        product: featured,
        quickReplies: [`Claim Promo on ${featured.name.split(' ')[0]}`, 'View Current Collection', 'Ask Sizing Advice']
      },
      status: 'read'
    };

    setMessages(prev => [...prev, broadcastMsg]);
    sounds.playMessagePop();
    showToast(`Broadcast "${campaign.title}" dispatched to WhatsApp phone simulator!`);
    setIsMobileSimulatorActive(true);
  };

  const handleSendCustomWhatsAppMessage = (text: string, type: 'text' | 'appointment_booking' | 'follow_up_reminder' | 'product_card' = 'text') => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: ChatMessage = {
      id: `msg_custom_${Date.now()}`,
      sender: 'bot',
      text,
      timestamp,
      type: type === 'appointment_booking' ? 'appointment_booking' : 'text',
      payload: type === 'appointment_booking' ? {
        appointment: {
          id: `app_remind_${Date.now()}`,
          customerName: 'Valued Customer',
          customerPhone: settings.whatsappPhoneNumber,
          serviceName: settings.industry === 'beauty_services' ? 'Hydra-Infusion Glow Facial (60 Mins)' : 'VIP Styling & Fitting Consultation',
          providerName: 'Senior Specialist',
          date: 'Tomorrow, 02:00 PM',
          time: '02:00 PM',
          price: 160,
          status: 'confirmed'
        },
        quickReplies: ['Confirm Attendance', 'Reschedule Slot', 'Ask Question']
      } : undefined,
      status: 'read'
    };
    setMessages(prev => [...prev, newMsg]);
    sounds.playMessagePop();
  };

  const handleResetChat = () => {
    setMessages(INITIAL_CHAT_MESSAGES);
    setCart([]);
    showToast('WhatsApp conversation and cart reset to initial demo state.');
  };

  const handleAuthenticate = (user: AuthUser) => {
    try {
      localStorage.setItem('omnichat_session', JSON.stringify(user));
    } catch {
      // ignore
    }
    setCurrentUser(user);

    let waConnected = false;
    let waPhone = '';
    try {
      const waSaved = localStorage.getItem('omnichat_whatsapp_session');
      if (waSaved) {
        const parsed = JSON.parse(waSaved);
        waConnected = !!parsed.connected;
        waPhone = parsed.phone || '';
      }
    } catch {
      // ignore
    }

    const tierConfig = PLAN_TIER_CONFIGS[user.planTier] || PLAN_TIER_CONFIGS.starter;
    setSettings(prev => ({
      ...prev,
      ownerName: user.name,
      contactEmail: user.email,
      storeName: user.businessName,
      industry: user.industry,
      planTier: user.planTier,
      whatsappConnected: waConnected,
      whatsappPhoneNumber: waPhone,
      monthlyAiRepliesLimit: tierConfig.maxAiReplies
    }));

    if (user.role === 'superadmin') {
      setActiveScreen('superadmin');
      showToast(`Welcome back, ${user.name}! Super Admin Console unlocked.`);
    } else {
      setActiveScreen('store');
      handleSwitchIndustry(user.industry);
      showToast(`Welcome, ${user.name}! ${user.businessName} on ${tierConfig.name} is ready.`);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('omnichat_session');
      localStorage.removeItem('omnichat_whatsapp_session');
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setSettings({
      ...INITIAL_BOT_SETTINGS,
      whatsappConnected: false,
      whatsappPhoneNumber: ''
    });
    setActiveScreen('landing');
    showToast('Signed out successfully. Session ended.');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-emerald-400 animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle className="w-4 h-4 shrink-0 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* VIEW 1: MULTIBILLION LANDING PAGE */}
      {activeScreen === 'landing' && (
        <LandingPage
          onOpenAuth={(mode) => {
            setAuthInitialMode(mode || 'login');
            setIsAuthModalOpen(true);
          }}
          onLaunchDemo={(ind) => {
            if (ind) handleSwitchIndustry(ind);
            setActiveScreen('store');
          }}
          onOpenAdmin={() => setActiveScreen('superadmin')}
        />
      )}

      {/* VIEW 2: SUPER ADMIN CONSOLE */}
      {activeScreen === 'superadmin' && (
        <SuperAdminConsole
          gateways={gateways}
          setGateways={setGateways}
          geminiKeys={geminiKeys}
          setGeminiKeys={setGeminiKeys}
          whatsappConfig={whatsappConfig}
          setWhatsappConfig={setWhatsappConfig}
          adminUsers={adminUsers}
          setAdminUsers={setAdminUsers}
          supportTickets={supportTickets}
          setSupportTickets={setSupportTickets}
          authProviders={authProviders}
          setAuthProviders={setAuthProviders}
          onBackToApp={() => setActiveScreen('store')}
          onToast={showToast}
        />
      )}

      {/* VIEW 3: LIVE MERCHANT STORE & WHATSAPP SIMULATOR */}
      {activeScreen === 'store' && (
        <div className="min-h-screen flex flex-col bg-slate-100/70">
          {/* Top Bar with Navigation back to Landing & SuperAdmin */}
          <div className="border-b border-slate-200 bg-white px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs shadow-xs sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveScreen('landing')}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 font-semibold transition-colors cursor-pointer"
                title="Back to Landing Page"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Landing Page</span>
              </button>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <Store className="w-4 h-4 text-emerald-600" />
                <span>OmniChat Commerce</span>
              </div>
            </div>

            {/* Top Right Quick Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Phone Toggle */}
              <button
                onClick={() => setIsMobileSimulatorActive(!isMobileSimulatorActive)}
                className="lg:hidden px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-semibold flex items-center gap-1.5 transition-colors text-xs cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{isMobileSimulatorActive ? 'View CRM' : 'View Phone'}</span>
              </button>

              <button
                onClick={() => setActiveScreen('superadmin')}
                className="hidden sm:flex px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-bold items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </button>

              {currentUser ? (
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200 text-slate-700">
                  <div className="text-right hidden sm:block">
                    <span className="font-bold text-slate-900 block leading-tight">{currentUser.name}</span>
                    <span className="text-[10px] text-emerald-700 font-semibold font-mono uppercase">
                      {currentUser.planTier} Plan
                    </span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="px-2.5 py-1 text-slate-600 hover:text-rose-600 rounded-lg hover:bg-rose-50 border border-slate-200 flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Sign Out</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Dual-Pane Workspace */}
          <div className="flex-1 max-w-[1720px] w-full mx-auto p-3 sm:p-5 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* LEFT / CENTER: Merchant Operations Dashboard with its own persistent Left Sidebar Navigation */}
            <div className={`lg:col-span-7 xl:col-span-8 flex flex-col h-[850px] ${isMobileSimulatorActive ? 'hidden lg:flex' : 'flex'}`}>
              <MerchantDashboard
                products={products}
                setProducts={setProducts}
                orders={orders}
                setOrders={setOrders}
                settings={settings}
                setSettings={setSettings}
                onSendBotBroadcast={handleSendBotBroadcast}
                onSendOrderStatusUpdate={handleOrderStatusUpdate}
                onSendCustomWhatsAppMessage={handleSendCustomWhatsAppMessage}
                onSwitchIndustry={handleSwitchIndustry}
                onOpenSuperAdmin={() => setActiveScreen('superadmin')}
                onToggleMobileSimulator={() => setIsMobileSimulatorActive(!isMobileSimulatorActive)}
                isMobileSimulatorActive={isMobileSimulatorActive}
                onToast={showToast}
              />
            </div>

            {/* RIGHT: Authentic WhatsApp Smartphone Simulator */}
            <div className={`lg:col-span-5 xl:col-span-4 flex flex-col items-center justify-center ${isMobileSimulatorActive ? 'flex' : 'hidden lg:flex'}`}>
              <div className="w-full flex flex-col items-center">
                <div className="w-full max-w-[420px] mb-2 px-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Live Customer Phone</span>
                  </span>
                  <span className="text-slate-400">WhatsApp Business Light UI</span>
                </div>

                <WhatsAppSimulator
                  products={products}
                  cart={cart}
                  setCart={setCart}
                  messages={messages}
                  setMessages={setMessages}
                  settings={settings}
                  orders={orders}
                  onNewOrder={handleNewOrder}
                  onSendMessage={handleCustomerSendMessage}
                  isTyping={isTyping}
                  onResetChat={handleResetChat}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authInitialMode}
        authProviders={authProviders}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthenticate={handleAuthenticate}
      />
    </div>
  );
}
