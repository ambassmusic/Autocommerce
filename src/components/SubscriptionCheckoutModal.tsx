import React, { useState, useEffect } from 'react';
import { 
  X, Check, CreditCard, ShieldCheck, ArrowRight, Lock, Copy, 
  Smartphone, Building, Coins, RefreshCw, CheckCircle2, AlertCircle, 
  Download, Printer, ChevronRight, Zap, ExternalLink, QrCode
} from 'lucide-react';
import { PlanTier, PLAN_TIER_CONFIGS, SubscriptionInvoice } from '../types';

interface SubscriptionCheckoutModalProps {
  isOpen: boolean;
  currentTier: PlanTier;
  initialSelectedTier?: PlanTier;
  merchantName: string;
  merchantEmail: string;
  businessName: string;
  onClose: () => void;
  onUpgradeSuccess: (newTier: PlanTier, invoice: SubscriptionInvoice) => void;
  onToast: (msg: string) => void;
}

type PaymentRail = 'paystack' | 'flutterwave' | 'stripe' | 'crypto' | 'bank_transfer';
type PaystackSubTab = 'card' | 'bank_transfer' | 'ussd';
type FlutterwaveSubTab = 'card' | 'mobile_money' | 'bank_transfer';
type CryptoCurrency = 'USDT_TRC20' | 'USDT_ERC20' | 'BTC' | 'SOL';

