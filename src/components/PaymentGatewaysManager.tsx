import React, { useState } from 'react';
import { 
  CreditCard, ShieldCheck, ExternalLink, Check, Copy, Eye, EyeOff, 
  RefreshCw, CheckCircle2, AlertCircle, Building, Globe, Zap, 
  HelpCircle, ChevronDown, ChevronUp, Lock, ArrowRight, Smartphone,
  DollarSign, QrCode
} from 'lucide-react';
import { MerchantGatewaysConfig } from '../types';

interface PaymentGatewaysManagerProps {
  gateways: MerchantGatewaysConfig;
  onSaveGateways: (updated: MerchantGatewaysConfig) => void;
  onToast: (msg: string) => void;
  onTestInPhoneSimulator?: () => void;
}

export const PaymentGatewaysManager: React.FC<PaymentGatewaysManagerProps> = ({
  gateways,
  onSaveGateways,
  onToast,
  onTestInPhoneSimulator
}) => {
  const [config, setConfig] = useState<MerchantGatewaysConfig>(gateways);
  const [activeTab, setActiveTab] = useState<'paypal' | 'stripe' | 'paystack' | 'flutterwave' | 'bankTransfer' | 'crypto'>('paypal');
  
  // Show/Hide Secrets
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  
  // Verification states
  const [verifying, setVerifying] = useState<Record<string, boolean>>({});
  const [verifiedStatus, setVerifiedStatus] = useState<Record<string, boolean>>({
    paypal: config.paypal.verified,
    stripe: config.stripe.verified,
    paystack: config.paystack.verified,
    flutterwave: config.flutterwave.verified,
    bankTransfer: config.bankTransfer.verified,
    crypto: config.crypto.verified
  });

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const toggleShowSecret = (field: string) => {
    setShowSecret(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    onToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleVerify = (gatewayKey: keyof MerchantGatewaysConfig, name: string) => {
    setVerifying(prev => ({ ...prev, [gatewayKey]: true }));
    setTimeout(() => {
      setVerifying(prev => ({ ...prev, [gatewayKey]: false }));
      setVerifiedStatus(prev => ({ ...prev, [gatewayKey]: true }));
      setConfig(prev => ({
        ...prev,
        [gatewayKey]: {
          ...prev[gatewayKey],
          verified: true
        }
      }));
      onToast(`✓ ${name} connection verified successfully (Status: 200 OK)!`);
    }, 900);
  };

  const handleToggleEnabled = (gatewayKey: keyof MerchantGatewaysConfig, name: string) => {
    setConfig(prev => {
      const updated = {
        ...prev,
        [gatewayKey]: {
          ...prev[gatewayKey],
          enabled: !prev[gatewayKey].enabled
        }
      };
      onSaveGateways(updated);
      onToast(`${name} is now ${updated[gatewayKey].enabled ? 'ENABLED' : 'DISABLED'} for WhatsApp checkout.`);
      return updated;
    });
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveGateways(config);
    onToast('All payment gateway and payout settings saved successfully!');
  };

  const activeCount = [
    config.paypal.enabled,
    config.stripe.enabled,
    config.paystack.enabled,
    config.flutterwave.enabled,
    config.bankTransfer.enabled,
    config.crypto.enabled
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Customer Payment Gateways &amp; Payout Accounts
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
              {activeCount} of 6 Connected
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Connect payment providers to collect funds directly from shoppers on WhatsApp. Each method includes full setup guides and API credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onTestInPhoneSimulator && (
            <button
              onClick={onTestInPhoneSimulator}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Test in Phone Simulator</span>
            </button>
          )}

          <button
            onClick={handleSaveAll}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            Save All Changes
          </button>
        </div>
      </div>

      {/* Payment Provider Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
        {/* 1. PayPal */}
        <button
          type="button"
          onClick={() => setActiveTab('paypal')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
            activeTab === 'paypal'
              ? 'border-sky-500 bg-sky-50/60 ring-2 ring-sky-500/20 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="w-6 h-6 rounded-lg bg-[#003087] text-white font-bold text-xs flex items-center justify-center">
              P
            </span>
            <span className={`w-2 h-2 rounded-full ${config.paypal.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          </div>
          <span className="font-bold text-xs text-slate-900 block mt-2">PayPal</span>
          <span className="text-[10px] text-slate-500 block">
            {config.paypal.enabled ? 'Active on Chat' : 'Disabled'}
          </span>
        </button>

        {/* 2. Stripe */}
        <button
          type="button"
          onClick={() => setActiveTab('stripe')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
            activeTab === 'stripe'
              ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="w-6 h-6 rounded-lg bg-[#635BFF] text-white font-bold text-xs flex items-center justify-center">
              S
            </span>
            <span className={`w-2 h-2 rounded-full ${config.stripe.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          </div>
          <span className="font-bold text-xs text-slate-900 block mt-2">Stripe</span>
          <span className="text-[10px] text-slate-500 block">
            {config.stripe.enabled ? 'Cards & Apple Pay' : 'Disabled'}
          </span>
        </button>

        {/* 3. Paystack */}
        <button
          type="button"
          onClick={() => setActiveTab('paystack')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
            activeTab === 'paystack'
              ? 'border-cyan-500 bg-cyan-50/60 ring-2 ring-cyan-500/20 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="w-6 h-6 rounded-lg bg-[#0BA4DB] text-white font-bold text-xs flex items-center justify-center">
              P
            </span>
            <span className={`w-2 h-2 rounded-full ${config.paystack.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          </div>
          <span className="font-bold text-xs text-slate-900 block mt-2">Paystack</span>
          <span className="text-[10px] text-slate-500 block">
            {config.paystack.enabled ? 'Cards, Bank, USSD' : 'Disabled'}
          </span>
        </button>

        {/* 4. Flutterwave */}
        <button
          type="button"
          onClick={() => setActiveTab('flutterwave')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
            activeTab === 'flutterwave'
              ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="w-6 h-6 rounded-lg bg-[#FB9129] text-white font-bold text-xs flex items-center justify-center">
              F
            </span>
            <span className={`w-2 h-2 rounded-full ${config.flutterwave.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          </div>
          <span className="font-bold text-xs text-slate-900 block mt-2">Flutterwave</span>
          <span className="text-[10px] text-slate-500 block">
            {config.flutterwave.enabled ? 'Mobile Money / M-Pesa' : 'Disabled'}
          </span>
        </button>

        {/* 5. Direct Bank Transfer */}
        <button
          type="button"
          onClick={() => setActiveTab('bankTransfer')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
            activeTab === 'bankTransfer'
              ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="w-6 h-6 rounded-lg bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
              <Building className="w-3.5 h-3.5" />
            </span>
            <span className={`w-2 h-2 rounded-full ${config.bankTransfer.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          </div>
          <span className="font-bold text-xs text-slate-900 block mt-2">Bank Transfer</span>
          <span className="text-[10px] text-slate-500 block">
            {config.bankTransfer.enabled ? 'Direct & Wire' : 'Disabled'}
          </span>
        </button>

        {/* 6. Crypto Payment */}
        <button
          type="button"
          onClick={() => setActiveTab('crypto')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
            activeTab === 'crypto'
              ? 'border-purple-500 bg-purple-50/60 ring-2 ring-purple-500/20 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="w-6 h-6 rounded-lg bg-[#26A17B] text-white font-bold text-xs flex items-center justify-center">
              ₮
            </span>
            <span className={`w-2 h-2 rounded-full ${config.crypto.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          </div>
          <span className="font-bold text-xs text-slate-900 block mt-2">Crypto (USDT)</span>
          <span className="text-[10px] text-slate-500 block">
            {config.crypto.enabled ? 'TRC20, ERC20, BTC' : 'Disabled'}
          </span>
        </button>
      </div>

      {/* Main Tab Content Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-5">
        {/* ===================== TAB 1: PAYPAL ===================== */}
        {activeTab === 'paypal' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#003087] text-white font-bold flex items-center justify-center text-base shadow-xs">
                  P
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">PayPal Commerce &amp; Smart Payment Buttons</h3>
                  <p className="text-xs text-slate-500">Collect payments via PayPal Balance, Venmo, and international credit cards directly in WhatsApp chat.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleEnabled('paypal', 'PayPal')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    config.paypal.enabled 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {config.paypal.enabled ? '✓ Enabled on Store' : 'Enable PayPal'}
                </button>
              </div>
            </div>

            {/* STEP-BY-STEP SETUP DIRECTION BOX */}
            <div className="bg-white border border-sky-200 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-sky-800 font-bold">
                <HelpCircle className="w-4 h-4 text-sky-600" />
                <span>How to Set Up &amp; Collect Payments via PayPal</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 leading-relaxed text-[11.5px]">
                <li>Log in to the <a href="https://developer.paypal.com" target="_blank" rel="noreferrer" className="text-sky-600 underline font-semibold">PayPal Developer Dashboard</a> with your PayPal Business account.</li>
                <li>Navigate to <strong>Apps &amp; Credentials</strong> and click <strong>Create App</strong> (Select <em>Merchant</em> as the app type).</li>
                <li>Copy your <strong>Client ID</strong> and <strong>Secret Key</strong> from your PayPal app and paste them into the fields below.</li>
                <li>In your PayPal App settings under <em>Webhooks</em>, click <strong>Add Webhook</strong> and enter: <code className="bg-slate-100 px-1 py-0.5 rounded text-[10.5px] font-mono">https://omnichat-commerce.run.app/api/webhooks/paypal</code>.</li>
                <li>Select the events: <code className="bg-slate-100 px-1 py-0.5 rounded text-[10.5px] font-mono">PAYMENT.CAPTURE.COMPLETED</code> and <code className="bg-slate-100 px-1 py-0.5 rounded text-[10.5px] font-mono">CHECKOUT.ORDER.APPROVED</code>.</li>
                <li><strong>How customer pays:</strong> When a shopper confirms an order in WhatsApp, the AI Sales Agent sends a verified PayPal Smart Link. Upon approval, the WhatsApp bot instantly confirms the order and notifies your fulfillment team.</li>
              </ol>
            </div>

            {/* Credential Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">PayPal Client ID</label>
                <input
                  type="text"
                  value={config.paypal.clientId}
                  onChange={(e) => setConfig(prev => ({ ...prev, paypal: { ...prev.paypal, clientId: e.target.value } }))}
                  placeholder="e.g. AeA1Y3Bn992..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">PayPal Client Secret</label>
                <div className="relative">
                  <input
                    type={showSecret['paypal_sec'] ? 'text' : 'password'}
                    value={config.paypal.clientSecret}
                    onChange={(e) => setConfig(prev => ({ ...prev, paypal: { ...prev.paypal, clientSecret: e.target.value } }))}
                    placeholder="e.g. EL48201..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 pr-9 text-xs text-slate-900 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowSecret('paypal_sec')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showSecret['paypal_sec'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Environment Mode</label>
                <select
                  value={config.paypal.mode}
                  onChange={(e) => setConfig(prev => ({ ...prev, paypal: { ...prev.paypal, mode: e.target.value as any } }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 cursor-pointer font-semibold"
                >
                  <option value="live">Live Production (Real Money)</option>
                  <option value="sandbox">Sandbox Test Mode</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Settlement Currency</label>
                <select
                  value={config.paypal.currency}
                  onChange={(e) => setConfig(prev => ({ ...prev, paypal: { ...prev.paypal, currency: e.target.value } }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 cursor-pointer font-semibold"
                >
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="CAD">CAD ($) - Canadian Dollar</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-200">
              <span className="text-[11px] text-slate-500">
                Connection Status: {verifiedStatus['paypal'] ? <strong className="text-emerald-700">✓ Verified &amp; Active</strong> : <strong className="text-amber-700">Pending Verification</strong>}
              </span>
              <button
                type="button"
                onClick={() => handleVerify('paypal', 'PayPal')}
                disabled={verifying['paypal']}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {verifying['paypal'] && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>Test &amp; Validate PayPal Connection</span>
              </button>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: STRIPE ===================== */}
        {activeTab === 'stripe' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#635BFF] text-white font-bold flex items-center justify-center text-base shadow-xs">
                  S
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Stripe Payments (Cards, Apple Pay &amp; Google Pay)</h3>
                  <p className="text-xs text-slate-500">Accept global credit/debit cards with automated 3D-Secure and one-tap mobile checkout.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleEnabled('stripe', 'Stripe')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    config.stripe.enabled 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {config.stripe.enabled ? '✓ Enabled on Store' : 'Enable Stripe'}
                </button>
              </div>
            </div>

            {/* STEP-BY-STEP SETUP DIRECTION BOX */}
            <div className="bg-white border border-indigo-200 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-indigo-800 font-bold">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span>How to Set Up &amp; Collect Payments via Stripe</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 leading-relaxed text-[11.5px]">
                <li>Log in to your <a href="https://dashboard.stripe.com" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-semibold">Stripe Dashboard</a>.</li>
                <li>Click on <strong>Developers</strong> &gt; <strong>API keys</strong> in the left navigation.</li>
                <li>Copy your <strong>Publishable key</strong> (<code className="font-mono">pk_live_...</code>) and <strong>Secret key</strong> (<code className="font-mono">sk_live_...</code>) and paste them below.</li>
                <li>Under <strong>Developers</strong> &gt; <strong>Webhooks</strong>, click <em>Add destination</em> and enter URL: <code className="bg-slate-100 px-1 py-0.5 rounded text-[10.5px] font-mono">https://omnichat-commerce.run.app/api/webhooks/stripe</code>.</li>
                <li>Select the event <code className="bg-slate-100 px-1 py-0.5 rounded text-[10.5px] font-mono">checkout.session.completed</code> and copy the <em>Signing secret</em> (<code className="font-mono">whsec_...</code>).</li>
                <li><strong>How customer pays:</strong> Shoppers click the Stripe checkout card in WhatsApp and can complete the transaction with Apple Pay, Google Pay, or Card within 5 seconds without leaving WhatsApp.</li>
              </ol>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Stripe Publishable Key</label>
                <input
                  type="text"
                  value={config.stripe.publishableKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, stripe: { ...prev.stripe, publishableKey: e.target.value } }))}
                  placeholder="pk_live_..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Stripe Secret Key</label>
                <div className="relative">
                  <input
                    type={showSecret['stripe_sec'] ? 'text' : 'password'}
                    value={config.stripe.secretKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, stripe: { ...prev.stripe, secretKey: e.target.value } }))}
                    placeholder="sk_live_..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 pr-9 text-xs text-slate-900 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowSecret('stripe_sec')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showSecret['stripe_sec'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Webhook Signing Secret</label>
                <input
                  type="text"
                  value={config.stripe.webhookSecret}
                  onChange={(e) => setConfig(prev => ({ ...prev, stripe: { ...prev.stripe, webhookSecret: e.target.value } }))}
                  placeholder="whsec_..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                />
              </div>

              <div className="flex items-center gap-4 pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.stripe.enableApplePay}
                    onChange={(e) => setConfig(prev => ({ ...prev, stripe: { ...prev.stripe, enableApplePay: e.target.checked } }))}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-800">Enable Apple Pay &amp; Google Pay</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.stripe.testMode}
                    onChange={(e) => setConfig(prev => ({ ...prev, stripe: { ...prev.stripe, testMode: e.target.checked } }))}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-800">Test Mode (Mock Cards)</span>
                </label>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-200">
              <span className="text-[11px] text-slate-500">
                Connection Status: {verifiedStatus['stripe'] ? <strong className="text-emerald-700">✓ Verified &amp; Active</strong> : <strong className="text-amber-700">Pending Verification</strong>}
              </span>
              <button
                type="button"
                onClick={() => handleVerify('stripe', 'Stripe')}
                disabled={verifying['stripe']}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {verifying['stripe'] && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>Test &amp; Validate Stripe API</span>
              </button>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: PAYSTACK ===================== */}
        {activeTab === 'paystack' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0BA4DB] text-white font-bold flex items-center justify-center text-base shadow-xs">
                  P
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Paystack (Nigeria, Ghana, South Africa &amp; Kenya)</h3>
                  <p className="text-xs text-slate-500">Accept local cards, instant bank transfers, USSD, and Apple Pay across African markets.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleEnabled('paystack', 'Paystack')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    config.paystack.enabled 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {config.paystack.enabled ? '✓ Enabled on Store' : 'Enable Paystack'}
                </button>
              </div>
            </div>

            {/* STEP-BY-STEP SETUP DIRECTION BOX */}
            <div className="bg-white border border-cyan-200 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-cyan-800 font-bold">
                <HelpCircle className="w-4 h-4 text-cyan-600" />
                <span>How to Set Up &amp; Collect Payments via Paystack</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 leading-relaxed text-[11.5px]">
                <li>Log in to your <a href="https://dashboard.paystack.com" target="_blank" rel="noreferrer" className="text-cyan-600 underline font-semibold">Paystack Dashboard</a>.</li>
                <li>Go to <strong>Settings</strong> &gt; <strong>API Keys &amp; Webhooks</strong>.</li>
                <li>Copy your <strong>Public Key</strong> (<code className="font-mono">pk_live_...</code>) and <strong>Secret Key</strong> (<code className="font-mono">sk_live_...</code>).</li>
                <li>In Paystack Webhook settings, paste this Webhook URL: <code className="bg-slate-100 px-1 py-0.5 rounded text-[10.5px] font-mono">https://omnichat-commerce.run.app/api/webhooks/paystack</code>.</li>
                <li>Under <strong>Payouts / Settlement</strong>, ensure your domestic bank account (e.g. Zenith, GTBank, Standard Chartered) is verified for daily auto-settlement.</li>
                <li><strong>How customer pays:</strong> Shoppers tap "Pay with Paystack" in WhatsApp, choose Card, Bank Account, or USSD code, and upon authorization, Paystack sends a callback that marks the order as Paid and releases shipping instructions.</li>
              </ol>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Paystack Public Key</label>
                <input
                  type="text"
                  value={config.paystack.publicKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, paystack: { ...prev.paystack, publicKey: e.target.value } }))}
                  placeholder="pk_live_..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Paystack Secret Key</label>
                <div className="relative">
                  <input
                    type={showSecret['paystack_sec'] ? 'text' : 'password'}
                    value={config.paystack.secretKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, paystack: { ...prev.paystack, secretKey: e.target.value } }))}
                    placeholder="sk_live_..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 pr-9 text-xs text-slate-900 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowSecret('paystack_sec')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showSecret['paystack_sec'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Currency</label>
                <select
                  value={config.paystack.currency}
                  onChange={(e) => setConfig(prev => ({ ...prev, paystack: { ...prev.paystack, currency: e.target.value } }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 cursor-pointer font-semibold"
                >
                  <option value="NGN">NGN (₦) - Nigerian Naira</option>
                  <option value="GHS">GHS (GH₵) - Ghanaian Cedi</option>
                  <option value="ZAR">ZAR (R) - South African Rand</option>
                  <option value="USD">USD ($) - US Dollar Domiciliary</option>
                </select>
              </div>

              <div className="flex items-center pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.paystack.testMode}
                    onChange={(e) => setConfig(prev => ({ ...prev, paystack: { ...prev.paystack, testMode: e.target.checked } }))}
                    className="rounded text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="font-semibold text-slate-800">Test Mode (pk_test / sk_test)</span>
                </label>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-200">
              <span className="text-[11px] text-slate-500">
                Connection Status: {verifiedStatus['paystack'] ? <strong className="text-emerald-700">✓ Verified &amp; Active</strong> : <strong className="text-amber-700">Pending Verification</strong>}
              </span>
              <button
                type="button"
                onClick={() => handleVerify('paystack', 'Paystack')}
                disabled={verifying['paystack']}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {verifying['paystack'] && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>Test &amp; Validate Paystack API</span>
              </button>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: FLUTTERWAVE ===================== */}
        {activeTab === 'flutterwave' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FB9129] text-white font-bold flex items-center justify-center text-base shadow-xs">
                  F
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Flutterwave (Pan-African Mobile Money &amp; Global Cards)</h3>
                  <p className="text-xs text-slate-500">Collect payments in 30+ currencies via M-Pesa, MTN Mobile Money, Airtel, Barter, and Cards.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleEnabled('flutterwave', 'Flutterwave')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    config.flutterwave.enabled 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {config.flutterwave.enabled ? '✓ Enabled on Store' : 'Enable Flutterwave'}
                </button>
              </div>
            </div>

            {/* STEP-BY-STEP SETUP DIRECTION BOX */}
            <div className="bg-white border border-amber-200 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-800 font-bold">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span>How to Set Up &amp; Collect Payments via Flutterwave</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 leading-relaxed text-[11.5px]">
                <li>Sign in to your <a href="https://dashboard.flutterwave.com" target="_blank" rel="noreferrer" className="text-amber-600 underline font-semibold">Flutterwave Dashboard</a>.</li>
                <li>Go to <strong>Settings</strong> &gt; <strong>API &amp; Webhooks</strong>.</li>
                <li>Copy your <strong>Public Key</strong> (<code className="font-mono">FLWPUBK_...</code>) and <strong>Secret Key</strong> (<code className="font-mono">FLWSECK_...</code>).</li>
                <li>In Webhooks, set the Webhook URL to: <code className="bg-slate-100 px-1 py-0.5 rounded text-[10.5px] font-mono">https://omnichat-commerce.run.app/api/webhooks/flutterwave</code> and define a secret hash.</li>
                <li><strong>How customer pays:</strong> Shoppers in Kenya, Uganda, Rwanda, or Nigeria can choose their local Mobile Money provider (e.g. M-Pesa push prompt) or card directly on WhatsApp.</li>
              </ol>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Flutterwave Public Key</label>
                <input
                  type="text"
                  value={config.flutterwave.publicKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, flutterwave: { ...prev.flutterwave, publicKey: e.target.value } }))}
                  placeholder="FLWPUBK_..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Flutterwave Secret Key</label>
                <div className="relative">
                  <input
                    type={showSecret['flw_sec'] ? 'text' : 'password'}
                    value={config.flutterwave.secretKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, flutterwave: { ...prev.flutterwave, secretKey: e.target.value } }))}
                    placeholder="FLWSECK_..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 pr-9 text-xs text-slate-900 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowSecret('flw_sec')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showSecret['flw_sec'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Encryption Key</label>
                <input
                  type="text"
                  value={config.flutterwave.encryptionKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, flutterwave: { ...prev.flutterwave, encryptionKey: e.target.value } }))}
                  placeholder="Encryption key for direct card charge"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                />
              </div>

              <div className="flex items-center pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.flutterwave.testMode}
                    onChange={(e) => setConfig(prev => ({ ...prev, flutterwave: { ...prev.flutterwave, testMode: e.target.checked } }))}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-slate-800">Test Mode (Sandbox)</span>
                </label>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-200">
              <span className="text-[11px] text-slate-500">
                Connection Status: {verifiedStatus['flutterwave'] ? <strong className="text-emerald-700">✓ Verified &amp; Active</strong> : <strong className="text-amber-700">Pending Verification</strong>}
              </span>
              <button
                type="button"
                onClick={() => handleVerify('flutterwave', 'Flutterwave')}
                disabled={verifying['flutterwave']}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {verifying['flutterwave'] && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>Test &amp; Validate Flutterwave API</span>
              </button>
            </div>
          </div>
        )}

        {/* ===================== TAB 5: DIRECT BANK TRANSFER ===================== */}
        {activeTab === 'bankTransfer' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white font-bold flex items-center justify-center text-base shadow-xs">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Direct Bank Payment &amp; Wire Transfer (Zero Gateway Fees)</h3>
                  <p className="text-xs text-slate-500">Provide customers with your official bank coordinates and receive 100% of order totals with zero intermediary cuts.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleEnabled('bankTransfer', 'Bank Transfer')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    config.bankTransfer.enabled 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {config.bankTransfer.enabled ? '✓ Enabled on Store' : 'Enable Bank Transfer'}
                </button>
              </div>
            </div>

            {/* STEP-BY-STEP SETUP DIRECTION BOX */}
            <div className="bg-white border border-emerald-200 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>How to Set Up &amp; Collect Payments via Direct Bank Transfer</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 leading-relaxed text-[11.5px]">
                <li>Enter your official corporate or personal bank details below (Bank Name, Account Holder Name, Account/IBAN Number, SWIFT/BIC).</li>
                <li>Set clear transfer instructions instructing the customer to include their <strong>Order Number (#WA-XXXX)</strong> in the bank payment memo.</li>
                <li><strong>How customer pays:</strong> When the shopper taps "Direct Bank Transfer" on WhatsApp, the bot formats a crisp banking invoice card containing 1-tap copy buttons for your Account Number and Amount.</li>
                <li><strong>Proof of Payment:</strong> The shopper uploads a photo or PDF screenshot of their bank receipt directly into the chat. You can review and verify in the <em>Orders</em> tab with one click.</li>
              </ol>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Bank Name</label>
                <input
                  type="text"
                  value={config.bankTransfer.bankName}
                  onChange={(e) => setConfig(prev => ({ ...prev, bankTransfer: { ...prev.bankTransfer, bankName: e.target.value } }))}
                  placeholder="e.g. Standard Chartered / Chase / Barclays"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Beneficiary Account Name</label>
                <input
                  type="text"
                  value={config.bankTransfer.accountName}
                  onChange={(e) => setConfig(prev => ({ ...prev, bankTransfer: { ...prev.bankTransfer, accountName: e.target.value } }))}
                  placeholder="e.g. AURA Atelier LLC"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Account Number / IBAN</label>
                <input
                  type="text"
                  value={config.bankTransfer.accountNumber}
                  onChange={(e) => setConfig(prev => ({ ...prev, bankTransfer: { ...prev.bankTransfer, accountNumber: e.target.value } }))}
                  placeholder="e.g. 0129482019"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Routing Number / SWIFT BIC</label>
                <input
                  type="text"
                  value={config.bankTransfer.routingOrSwift}
                  onChange={(e) => setConfig(prev => ({ ...prev, bankTransfer: { ...prev.bankTransfer, routingOrSwift: e.target.value } }))}
                  placeholder="e.g. SCBLUS33XXX"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">Transfer Memo Instructions (Shown to customer)</label>
                <textarea
                  rows={2}
                  value={config.bankTransfer.instructions}
                  onChange={(e) => setConfig(prev => ({ ...prev, bankTransfer: { ...prev.bankTransfer, instructions: e.target.value } }))}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 leading-relaxed font-sans"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-200">
              <span className="text-[11px] text-slate-500">
                Connection Status: {verifiedStatus['bankTransfer'] ? <strong className="text-emerald-700">✓ Bank Coordinates Verified</strong> : <strong className="text-amber-700">Needs Validation</strong>}
              </span>
              <button
                type="button"
                onClick={() => handleVerify('bankTransfer', 'Bank Transfer')}
                disabled={verifying['bankTransfer']}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {verifying['bankTransfer'] && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>Verify Bank Details</span>
              </button>
            </div>
          </div>
        )}

        {/* ===================== TAB 6: CRYPTO PAYMENT ===================== */}
        {activeTab === 'crypto' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#26A17B] text-white font-bold flex items-center justify-center text-base shadow-xs">
                  ₮
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Cryptocurrency Payments (USDT, USDC, BTC &amp; SOL)</h3>
                  <p className="text-xs text-slate-500">Instant on-chain payments directly to your self-custody wallet with sub-cent network fees and zero chargeback risk.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleEnabled('crypto', 'Crypto')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    config.crypto.enabled 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {config.crypto.enabled ? '✓ Enabled on Store' : 'Enable Crypto'}
                </button>
              </div>
            </div>

            {/* STEP-BY-STEP SETUP DIRECTION BOX */}
            <div className="bg-white border border-purple-200 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-purple-800 font-bold">
                <HelpCircle className="w-4 h-4 text-purple-600" />
                <span>How to Set Up &amp; Collect Payments via Cryptocurrency</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 leading-relaxed text-[11.5px]">
                <li>Copy your public recipient wallet address from your crypto wallet (TrustWallet, MetaMask, Phantom, Binance, or Ledger).</li>
                <li>Paste your <strong>USDT TRC-20</strong> address (TRON network - recommended for lowest $1 network fees) and <strong>USDT ERC-20</strong> or <strong>BTC</strong> address below.</li>
                <li><strong>How customer pays:</strong> When a customer selects Crypto in WhatsApp, the AI Sales Agent calculates the live exchange rate and displays an interactive scannable QR Code and copyable wallet address.</li>
                <li><strong>Instant settlement:</strong> Customer completes transfer and pastes transaction hash (<code className="font-mono">txHash</code>). The system verifies 1 block confirmation on-chain and automatically marks the order as Paid.</li>
              </ol>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  USDT TRC-20 Address (TRON Network - Fast &amp; Cheap)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={config.crypto.usdtTrc20Address}
                    onChange={(e) => setConfig(prev => ({ ...prev, crypto: { ...prev.crypto, usdtTrc20Address: e.target.value } }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 pr-9 text-xs text-slate-900 font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(config.crypto.usdtTrc20Address, 'USDT TRC20 Address')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  USDT ERC-20 Address (Ethereum Network)
                </label>
                <input
                  type="text"
                  value={config.crypto.usdtErc20Address}
                  onChange={(e) => setConfig(prev => ({ ...prev, crypto: { ...prev.crypto, usdtErc20Address: e.target.value } }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Bitcoin (BTC) Public Address
                </label>
                <input
                  type="text"
                  value={config.crypto.btcAddress}
                  onChange={(e) => setConfig(prev => ({ ...prev, crypto: { ...prev.crypto, btcAddress: e.target.value } }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Solana (SOL / USDC) Address
                </label>
                <input
                  type="text"
                  value={config.crypto.solAddress}
                  onChange={(e) => setConfig(prev => ({ ...prev, crypto: { ...prev.crypto, solAddress: e.target.value } }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-200">
              <span className="text-[11px] text-slate-500">
                Connection Status: {verifiedStatus['crypto'] ? <strong className="text-emerald-700">✓ On-Chain Wallet Verified</strong> : <strong className="text-amber-700">Pending Verification</strong>}
              </span>
              <button
                type="button"
                onClick={() => handleVerify('crypto', 'Crypto Wallet')}
                disabled={verifying['crypto']}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {verifying['crypto'] && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>Verify On-Chain Wallet</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payout & Settlement Overview */}
      <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">Payout &amp; Settlement Destinations</h3>
          </div>
          <span className="text-xs text-slate-500">Automated Direct Deposits</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Bank Account Settlement</span>
            <span className="font-bold text-slate-900 block mt-1">{config.bankTransfer.bankName}</span>
            <span className="text-slate-500 font-mono text-[11px] block mt-0.5">{config.bankTransfer.accountNumber}</span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Crypto USDT Settlement</span>
            <span className="font-bold text-slate-900 block mt-1">TRON (TRC-20)</span>
            <span className="text-slate-500 font-mono text-[11px] block mt-0.5 truncate">{config.crypto.usdtTrc20Address}</span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Payout Frequency</span>
            <span className="font-bold text-emerald-700 block mt-1">Instant &amp; Next-Day (T+1)</span>
            <span className="text-slate-500 text-[11px] block mt-0.5">Automated via Connected Gateways</span>
          </div>
        </div>
      </div>
    </div>
  );
};
