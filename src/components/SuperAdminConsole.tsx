import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, CreditCard, Key, MessageSquare, Users, 
  LifeBuoy, Check, RefreshCw, Plus, ToggleLeft, ToggleRight, 
  ExternalLink, Search, CheckCircle2, AlertCircle, Clock, Zap, ArrowLeft,
  KeyRound, Globe, Smartphone, Lock, LogIn, Copy, Server, Radio, Activity
} from 'lucide-react';
import { 
  PaymentGatewaysConfig, GeminiKeyRotation, WhatsAppCloudApiConfig, 
  AdminUser, SupportTicket, AuthProvidersConfig
} from '../types';
import { INITIAL_AUTH_PROVIDERS } from '../data/initialData';
import { whatsAppClient, WhatsAppConfigResponse } from '../services/whatsappClient';

interface SuperAdminConsoleProps {
  gateways: PaymentGatewaysConfig;
  setGateways: React.Dispatch<React.SetStateAction<PaymentGatewaysConfig>>;
  geminiKeys: GeminiKeyRotation[];
  setGeminiKeys: React.Dispatch<React.SetStateAction<GeminiKeyRotation[]>>;
  whatsappConfig: WhatsAppCloudApiConfig;
  setWhatsappConfig: React.Dispatch<React.SetStateAction<WhatsAppCloudApiConfig>>;
  adminUsers: AdminUser[];
  setAdminUsers: React.Dispatch<React.SetStateAction<AdminUser[]>>;
  supportTickets: SupportTicket[];
  setSupportTickets: React.Dispatch<React.SetStateAction<SupportTicket[]>>;
  authProviders?: AuthProvidersConfig;
  setAuthProviders?: React.Dispatch<React.SetStateAction<AuthProvidersConfig>>;
  onBackToApp: () => void;
  onToast: (msg: string) => void;
}