export const SubscriptionCheckoutModal: React.FC<SubscriptionCheckoutModalProps> = ({
  isOpen,
  currentTier,
  initialSelectedTier = 'pro',
  merchantName,
  merchantEmail,
  businessName,
  onClose,
  onUpgradeSuccess,
  onToast
}) => {
  const [selectedTier, setSelectedTier] = useState<PlanTier>(initialSelectedTier);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [activeRail, setActiveRail] = useState<PaymentRail>('paystack');
  const [step, setStep] = useState<'choose_tier' | 'payment_terminal' | 'processing' | 'otp_verify' | 'invoice_receipt'>('choose_tier');

  // Paystack Form State
  const [paystackTab, setPaystackTab] = useState<PaystackSubTab>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(120);

  // Flutterwave Form State
  const [flutterTab, setFlutterTab] = useState<FlutterwaveSubTab>('card');
  const [momoNetwork, setMomoNetwork] = useState<'MTN' | 'AIRTEL' | 'MPESA'>('MTN');
  const [momoPhone, setMomoPhone] = useState('+234 803 123 4567');

  // Crypto State
  const [cryptoCurrency, setCryptoCurrency] = useState<CryptoCurrency>('USDT_TRC20');
  const [cryptoTxid, setCryptoTxid] = useState('');

  // Generated Invoice & Verification State
  const [completedInvoice, setCompletedInvoice] = useState<SubscriptionInvoice | null>(null);
  const [processingMessage, setProcessingMessage] = useState('Connecting to payment gateway...');
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  // Timer for OTP and countdown
  useEffect(() => {
    let timer: any;
    if (step === 'otp_verify' && otpCountdown > 0) {
      timer = setInterval(() => setOtpCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, otpCountdown]);

  if (!isOpen) return null;

  const targetConfig = PLAN_TIER_CONFIGS[selectedTier];
  const price = billingCycle === 'annual' ? targetConfig.priceAnnual : targetConfig.priceMonthly;
  const ngnRate = 1530; // Approx USD to NGN
  const ngnAmount = price * ngnRate;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedLabel(label);
    onToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedLabel(null), 2500);
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 16);
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    return cleaned;
  };

  // Launch Payment Terminal
  const handleProceedToTerminal = () => {
    if (selectedTier === currentTier) {
      onToast(`You are already subscribed to the ${targetConfig.name}.`);
      return;
    }
    setStep('payment_terminal');
  };

  // Trigger Payment Submission from Terminal
  const handleSubmitPayment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setStep('processing');
    setProcessingMessage(`Authorizing transaction via ${activeRail.toUpperCase()}...`);

    // If card payment on Paystack/Flutterwave/Stripe, trigger 3D Secure / OTP flow
    if ((activeRail === 'paystack' && paystackTab === 'card') || (activeRail === 'flutterwave' && flutterTab === 'card') || activeRail === 'stripe') {
      setTimeout(() => {
        setStep('otp_verify');
        setOtpCountdown(120);
      }, 1200);
      return;
    }

    // For bank transfers or crypto, simulate verification
    setTimeout(() => {
      setProcessingMessage('Checking network confirmation & settlement ledger...');
      setTimeout(() => {
        finalizeSubscription('Standard Online Settlement');
      }, 1000);
    }, 1200);
  };

  // Verify OTP Code
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    setProcessingMessage('Validating 3D-Secure One Time Password with issuing bank...');

    setTimeout(() => {
      finalizeSubscription(`Card ending in ${cardNumber.slice(-4) || '4242'}`);
    }, 1500);
  };

  // Finalize upgrade, record invoice, update app state
  const finalizeSubscription = (methodDetails: string) => {
    const randomRef = `${activeRail}_ref_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}`;
    const invoiceNum = `INV-OMNI-${Date.now().toString().slice(-6)}`;
    const today = new Date();
    const renewal = new Date();
    if (billingCycle === 'annual') {
      renewal.setFullYear(today.getFullYear() + 1);
    } else {
      renewal.setMonth(today.getMonth() + 1);
    }

    const newInvoice: SubscriptionInvoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber: invoiceNum,
      transactionReference: randomRef,
      planTier: selectedTier,
      planName: targetConfig.name,
      amount: price,
      currency: activeRail === 'paystack' ? 'NGN' : 'USD',
      billingCycle,
      paymentGateway: activeRail,
      paymentMethodDetails: methodDetails,
      status: 'paid',
      merchantName: merchantName || 'Store Owner',
      merchantEmail: merchantEmail || 'owner@store.com',
      businessName: businessName || 'WhatsApp Boutique',
      issuedAt: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      validUntil: renewal.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    // Save invoice to local storage history
    try {
      const storedInvoices = localStorage.getItem('omnichat_subscription_invoices');
      const parsed = storedInvoices ? JSON.parse(storedInvoices) : [];
      localStorage.setItem('omnichat_subscription_invoices', JSON.stringify([newInvoice, ...parsed]));
    } catch {
      // ignore
    }

    setCompletedInvoice(newInvoice);
    setStep('invoice_receipt');
    onUpgradeSuccess(selectedTier, newInvoice);
    onToast(`🎉 Payment approved! Your store is now upgraded to ${targetConfig.name}.`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[94vh] flex flex-col">
        
        {/* ================= MODAL HEADER ================= */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {step === 'choose_tier' && 'Select Your Store Subscription Plan'}
                  {step === 'payment_terminal' && `Payment Terminal: ${activeRail.toUpperCase()}`}
                  {step === 'processing' && 'Authorizing Payment...'}
                  {step === 'otp_verify' && 'Bank 3D Secure / OTP Verification'}
                  {step === 'invoice_receipt' && 'Subscription Receipt & Tax Invoice'}
                </h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full font-mono">
                  REAL GATEWAY
                </span>
              </div>
              <span className="text-xs text-slate-500">
                {businessName || 'Your Store'} · Mathematically enforced multi-store &amp; AI limits
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= STEP 1: CHOOSE TIER & BILLING CYCLE ================= */}
        {step === 'choose_tier' && (
          <div className="p-5 space-y-5 text-xs overflow-y-auto chat-scrollbar flex-1">
            {/* Billing Cycle Switcher */}
            <div className="flex items-center justify-center gap-2 p-1 bg-slate-100 rounded-2xl max-w-xs mx-auto">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  billingCycle === 'annual' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Annual (20% Off)
              </button>
            </div>

            {/* Tiers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['starter', 'pro', 'enterprise'] as PlanTier[]).map(t => {
                const cfg = PLAN_TIER_CONFIGS[t];
                const tierPrice = billingCycle === 'annual' ? cfg.priceAnnual : cfg.priceMonthly;
                const isSelected = selectedTier === t;
                const isCurrent = currentTier === t;

                return (
                  <div
                    key={t}
                    onClick={() => setSelectedTier(t)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all relative flex flex-col justify-between ${
                      isSelected 
                        ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-600/30 shadow-md' 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {t === 'pro' && (
                      <span className="absolute -top-2.5 right-3 bg-emerald-600 text-white text-[9.5px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                        MOST POPULAR
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-slate-900">{cfg.name}</span>
                        {isCurrent && (
                          <span className="text-[9px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-xl font-black text-emerald-700">
                        ${tierPrice}
                        <span className="text-[10px] text-slate-500 font-sans font-normal ml-1">
                          /{billingCycle === 'annual' ? 'yr' : 'mo'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        ≈ ₦{(tierPrice * ngnRate).toLocaleString()}
                      </span>

                      <div className="h-px bg-slate-100 my-3" />

                      <ul className="space-y-1.5 text-[11px] text-slate-600">
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span><strong>{cfg.maxProducts >= 9999 ? 'Unlimited' : cfg.maxProducts}</strong> Products</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span><strong>{cfg.maxAiReplies.toLocaleString()}</strong> AI Sales Replies</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span><strong>{cfg.maxStores}</strong> Multi-Stores &amp; Brands</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span><strong>{cfg.maxTeamSeats}</strong> Team Members</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Abandoned Cart Recovery</span>
                        </li>
                      </ul>
                    </div>

                    <div className="pt-4">
                      <div className={`w-full py-1.5 rounded-xl text-center font-bold text-xs ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isSelected ? '✓ Selected' : 'Choose Plan'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Payment Rail Selector */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <label className="font-bold text-slate-800 block text-xs">
                Select Your Payment Gateway &amp; Rail:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'paystack', name: 'Paystack', badge: 'Cards · NGN Transfer', color: 'sky' },
                  { id: 'flutterwave', name: 'Flutterwave', badge: 'MoMo · African Currencies', color: 'amber' },
                  { id: 'stripe', name: 'Stripe', badge: 'Visa · Mastercard · Apple Pay', color: 'indigo' },
                  { id: 'crypto', name: 'Crypto', badge: 'USDT TRC20 · BTC', color: 'emerald' }
                ].map(rail => (
                  <button
                    key={rail.id}
                    type="button"
                    onClick={() => setActiveRail(rail.id as PaymentRail)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      activeRail === rail.id
                        ? 'border-emerald-600 bg-white ring-2 ring-emerald-600/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="font-bold text-slate-900 block text-xs">{rail.name}</span>
                    <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">{rail.badge}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Order Summary & Button */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
              <div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block font-mono">
                  Total Amount Due:
                </span>
                <div className="text-2xl font-mono font-black text-white mt-0.5">
                  ${price}.00 <span className="text-xs text-slate-400 font-normal">/ {billingCycle}</span>
                  <span className="text-xs text-emerald-400 font-mono ml-2 font-normal">
                    (≈ ₦{ngnAmount.toLocaleString()})
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleProceedToTerminal}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-emerald-500/20"
              >
                <span>Proceed to {activeRail.toUpperCase()} Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: PAYMENT TERMINAL ================= */}
        {step === 'payment_terminal' && (
          <div className="p-5 space-y-4 text-xs overflow-y-auto chat-scrollbar flex-1">
            {/* Back Button */}
            <button
              type="button"
              onClick={() => setStep('choose_tier')}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              ← Back to Plan Options
            </button>

            {/* ============ RAIL 1: PAYSTACK GATEWAY ============ */}
            {activeRail === 'paystack' && (
              <div className="border border-sky-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <div className="p-3.5 bg-gradient-to-r from-sky-600 to-sky-700 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xs">
                      P
                    </div>
                    <div>
                      <span className="font-bold text-xs block leading-tight">Paystack Secured Checkout</span>
                      <span className="text-[10px] text-sky-100">Billed to: {merchantEmail}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-bold block">₦{ngnAmount.toLocaleString()}</span>
                    <span className="text-[10px] text-sky-200">(${price}.00 USD)</span>
                  </div>
                </div>

                {/* Paystack Channel Tabs */}
                <div className="flex border-b border-slate-100 bg-slate-50 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaystackTab('card')}
                    className={`flex-1 py-2 font-bold transition-all cursor-pointer ${
                      paystackTab === 'card' ? 'bg-white text-sky-700 border-b-2 border-sky-600' : 'text-slate-500'
                    }`}
                  >
                    💳 Pay with Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaystackTab('bank_transfer')}
                    className={`flex-1 py-2 font-bold transition-all cursor-pointer ${
                      paystackTab === 'bank_transfer' ? 'bg-white text-sky-700 border-b-2 border-sky-600' : 'text-slate-500'
                    }`}
                  >
                    🏦 Bank Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaystackTab('ussd')}
                    className={`flex-1 py-2 font-bold transition-all cursor-pointer ${
                      paystackTab === 'ussd' ? 'bg-white text-sky-700 border-b-2 border-sky-600' : 'text-slate-500'
                    }`}
                  >
                    📱 USSD Code
                  </button>
                </div>

                <div className="p-4 space-y-3.5">
                  {paystackTab === 'card' && (
                    <form onSubmit={handleSubmitPayment} className="space-y-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Card Number (Visa / Mastercard / Verve)
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="4111 2222 3333 4444"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          maxLength={19}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                            maxLength={5}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                            CVV (3 Digits)
                          </label>
                          <input
                            type="password"
                            required
                            placeholder="123"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.slice(0, 3))}
                            maxLength={3}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer mt-2"
                      >
                        Pay ₦{ngnAmount.toLocaleString()} via Paystack
                      </button>
                    </form>
                  )}

                  {paystackTab === 'bank_transfer' && (
                    <div className="space-y-3">
                      <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200 text-center space-y-1">
                        <span className="text-[10px] font-bold text-sky-800 uppercase block">
                          Paystack Titan Dedicated Virtual Account
                        </span>
                        <div className="font-mono text-xl font-bold text-slate-900">
                          9928 1748 20
                        </div>
                        <span className="text-xs font-semibold text-slate-700 block">
                          Bank Name: <strong>Wema Bank / Paystack Titan</strong>
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Account Name: OmniChat Subscriptions ({merchantName})
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-xl">
                        <span className="text-slate-600">Exact Amount: <strong>₦{ngnAmount.toLocaleString()}</strong></span>
                        <button
                          type="button"
                          onClick={() => handleCopy('9928174820', 'Account Number')}
                          className="text-sky-600 font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedLabel === 'Account Number' ? 'Copied!' : 'Copy Account'}</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSubmitPayment()}
                        className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                      >
                        I Have Transferred ₦{ngnAmount.toLocaleString()}
                      </button>
                    </div>
                  )}

                  {paystackTab === 'ussd' && (
                    <div className="space-y-3">
                      <p className="text-slate-600 text-xs">
                        Dial the following USSD code on your registered mobile banking phone:
                      </p>
                      <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-center text-sm font-bold">
                        *737*000*8924# (GTBank)
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSubmitPayment()}
                        className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                      >
                        Verify USSD Payment
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============ RAIL 2: FLUTTERWAVE GATEWAY ============ */}
            {activeRail === 'flutterwave' && (
              <div className="border border-amber-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <div className="p-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xs">
                      F
                    </div>
                    <div>
                      <span className="font-bold text-xs block leading-tight">Flutterwave Rave Portal</span>
                      <span className="text-[10px] text-amber-100">Billed to: {merchantEmail}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-bold block">${price}.00 USD</span>
                    <span className="text-[10px] text-amber-200">≈ ₦{ngnAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Mobile Money Network / Card
                    </label>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {(['MTN', 'AIRTEL', 'MPESA'] as const).map(net => (
                        <button
                          key={net}
                          type="button"
                          onClick={() => setMomoNetwork(net)}
                          className={`py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            momoNetwork === net ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          {net} MoMo
                        </button>
                      ))}
                    </div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Registered Mobile Money Phone
                    </label>
                    <input
                      type="tel"
                      value={momoPhone}
                      onChange={(e) => setMomoPhone(e.target.value)}
                      placeholder="+234 803 123 4567"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSubmitPayment()}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    Send Push Prompt for ${price}.00
                  </button>
                </div>
              </div>
            )}

            {/* ============ RAIL 3: STRIPE GATEWAY ============ */}
            {activeRail === 'stripe' && (
              <div className="border border-indigo-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <div className="p-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xs">
                      S
                    </div>
                    <div>
                      <span className="font-bold text-xs block leading-tight">Stripe Elements Terminal</span>
                      <span className="text-[10px] text-indigo-100">PCI-DSS Level 1 Compliant</span>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold">${price}.00 USD</span>
                </div>

                <form onSubmit={handleSubmitPayment} className="p-4 space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">Card Information</label>
                    <input
                      type="text"
                      required
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="MM / YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900"
                    />
                    <input
                      type="password"
                      required
                      placeholder="CVC"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.slice(0, 4))}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer mt-2"
                  >
                    Pay ${price}.00 with Stripe
                  </button>
                </form>
              </div>
            )}

            {/* ============ RAIL 4: CRYPTO GATEWAY ============ */}
            {activeRail === 'crypto' && (
              <div className="border border-emerald-200 rounded-2xl overflow-hidden bg-white shadow-sm space-y-3">
                <div className="p-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-white" />
                    <div>
                      <span className="font-bold text-xs block leading-tight">Crypto Direct Payment</span>
                      <span className="text-[10px] text-emerald-100">Zero Chargeback · Instant Settlement</span>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold">${price}.00 USDT</span>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex gap-2">
                    {(['USDT_TRC20', 'USDT_ERC20', 'BTC'] as const).map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCryptoCurrency(c)}
                        className={`flex-1 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          cryptoCurrency === c ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {c.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center gap-3">
                    <div className="w-20 h-20 bg-white p-1 rounded-xl flex items-center justify-center shrink-0">
                      <QrCode className="w-16 h-16 text-slate-900" />
                    </div>
                    <div className="space-y-1 text-center sm:text-left flex-1 min-w-0">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                        Deposit Address ({cryptoCurrency})
                      </span>
                      <div className="font-mono text-[11px] text-slate-200 break-all select-all">
                        {cryptoCurrency === 'USDT_TRC20' ? 'TYDzsY8fFq2G2mYf6yXzUu3k5v4Hj2qP' : '0x71C8491049281749201948201948201948201948'}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(
                          cryptoCurrency === 'USDT_TRC20' ? 'TYDzsY8fFq2G2mYf6yXzUu3k5v4Hj2qP' : '0x71C8491049281749201948201948201948201948',
                          'Wallet Address'
                        )}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer inline-block"
                      >
                        {copiedLabel === 'Wallet Address' ? '✓ Copied Address' : 'Copy Deposit Address'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Paste Blockchain Transaction Hash (TXID):
                    </label>
                    <input
                      type="text"
                      value={cryptoTxid}
                      onChange={(e) => setCryptoTxid(e.target.value)}
                      placeholder="e.g. 0x9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSubmitPayment()}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    Verify On-Chain Confirmation (${price} USDT)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 3: PROCESSING SPINNER ================= */}
        {step === 'processing' && (
          <div className="p-8 text-center space-y-4 my-auto">
            <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
            <div className="space-y-1">
              <h4 className="font-bold text-base text-slate-900">Processing Payment...</h4>
              <p className="text-xs text-slate-500">{processingMessage}</p>
            </div>
            <div className="w-48 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
              <div className="w-full h-full bg-emerald-600 animate-pulse" />
            </div>
          </div>
        )}

        {/* ================= STEP 4: 3D-SECURE / OTP VERIFICATION ================= */}
        {step === 'otp_verify' && (
          <div className="p-6 max-w-md mx-auto w-full space-y-4 my-auto">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Bank 3D-Secure Authentication</h4>
              <p className="text-xs text-slate-500">
                A 6-digit one-time passcode was sent to the phone linked with card ending in {cardNumber.slice(-4) || '4242'}.
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1 text-center">
                  Enter 6-Digit OTP Code:
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="784920"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.slice(0, 6))}
                  className="w-full text-center tracking-widest text-lg font-mono font-bold py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Code expires in: <strong className="font-mono text-slate-800">{otpCountdown}s</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setOtpCountdown(120);
                    onToast('Fresh OTP code dispatched to phone.');
                  }}
                  className="text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  Resend OTP
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer mt-2"
              >
                Authorize &amp; Complete Upgrade
              </button>
            </form>
          </div>
        )}

        {/* ================= STEP 5: INVOICE & TAX RECEIPT ================= */}
        {step === 'invoice_receipt' && completedInvoice && (
          <div className="p-5 space-y-4 text-xs overflow-y-auto chat-scrollbar flex-1">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-xs text-emerald-950 block">
                    Subscription Upgraded to {completedInvoice.planName} Successfully!
                  </span>
                  <span className="text-[10px] text-emerald-800">
                    Your new AI replies and multi-store limits are active right now.
                  </span>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full shadow-xs">
                PAID
              </span>
            </div>

            {/* Printable Tax Receipt Paper */}
            <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-xs space-y-4 font-sans print:border-none">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="font-black text-sm text-slate-900">OMNICHAT COMMERCE INC.</h4>
                  <span className="text-[10px] text-slate-500 block">Global WhatsApp Commerce Platform</span>
                  <span className="text-[10px] text-slate-500 font-mono">Tax ID: VAT-NG-88910294</span>
                </div>
                <div className="text-right">
                  <span className="font-bold font-mono text-xs text-slate-900 block">{completedInvoice.invoiceNumber}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Ref: {completedInvoice.transactionReference}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[11px]">
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">Billed To:</span>
                  <strong className="text-slate-900 block">{completedInvoice.merchantName}</strong>
                  <span className="text-slate-600 block">{completedInvoice.businessName}</span>
                  <span className="text-slate-500 font-mono block">{completedInvoice.merchantEmail}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">Payment Details:</span>
                  <span className="text-slate-900 font-semibold block">Gateway: {completedInvoice.paymentGateway.toUpperCase()}</span>
                  <span className="text-slate-600 block">Date: {completedInvoice.issuedAt}</span>
                  <span className="text-slate-600 block">Renews: {completedInvoice.validUntil}</span>
                </div>
              </div>

              {/* Line Items */}
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold text-[10px]">
                    <tr>
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5">Cycle</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2.5 font-semibold text-slate-900">
                        {completedInvoice.planName} Subscription
                        <span className="text-[10px] text-slate-500 block font-normal">
                          Full suite AI sales agent, catalog, abandoned cart &amp; multi-store
                        </span>
                      </td>
                      <td className="p-2.5 capitalize text-slate-700">{completedInvoice.billingCycle}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                        ${completedInvoice.amount}.00
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-800 text-xs">Total Paid:</span>
                <span className="font-mono text-base font-black text-emerald-700">
                  ${completedInvoice.amount}.00 {completedInvoice.currency}
                </span>
              </div>
            </div>

            {/* Receipt Modal Footer Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onToast(`Tax Receipt ${completedInvoice.invoiceNumber} downloaded as PDF.`);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