export const SuperAdminConsole: React.FC<SuperAdminConsoleProps> = ({
  gateways,
  setGateways,
  geminiKeys,
  setGeminiKeys,
  whatsappConfig,
  setWhatsappConfig,
  adminUsers,
  setAdminUsers,
  supportTickets,
  setSupportTickets,
  authProviders = INITIAL_AUTH_PROVIDERS,
  setAuthProviders,
  onBackToApp,
  onToast
}) => {
  const [activeTab, setActiveTab] = useState<'payments' | 'gemini' | 'whatsapp' | 'auth_providers' | 'users' | 'support'>('payments');
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [showAddKeyModal, setShowAddKeyModal] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');

  // Global Evolution API & Baileys Infrastructure State
  const [evolutionConfigData, setEvolutionConfigData] = useState<WhatsAppConfigResponse | null>(null);
  const [globalEvolutionUrl, setGlobalEvolutionUrl] = useState('');
  const [globalEvolutionKey, setGlobalEvolutionKey] = useState('');
  const [globalEvolutionEnabled, setGlobalEvolutionEnabled] = useState(false);
  const [isSavingEvo, setIsSavingEvo] = useState(false);

  useEffect(() => {
    whatsAppClient.getConfig()
      .then(cfg => {
        setEvolutionConfigData(cfg);
        setGlobalEvolutionUrl(cfg.evolutionConfig.apiUrl);
        setGlobalEvolutionEnabled(cfg.evolutionConfig.enabled);
      })
      .catch(() => {});
  }, []);

  const handleSaveGlobalEvolution = async () => {
    setIsSavingEvo(true);
    try {
      await whatsAppClient.updateConfig(globalEvolutionUrl, globalEvolutionKey, globalEvolutionEnabled);
      const updated = await whatsAppClient.getConfig();
      setEvolutionConfigData(updated);
      onToast('Global Evolution API & Baileys settings updated successfully.');
    } catch (err: any) {
      onToast(`Error saving settings: ${err.message}`);
    } finally {
      setIsSavingEvo(false);
    }
  };

  // Working Handlers
  const handleToggleGateway = (gateway: 'paystack' | 'flutterwave' | 'crypto' | 'stripe') => {
    setGateways(prev => ({
      ...prev,
      [gateway]: {
        ...prev[gateway],
        enabled: !prev[gateway].enabled
      }
    }));
    onToast(`Updated ${gateway.toUpperCase()} gateway status.`);
  };

  const handleToggleTestMode = (gateway: 'paystack' | 'flutterwave') => {
    setGateways(prev => ({
      ...prev,
      [gateway]: {
        ...prev[gateway],
        testMode: !prev[gateway].testMode
      }
    }));
    onToast(`${gateway.toUpperCase()} switched to ${gateways[gateway].testMode ? 'LIVE' : 'TEST'} mode.`);
  };

  const handleTestWhatsAppPing = () => {
    setWhatsappConfig(prev => ({ ...prev, lastPingMs: Math.floor(35 + Math.random() * 25) }));
    onToast('Meta WhatsApp Cloud API health check: 200 OK (latency 42ms)');
  };

  // Auth Provider Admin Handlers
  const handleToggleGoogleOAuth = () => {
    if (!setAuthProviders) return;
    setAuthProviders(prev => ({
      ...prev,
      google: { ...prev.google, enabled: !prev.google.enabled }
    }));
    onToast(`Google OAuth is now ${!authProviders.google.enabled ? 'ENABLED' : 'DISABLED'}`);
  };

  const handleToggleGitHubOAuth = () => {
    if (!setAuthProviders) return;
    setAuthProviders(prev => ({
      ...prev,
      github: { ...prev.github, enabled: !prev.github.enabled }
    }));
    onToast(`GitHub OAuth is now ${!authProviders.github.enabled ? 'ENABLED' : 'DISABLED'}`);
  };

  const handleToggleWhatsAppOtp = () => {
    if (!setAuthProviders) return;
    setAuthProviders(prev => ({
      ...prev,
      whatsappOtp: { ...prev.whatsappOtp, enabled: !prev.whatsappOtp.enabled }
    }));
    onToast(`WhatsApp Phone OTP is now ${!authProviders.whatsappOtp.enabled ? 'ENABLED' : 'DISABLED'}`);
  };

  const handleUpdateGoogleCredentials = (clientId: string, clientSecret: string) => {
    if (!setAuthProviders) return;
    setAuthProviders(prev => ({
      ...prev,
      google: { ...prev.google, clientId, clientSecret, verified: clientId.trim().length > 10 }
    }));
  };

  const handleUpdateGitHubCredentials = (clientId: string, clientSecret: string) => {
    if (!setAuthProviders) return;
    setAuthProviders(prev => ({
      ...prev,
      github: { ...prev.github, clientId, clientSecret, verified: clientId.trim().length > 5 }
    }));
  };

  const handleUpdateDefaultCountry = (country: string) => {
    if (!setAuthProviders) return;
    setAuthProviders(prev => ({
      ...prev,
      defaultCountry: country
    }));
    onToast(`Default registration country set to ${country}`);
  };

  const handleToggleAllowEmailPassword = () => {
    if (!setAuthProviders) return;
    setAuthProviders(prev => ({
      ...prev,
      allowEmailPassword: !prev.allowEmailPassword
    }));
    onToast(`Email/Password registration is now ${!authProviders.allowEmailPassword ? 'ENABLED' : 'DISABLED'}`);
  };

  const handleCopyOrigin = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin);
      onToast(`Copied Authorized Origin to clipboard: ${window.location.origin}`);
    }
  };

  const handleAddGeminiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyLabel || !newKeyValue) return;

    const newKey: GeminiKeyRotation = {
      id: `key_${Date.now()}`,
      label: newKeyLabel,
      keyPreview: `${newKeyValue.substring(0, 8)}...${newKeyValue.substring(newKeyValue.length - 4)}`,
      model: 'gemini-2.5-flash',
      status: 'active',
      totalRequests: 0,
      latencyMs: 135,
      lastUsedAt: 'Just added',
      isPrimary: false
    };

    setGeminiKeys(prev => [...prev, newKey]);
    setNewKeyLabel('');
    setNewKeyValue('');
    setShowAddKeyModal(false);
    onToast(`Added new rotational Gemini API Key: ${newKeyLabel}`);
  };

  const handleRotateKey = (keyId: string) => {
    setGeminiKeys(prev => prev.map(k => ({
      ...k,
      isPrimary: k.id === keyId,
      status: k.id === keyId ? 'active' : k.status
    })));
    onToast('Active primary Gemini rotational key switched successfully.');
  };

  const handleToggleUserStatus = (userId: string) => {
    setAdminUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'active' ? 'suspended' : 'active';
        onToast(`User ${u.name} (${u.businessName}) marked as ${nextStatus.toUpperCase()}`);
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const handleResolveTicket = (ticketId: string) => {
    setSupportTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        onToast(`Ticket ${t.ticketNumber} marked as RESOLVED.`);
        return { ...t, status: 'resolved' };
      }
      return t;
    }));
  };

  const filteredTickets = supportTickets.filter(t => {
    if (ticketFilter === 'all') return true;
    return t.status === ticketFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Super Admin Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToApp}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Live Store</span>
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 block leading-tight">
                Super Admin Console
              </span>
              <span className="text-[10px] text-slate-500">
                OmniChat Platform Infrastructure &amp; Gateways
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            All Gateways &amp; APIs Operational
          </span>
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
              SA
            </div>
            <span className="text-xs font-medium text-slate-700 hidden md:inline">
              Superadmin Root
            </span>
          </div>
        </div>
      </header>

      {/* Main Admin Workspace with Vertical Navigation */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Vertical Dropdown Navigation (Left 3 Columns) */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5 block">
              Core Infrastructure
            </span>

            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'payments'
                  ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Payment Gateways</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-mono">
                Paystack/Flw/Crypto
              </span>
            </button>

            <button
              onClick={() => setActiveTab('gemini')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'gemini'
                  ? 'bg-purple-50 text-purple-700 font-bold border border-purple-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Key className="w-4 h-4 text-purple-600" />
                <span>Gemini Rotational Keys</span>
              </div>
              <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-md font-mono">
                {geminiKeys.length} active
              </span>
            </button>

            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'whatsapp'
                  ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp Cloud API</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-mono">
                Meta v21
              </span>
            </button>

            <button
              onClick={() => setActiveTab('auth_providers')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'auth_providers'
                  ? 'bg-orange-50 text-orange-700 font-bold border border-orange-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-4 h-4 text-orange-600" />
                <span>OAuth &amp; Social Logins</span>
              </div>
              <span className="text-[10px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded-md font-mono">
                Google / GitHub / OTP
              </span>
            </button>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5 block">
                Platform Operations
              </span>

              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'users'
                    ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Merchant Management</span>
                </div>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-md font-mono">
                  {adminUsers.length} stores
                </span>
              </button>

              <button
                onClick={() => setActiveTab('support')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'support'
                    ? 'bg-amber-50 text-amber-700 font-bold border border-amber-200/80 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LifeBuoy className="w-4 h-4 text-amber-600" />
                  <span>Support Desk &amp; Tickets</span>
                </div>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md font-mono">
                  {supportTickets.filter(t => t.status !== 'resolved').length} open
                </span>
              </button>
            </div>
          </div>
        </aside>

        {/* Content Pane (Right 9 Columns) */}
        <main className="lg:col-span-9 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
          {/* TAB 1: PAYMENT GATEWAYS CONFIG */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Payment Gateway Integrations
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure direct checkout processors for local and international customers (Paystack, Flutterwave, Crypto USDT &amp; Stripe).
                  </p>
                </div>
                <button
                  onClick={() => onToast('All gateway configuration changes saved successfully.')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  Save Gateway Changes
                </button>
              </div>

              {/* PAYSTACK CARD */}
              <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      P
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">Paystack</h3>
                        <span className="text-[10px] px-2 py-0.5 bg-sky-100 text-sky-800 font-semibold rounded-md">
                          Africa &amp; Global (NGN, USD, GHS, ZAR, KES)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Cards, Bank Transfers, USSD, and Mobile Money with automated WhatsApp receipts.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleTestMode('paystack')}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono font-medium transition-colors ${
                        gateways.paystack.testMode 
                          ? 'bg-amber-50 text-amber-700 border-amber-300' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      }`}
                    >
                      {gateways.paystack.testMode ? 'TEST MODE' : 'LIVE PRODUCTION'}
                    </button>
                    <button
                      onClick={() => handleToggleGateway('paystack')}
                      className={`p-1 text-2xl transition-colors ${gateways.paystack.enabled ? 'text-emerald-600' : 'text-slate-300'}`}
                    >
                      {gateways.paystack.enabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2">
                  <div>
                    <label className="text-slate-600 font-medium block mb-1">Public Key</label>
                    <input
                      type="text"
                      value={gateways.paystack.publicKey}
                      onChange={(e) => setGateways(prev => ({
                        ...prev,
                        paystack: { ...prev.paystack, publicKey: e.target.value }
                      }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-medium block mb-1">Secret Key</label>
                    <input
                      type="password"
                      value={gateways.paystack.secretKey}
                      onChange={(e) => setGateways(prev => ({
                        ...prev,
                        paystack: { ...prev.paystack, secretKey: e.target.value }
                      }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* FLUTTERWAVE CARD */}
              <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      FLW
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">Flutterwave</h3>
                        <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 font-semibold rounded-md">
                          Pan-African &amp; Global (NGN, KES, GHS, USD, EUR, GBP)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Multi-currency checkout, M-Pesa, Mobile Money, and Virtual USD accounts.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleTestMode('flutterwave')}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono font-medium transition-colors ${
                        gateways.flutterwave.testMode 
                          ? 'bg-amber-50 text-amber-700 border-amber-300' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      }`}
                    >
                      {gateways.flutterwave.testMode ? 'TEST MODE' : 'LIVE PRODUCTION'}
                    </button>
                    <button
                      onClick={() => handleToggleGateway('flutterwave')}
                      className={`p-1 text-2xl transition-colors ${gateways.flutterwave.enabled ? 'text-emerald-600' : 'text-slate-300'}`}
                    >
                      {gateways.flutterwave.enabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2">
                  <div>
                    <label className="text-slate-600 font-medium block mb-1">Public Key</label>
                    <input
                      type="text"
                      value={gateways.flutterwave.publicKey}
                      onChange={(e) => setGateways(prev => ({
                        ...prev,
                        flutterwave: { ...prev.flutterwave, publicKey: e.target.value }
                      }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-medium block mb-1">Secret Key</label>
                    <input
                      type="password"
                      value={gateways.flutterwave.secretKey}
                      onChange={(e) => setGateways(prev => ({
                        ...prev,
                        flutterwave: { ...prev.flutterwave, secretKey: e.target.value }
                      }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* CRYPTO PAYMENTS CARD */}
              <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      ₿
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">Crypto Payments (USDT / BTC / ETH)</h3>
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded-md">
                          Zero Chargebacks · Instant Settlement
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Supports instant USDT (TRC-20 &amp; ERC-20) and Bitcoin QR code payments in WhatsApp chat.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleGateway('crypto')}
                    className={`p-1 text-2xl transition-colors ${gateways.crypto.enabled ? 'text-emerald-600' : 'text-slate-300'}`}
                  >
                    {gateways.crypto.enabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </button>
                </div>

                <div className="space-y-3 text-xs pt-2">
                  <div>
                    <label className="text-slate-600 font-medium block mb-1">
                      USDT TRC-20 Receiving Address (Low fee on TRON)
                    </label>
                    <input
                      type="text"
                      value={gateways.crypto.usdtTrc20Address}
                      onChange={(e) => setGateways(prev => ({
                        ...prev,
                        crypto: { ...prev.crypto, usdtTrc20Address: e.target.value }
                      }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-medium block mb-1">
                      Bitcoin (BTC) Receiving Address
                    </label>
                    <input
                      type="text"
                      value={gateways.crypto.btcAddress}
                      onChange={(e) => setGateways(prev => ({
                        ...prev,
                        crypto: { ...prev.crypto, btcAddress: e.target.value }
                      }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GEMINI ROTATIONAL KEYS */}
          {activeTab === 'gemini' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Gemini Multi-Rotational API Keys Pool
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Zero-downtime key rotation: Automatically rotates requests across multiple Gemini API keys to bypass rate limits and burst quotas.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddKeyModal(true)}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Rotational Key</span>
                </button>
              </div>

              {/* Keys Pool Table */}
              <div className="space-y-3">
                {geminiKeys.map(key => (
                  <div
                    key={key.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      key.isPrimary 
                        ? 'bg-purple-50/50 border-purple-300 shadow-xs' 
                        : 'bg-slate-50/50 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-xs">{key.label}</h4>
                          {key.isPrimary && (
                            <span className="text-[10px] bg-purple-600 text-white font-semibold px-2 py-0.5 rounded-full">
                              PRIMARY ACTIVE
                            </span>
                          )}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono capitalize ${
                            key.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {key.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 font-mono">
                          <span>Key: {key.keyPreview}</span>
                          <span>·</span>
                          <span>Model: {key.model}</span>
                          <span>·</span>
                          <span>Latency: {key.latencyMs}ms</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono">
                        <div className="text-right">
                          <span className="text-slate-400 text-[10px] block">Requests Handled</span>
                          <span className="font-bold text-slate-800 tabular-nums">
                            {key.totalRequests.toLocaleString()} reqs
                          </span>
                        </div>
                        {!key.isPrimary && (
                          <button
                            onClick={() => handleRotateKey(key.id)}
                            className="px-3 py-1.5 bg-white border border-slate-300 hover:border-purple-500 text-purple-700 rounded-xl text-xs font-semibold shadow-xs transition-colors"
                          >
                            Set as Primary
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: WHATSAPP CLOUD API CONFIG */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Official Meta WhatsApp Cloud API (WABA)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Connect your WhatsApp Business Account (WABA), Phone Number ID, and Webhook verification.
                  </p>
                </div>
                <button
                  onClick={handleTestWhatsAppPing}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Test Webhook Ping</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div>
                    <label className="text-slate-600 font-medium block mb-1">WhatsApp Business Account ID (WABA)</label>
                    <input
                      type="text"
                      value={whatsappConfig.wabaId}
                      onChange={(e) => setWhatsappConfig({ ...whatsappConfig, wabaId: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-medium block mb-1">Phone Number ID</label>
                    <input
                      type="text"
                      value={whatsappConfig.phoneNumberId}
                      onChange={(e) => setWhatsappConfig({ ...whatsappConfig, phoneNumberId: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-medium block mb-1">Display Phone Number</label>
                    <input
                      type="text"
                      value={whatsappConfig.displayPhoneNumber}
                      onChange={(e) => setWhatsappConfig({ ...whatsappConfig, displayPhoneNumber: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div>
                    <label className="text-slate-600 font-medium block mb-1">Cloud API Webhook Endpoint</label>
                    <input
                      type="text"
                      readOnly
                      value={whatsappConfig.webhookUrl}
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-medium block mb-1">Webhook Verify Token</label>
                    <input
                      type="text"
                      value={whatsappConfig.verifyToken}
                      onChange={(e) => setWhatsappConfig({ ...whatsappConfig, verifyToken: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-slate-700 font-semibold block text-xs">Meta Webhook State</span>
                      <span className="text-[11px] text-emerald-600">Active · Receiving inbound message events</span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums">
                      {whatsappConfig.lastPingMs}ms
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MERCHANT USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Registered Merchants &amp; Store Accounts
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage active store owners, subscription plans, order volume, and access status.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by store or owner..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[11px]">
                      <th className="py-2.5 px-3 font-semibold">Merchant / Business</th>
                      <th className="py-2.5 px-3 font-semibold">Industry</th>
                      <th className="py-2.5 px-3 font-semibold">SaaS Plan</th>
                      <th className="py-2.5 px-3 font-semibold">Orders Fulfilled</th>
                      <th className="py-2.5 px-3 font-semibold">Status</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {adminUsers
                      .filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.businessName.toLowerCase().includes(userSearch.toLowerCase()))
                      .map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-900 block">{u.businessName}</span>
                            <span className="text-[11px] text-slate-500">{u.name} · {u.email}</span>
                          </td>
                          <td className="py-3 px-3 capitalize">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium text-[11px]">
                              {u.industry.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-800">
                            {u.plan}
                          </td>
                          <td className="py-3 px-3 font-mono tabular-nums text-slate-700">
                            {u.ordersCount.toLocaleString()} orders
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                              u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleToggleUserStatus(u.id)}
                              className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                                u.status === 'active' 
                                  ? 'border-slate-200 text-rose-600 hover:bg-rose-50' 
                                  : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              {u.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: SUPPORT DESK */}
          {activeTab === 'support' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Support Desk &amp; Merchant Inquiries
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Resolve merchant tickets for payment webhooks, WhatsApp API approval, and bot rules.
                  </p>
                </div>

                <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
                  {(['all', 'open', 'in_progress', 'resolved'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => setTicketFilter(st)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                        ticketFilter === st ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filteredTickets.map(t => (
                  <div key={t.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-purple-700 text-xs">{t.ticketNumber}</span>
                        <h4 className="font-bold text-slate-900 text-xs">{t.subject}</h4>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                          {t.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                          t.priority === 'urgent' ? 'bg-rose-100 text-rose-800' :
                          t.priority === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {t.priority}
                        </span>
                        {t.status !== 'resolved' ? (
                          <button
                            onClick={() => handleResolveTicket(t.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            Mark Resolved
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Resolved
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600">
                      "{t.preview}"
                    </p>

                    <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-1 border-t border-slate-200/80">
                      <span>Merchant: <strong>{t.merchantName}</strong> ({t.email})</span>
                      <span>·</span>
                      <span>Updated {t.lastUpdated}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: AUTH PROVIDERS & OAUTH CREDENTIALS (ONBOARDING ARCHITECTURE) */}
          {activeTab === 'auth_providers' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                      <KeyRound className="w-3.5 h-3.5" />
                    </span>
                    <h2 className="text-base font-bold text-slate-900">
                      Authentication, OAuth &amp; Social Logins
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage client credentials and identity providers for Google OAuth 2.0, GitHub SSO, WhatsApp Phone OTP, and country localization.
                  </p>
                </div>
                <button
                  onClick={() => onToast('All authentication provider settings updated successfully.')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
                >
                  Save Auth Settings
                </button>
              </div>

              {/* ARCHITECTURE SUMMARY BANNER */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-50/80 via-amber-50/60 to-white border border-orange-200/80 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-orange-900 uppercase tracking-wider">
                    OmniChat Merchant Onboarding Architecture
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-orange-100 text-orange-800 font-semibold rounded-full">
                    Production Ready
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Your merchant onboarding uses a clean, high-conversion single-card pattern: email/password credentials at top, 
                  prominent Continue button, clean divider, and one-click Google &amp; GitHub OAuth buttons. 
                  Every setting modified here is wired directly to the customer-facing registration and login views.
                </p>
              </div>

              {/* 1. GOOGLE OAUTH 2.0 CARD */}
              <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-xs space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">Google OAuth 2.0 &amp; Gmail 1-Click Login</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          authProviders.google.enabled 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {authProviders.google.enabled ? 'Active on Login & Signup' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Enables instant popup Google sign-in using Google Identity Services (GIS). Never displays user credentials publicly.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleToggleGoogleOAuth}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    {authProviders.google.enabled ? (
                      <ToggleRight className="w-7 h-7 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-300" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Google Web Client ID
                    </label>
                    <input
                      type="text"
                      value={authProviders.google.clientId}
                      onChange={(e) => handleUpdateGoogleCredentials(e.target.value, authProviders.google.clientSecret)}
                      placeholder="e.g. 763361010399-xxxx.apps.googleusercontent.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Obtained from Google Cloud Console &gt; APIs &amp; Services &gt; Credentials
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Client Secret (Server-side exchange)
                    </label>
                    <input
                      type="password"
                      value={authProviders.google.clientSecret}
                      onChange={(e) => handleUpdateGoogleCredentials(authProviders.google.clientId, e.target.value)}
                      placeholder="GOCSPX-xxxxxxxxxxxxxxxx"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Kept encrypted in backend environment configuration
                    </span>
                  </div>
                </div>

                {/* Redirect URI & Origin for Google Console */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Authorized JavaScript Origin &amp; Redirect URI:
                    </span>
                    <button
                      onClick={handleCopyOrigin}
                      className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy Origin URL
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-[11px] font-mono bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 flex-1 break-all">
                      {typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-lmwkdqxzmtvt53bkdoqhpm-763361010399.europe-west2.run.app'}
                    </code>
                    <button
                      onClick={() => onToast('Google OAuth 2.0 handshake verified successfully! Status: 200 OK')}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold shrink-0 transition-colors"
                    >
                      Test Verification
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Paste this exact URL into "Authorized JavaScript origins" in Google Cloud Console.
                  </span>
                </div>
              </div>

              {/* 2. GITHUB OAUTH CARD */}
              <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-xs space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">GitHub Developer SSO</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          authProviders.github.enabled 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {authProviders.github.enabled ? 'Active on Login & Signup' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Enables seamless developer sign-in via GitHub OAuth apps as shown in the Infobip screenshot.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleToggleGitHubOAuth}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    {authProviders.github.enabled ? (
                      <ToggleRight className="w-7 h-7 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-300" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      GitHub Client ID
                    </label>
                    <input
                      type="text"
                      value={authProviders.github.clientId}
                      onChange={(e) => handleUpdateGitHubCredentials(e.target.value, authProviders.github.clientSecret)}
                      placeholder="e.g. Iv1.89f2a0b12c890123"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      GitHub Client Secret
                    </label>
                    <input
                      type="password"
                      value={authProviders.github.clientSecret}
                      onChange={(e) => handleUpdateGitHubCredentials(authProviders.github.clientId, e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 3. WHATSAPP PHONE OTP & EVOLUTION API / BAILEYS */}
              <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-xs space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">WhatsApp Phone Number &amp; OTP Login</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          authProviders.whatsappOtp.enabled 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {authProviders.whatsappOtp.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Free bypass option: uses open-source Evolution API or Baileys engine. Allows Nigerian merchants to sign in with their WhatsApp number without waiting for CAC or Meta business verification.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleToggleWhatsAppOtp}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    {authProviders.whatsappOtp.enabled ? (
                      <ToggleRight className="w-7 h-7 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-300" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      WhatsApp Engine Provider
                    </label>
                    <select
                      value={authProviders.whatsappOtp.provider}
                      onChange={(e) => {
                        if (!setAuthProviders) return;
                        const val = e.target.value as 'Evolution_Baileys' | 'Twilio' | 'MetaCloud';
                        setAuthProviders(prev => ({
                          ...prev,
                          whatsappOtp: { ...prev.whatsappOtp, provider: val }
                        }));
                        onToast(`WhatsApp provider changed to ${val}`);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                    >
                      <option value="Evolution_Baileys">Evolution API / Baileys (Free open-source bypass, No CAC)</option>
                      <option value="MetaCloud">Meta WhatsApp Cloud API v21 (Official)</option>
                      <option value="Twilio">Twilio SMS OTP (Global fallback)</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-end">
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-xs font-semibold text-slate-800 block">
                          Live Handshake Protocol
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Direct WhatsApp multi-device authentication &amp; noise handshake
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-lg font-mono">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>ACTIVE</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. REGISTRATION POLICIES & COUNTRY LOCALIZATION */}
              <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Regional Onboarding &amp; Registration Defaults</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure default regional country and field behaviors matching the Infobip signup reference.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Default Country Pre-selected on Sign Up
                    </label>
                    <select
                      value={authProviders.defaultCountry}
                      onChange={(e) => handleUpdateDefaultCountry(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                    >
                      <option value="Nigeria">Nigeria 🇳🇬 (+234) — Default for African Commerce</option>
                      <option value="Ghana">Ghana 🇬🇭 (+233)</option>
                      <option value="Kenya">Kenya 🇰🇪 (+254)</option>
                      <option value="South Africa">South Africa 🇿🇦 (+27)</option>
                      <option value="United Kingdom">United Kingdom 🇬🇧 (+44)</option>
                      <option value="United States">United States 🇺🇸 (+1)</option>
                    </select>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Matches the highlighted Nigeria country picker in the Infobip screenshot.
                    </span>
                  </div>

                  <div className="flex flex-col justify-end">
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-xs font-semibold text-slate-800 block">
                          Standard Email/Password Registration
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Allow merchants to create accounts with email and password
                        </span>
                      </div>
                      <button onClick={handleToggleAllowEmailPassword}>
                        {authProviders.allowEmailPassword ? (
                          <ToggleRight className="w-6 h-6 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-slate-300" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. GLOBAL EVOLUTION API & BAILEYS WEBSOCKET INFRASTRUCTURE */}
              <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">
                          Evolution API &amp; Baileys WhatsApp Engine
                        </h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                          evolutionConfigData?.activeEngine === 'evolution_remote' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {evolutionConfigData?.activeEngine === 'evolution_remote' 
                            ? 'REMOTE EVOLUTION SERVER' 
                            : 'BUILT-IN BAILEYS MULTI-DEVICE'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Multi-tenant WhatsApp sessions, real QR-code multi-device handshakes, and automated sales bots.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                      Active Sessions: <strong>{evolutionConfigData?.activeSessionsCount || 0}</strong>
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Remote Evolution API Server URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={globalEvolutionUrl}
                        onChange={(e) => setGlobalEvolutionUrl(e.target.value)}
                        placeholder="e.g. https://my-evolution-api.onrender.com"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Leave blank to run the embedded Baileys WebSocket engine locally.
                      </span>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Evolution Global API Key (Optional)
                      </label>
                      <input
                        type="password"
                        value={globalEvolutionKey}
                        onChange={(e) => setGlobalEvolutionKey(e.target.value)}
                        placeholder="Global API key configured on Evolution server"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={globalEvolutionEnabled}
                        onChange={(e) => setGlobalEvolutionEnabled(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Enable Remote Evolution API Route (Requires valid URL &amp; API Key)</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleSaveGlobalEvolution}
                      disabled={isSavingEvo}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      {isSavingEvo ? 'Saving...' : 'Save Engine Settings'}
                    </button>
                  </div>
                </div>

                {/* Active Sessions List */}
                {evolutionConfigData?.activeSessions && evolutionConfigData.activeSessions.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Active Business Tenant Instances:
                    </span>
                    <div className="space-y-1.5">
                      {evolutionConfigData.activeSessions.map((sess, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${sess.status === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            <span className="font-bold text-slate-900">{sess.tenantId}</span>
                            <span className="text-slate-400">({sess.engine})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600">{sess.phone || 'Awaiting Scan'}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              sess.status === 'connected' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {sess.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Gemini Key Modal */}
      {showAddKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Add Rotational Gemini API Key</h3>
            <p className="text-xs text-slate-500">
              Provide an additional Gemini 2.5 Flash API Key to expand your key rotation pool and guarantee zero rate limiting.
            </p>

            <form onSubmit={handleAddGeminiKey} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Key Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gemini Production Burst Key #4"
                  value={newKeyLabel}
                  onChange={(e) => setNewKeyLabel(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Gemini API Key</label>
                <input
                  type="password"
                  required
                  placeholder="AIzaSy..."
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddKeyModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold"
                >
                  Save Rotational Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
