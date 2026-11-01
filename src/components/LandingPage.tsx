import React, { useState, useEffect } from 'react';
import { 
  Store, MessageSquare, ArrowRight, ShieldCheck, Zap, 
  CreditCard, TrendingUp, CheckCircle2, ChevronRight, ChevronLeft,
  Sparkles, Globe2, Smartphone, Users, DollarSign, Lock,
  ShoppingBag, Check, Clock, Star, MapPin, Calendar, Tag,
  ExternalLink, Play, RotateCcw
} from 'lucide-react';
import { BusinessIndustry } from '../types';

interface LandingPageProps {
  onOpenAuth: (initialMode?: 'login' | 'register' | 'google') => void;
  onLaunchDemo: (industry?: BusinessIndustry) => void;
  onOpenAdmin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onOpenAuth, 
  onLaunchDemo, 
  onOpenAdmin 
}) => {
  const [selectedIndustry, setSelectedIndustry] = useState<BusinessIndustry>('food');
  const [activeDemoStep, setActiveDemoStep] = useState<number>(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);

  // Auto-play the 7-step interactive OmniChat demo
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setActiveDemoStep(prev => (prev >= 6 ? 1 : prev + 1));
    }, 4500);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. OMNICHAT HEADER & NAVIGATION BAR                                      */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-5 md:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
          {/* Logo Wordmark (Emerald accent style) */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => onLaunchDemo('food')}
              className="flex items-center gap-2 text-left cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-[#0F7A66] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <Store className="w-4 h-4" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-extrabold text-lg tracking-tight text-slate-950 font-sans">
                  OmniChat<span className="text-[#0F7A66]"> Commerce</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 font-mono">
                  WhatsApp Store
                </span>
              </div>
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-600">
            <a 
              href="#ordering" 
              className="px-3.5 py-2 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              WhatsApp Ordering
            </a>
            <a 
              href="#payments" 
              className="px-3.5 py-2 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              Local Payments
            </a>
            <a 
              href="#management" 
              className="px-3.5 py-2 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              Order Manager
            </a>
            <a 
              href="#pricing" 
              className="px-3.5 py-2 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              Pricing
            </a>
            <button
              onClick={onOpenAdmin}
              className="px-3.5 py-2 rounded-full text-purple-700 hover:bg-purple-50 font-bold transition-colors cursor-pointer"
            >
              Super Admin
            </button>
          </nav>

          {/* Action CTAs (Log In & Start Free Emerald Pill) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onOpenAuth('login')}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              Log in
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="px-5 py-2 bg-[#0F7A66] hover:bg-[#0c6353] text-white text-sm font-bold rounded-full shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Start free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION: "Create your online store for WhatsApp"                  */}
      {/* ========================================================================= */}
      <section className="pt-12 pb-16 md:pt-16 md:pb-24 overflow-hidden relative border-b border-slate-100 bg-gradient-to-b from-emerald-50/30 via-white to-white">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-5">
            {/* Official Partner Badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1.5 pr-4 pl-3.5 shadow-xs">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                Official Partner
              </span>
              <div className="h-3.5 w-px bg-slate-200" />
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F7A66]">
                <Smartphone className="w-3.5 h-3.5" />
                <span>WhatsApp Business &amp; Baileys</span>
              </div>
            </div>

            {/* Main OmniChat Headline */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.12]">
              Create your online store for WhatsApp
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-slate-600 max-w-xl mx-auto leading-relaxed">
              Take chat orders &amp; payments online. Fewer mistakes, faster deals.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => onOpenAuth('register')}
                className="px-8 py-3.5 bg-[#0F7A66] hover:bg-[#0c6353] text-white text-base font-bold rounded-full shadow-md shadow-emerald-700/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Start for free</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onLaunchDemo('food')}
                className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-base font-semibold rounded-full transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Try Live Demo</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. INTERACTIVE DUAL SIMULATOR (OmniChat Signature Hero Flow)               */}
          {/* ========================================================================= */}
          <div className="mt-12 md:mt-16 max-w-4xl mx-auto">
            {/* Step Selector Ribbon */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 text-xs">
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] mr-1">
                  Demo Flow:
                </span>
                {[
                  { id: 1, label: '1. Chat Message' },
                  { id: 2, label: '2. Web Catalog' },
                  { id: 3, label: '3. Add Modifiers' },
                  { id: 4, label: '4. Checkout' },
                  { id: 5, label: '5. Paystack / Pay' },
                  { id: 6, label: '6. WhatsApp Order' }
                ].map(step => (
                  <button
                    key={step.id}
                    onClick={() => {
                      setActiveDemoStep(step.id);
                      setIsAutoPlaying(false);
                    }}
                    className={`px-3 py-1 rounded-full font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                      activeDemoStep === step.id
                        ? 'bg-[#0F7A66] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {step.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg flex items-center gap-1 cursor-pointer"
                  title="Toggle Auto Play"
                >
                  {isAutoPlaying ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Auto Playing</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 text-slate-500" />
                      <span>Play</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* The Mockup Frame */}
            <div className="relative mx-auto max-w-[360px] bg-slate-900 p-2.5 rounded-[40px] shadow-2xl ring-1 ring-black/10">
              {/* Phone Speaker & Camera Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-30 flex items-center justify-center">
                <div className="w-12 h-1 bg-slate-800 rounded-full" />
                <div className="w-2 h-2 bg-slate-800 rounded-full ml-3" />
              </div>

              {/* Screen Container */}
              <div className="relative rounded-[32px] overflow-hidden bg-[#EFEAE2] min-h-[620px] flex flex-col font-sans text-slate-900 shadow-inner">
                {/* Status Bar */}
                <div className="pt-2 px-6 pb-1 flex items-center justify-between text-[11px] font-bold text-slate-700 select-none">
                  <span>9:41</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-700" />
                    <span>5G</span>
                    <span className="border border-slate-700 px-1 rounded-xs text-[9px]">100%</span>
                  </div>
                </div>

                {/* Top WhatsApp App Header */}
                <div className="bg-[#0F7A66] text-white px-3.5 py-2.5 flex items-center gap-2.5 shadow-sm">
                  <ChevronLeft className="w-5 h-5 -ml-1 text-white/80" />
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-white shrink-0 border border-white/20">
                    <img 
                      src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=120&q=80" 
                      alt="Bali Dining" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-sm leading-tight truncate">Bali Dining</span>
                      <span className="inline-flex w-3.5 h-3.5 items-center justify-center rounded-full bg-[#25A2E3] text-white text-[9px]">
                        ✓
                      </span>
                    </div>
                    <span className="text-[10px] text-white/80 block">Official WhatsApp Store</span>
                  </div>
                  <span className="text-xs text-white/90 font-mono">omnichat.store</span>
                </div>

                {/* ================= SCREEN STAGE 1: INCOMING CHAT & STORE LINK ================= */}
                {activeDemoStep === 1 && (
                  <div className="flex-1 p-3.5 flex flex-col justify-end space-y-3 animate-in fade-in duration-300">
                    <div className="self-end bg-[#D9FDD3] text-slate-900 p-3 rounded-2xl rounded-br-xs max-w-[82%] text-xs shadow-xs leading-relaxed">
                      <span>Hi, I'd like to place an order for lunch today! 🍣</span>
                      <span className="block text-[9px] text-slate-400 text-right mt-1">12:30 PM ✓✓</span>
                    </div>

                    <div className="self-start bg-white text-slate-900 p-3.5 rounded-2xl rounded-bl-xs max-w-[88%] text-xs shadow-xs space-y-2 leading-relaxed">
                      <p>
                        Thank you for contacting <strong>Bali Dining</strong>! 🌿
                      </p>
                      <p>
                        You can view our live menu, customize modifiers, and checkout directly here:
                      </p>
                      <button
                        onClick={() => setActiveDemoStep(2)}
                        className="w-full mt-1 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left block group cursor-pointer transition-colors"
                      >
                        <span className="font-bold text-emerald-800 text-xs block group-hover:text-emerald-700">
                          omnichat.store/balidining
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Tap to open interactive WhatsApp menu →
                        </span>
                      </button>
                      <span className="block text-[9px] text-slate-400 text-right">12:30 PM</span>
                    </div>

                    <div className="pt-2 text-center">
                      <button
                        onClick={() => setActiveDemoStep(2)}
                        className="px-4 py-2 bg-[#0F7A66] hover:bg-[#0c6353] text-white text-xs font-bold rounded-full shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <span>Open Storefront Menu</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ================= SCREEN STAGE 2: BROWSE CATALOG WEBVIEW ================= */}
                {activeDemoStep === 2 && (
                  <div className="flex-1 bg-white flex flex-col overflow-y-auto animate-in fade-in duration-300">
                    {/* Webview Header */}
                    <div className="bg-slate-800 text-white px-3 py-1.5 flex items-center justify-between text-[11px]">
                      <span className="text-white/70">Done</span>
                      <span className="font-mono text-[10px] text-white/90">omnichat.store/balidining</span>
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </div>

                    {/* Store Banner */}
                    <div className="p-3.5 space-y-3">
                      <div className="relative h-28 rounded-2xl overflow-hidden bg-slate-100">
                        <img 
                          src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80" 
                          alt="Cover" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute -bottom-4 left-3 w-12 h-12 rounded-xl border-2 border-white overflow-hidden shadow-md">
                          <img 
                            src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=120&q=80" 
                            alt="Logo" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <h3 className="font-bold text-sm text-slate-900">Bali Dining</h3>
                        <p className="text-[11px] text-slate-500">Wood-fired pizza, fresh pastas &amp; grilled seafood.</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-600 mt-1">
                          <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> 4.9 (1,284)
                          </span>
                          <span>•</span>
                          <span className="text-emerald-700 font-bold">Open · 9AM - 10PM</span>
                        </div>
                      </div>

                      {/* Food Category Items */}
                      <div className="space-y-2 pt-1">
                        <span className="text-xs font-bold text-slate-800 block">🍝 Main Dishes</span>
                        <div 
                          onClick={() => setActiveDemoStep(3)}
                          className="p-2.5 bg-slate-50 hover:bg-emerald-50/50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                        >
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-900">Grilled Salmon Fillet</h4>
                            <p className="text-[10px] text-slate-500 truncate">Seared fillet with lime, asparagus &amp; greens</p>
                            <span className="font-bold text-xs text-slate-900 block mt-1">$36.00</span>
                          </div>
                          <img 
                            src="https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=120&q=80" 
                            alt="Salmon" 
                            className="w-14 h-14 rounded-lg object-cover shrink-0"
                          />
                        </div>

                        <div 
                          onClick={() => setActiveDemoStep(3)}
                          className="p-2.5 bg-slate-50 hover:bg-emerald-50/50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                        >
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-900">Margherita Wood Pizza</h4>
                            <p className="text-[10px] text-slate-500 truncate">San Marzano tomatoes, buffalo mozzarella &amp; basil</p>
                            <span className="font-bold text-xs text-slate-900 block mt-1">$24.00</span>
                          </div>
                          <img 
                            src="https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=120&q=80" 
                            alt="Pizza" 
                            className="w-14 h-14 rounded-lg object-cover shrink-0"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto p-3 bg-white border-t border-slate-100">
                      <button
                        onClick={() => setActiveDemoStep(3)}
                        className="w-full py-2.5 bg-[#0F7A66] hover:bg-[#0c6353] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Customize Grilled Salmon ($36.00) →
                      </button>
                    </div>
                  </div>
                )}

                {/* ================= SCREEN STAGE 3: MODIFIERS & ADD-ONS ================= */}
                {activeDemoStep === 3 && (
                  <div className="flex-1 bg-white flex flex-col p-3.5 space-y-3.5 animate-in fade-in duration-300">
                    <div className="relative h-32 rounded-2xl overflow-hidden bg-slate-100">
                      <img 
                        src="https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80" 
                        alt="Salmon" 
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-900">Grilled Salmon Fillet</h3>
                      <span className="text-xs font-bold text-slate-900 block mt-0.5">$36.00</span>
                      <p className="text-[11px] text-slate-500 mt-1">Select cooking preference and sides.</p>
                    </div>

                    {/* Cooking Style Selection */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-800 block">Preparation Style:</span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-xl border-2 border-emerald-600 bg-emerald-50/40 font-bold text-emerald-900 flex items-center justify-between">
                          <span>Grilled (Charred)</span>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <div className="p-2 rounded-xl border border-slate-200 text-slate-600 flex items-center justify-between">
                          <span>Pan-seared</span>
                        </div>
                      </div>
                    </div>

                    {/* Add-ons */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-800 block">Add-ons:</span>
                      <div className="space-y-1.5 text-xs">
                        <div className="p-2 rounded-xl border-2 border-emerald-600 bg-emerald-50/40 flex items-center justify-between font-bold text-emerald-900">
                          <span className="flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded bg-emerald-600 text-white flex items-center justify-center text-[10px]">✓</span>
                            Lemon butter sauce
                          </span>
                          <span className="font-mono text-xs">+ $2.00</span>
                        </div>
                        <div className="p-2 rounded-xl border border-slate-200 text-slate-600 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded border border-slate-300" />
                            Side garden salad
                          </span>
                          <span className="font-mono text-xs">+ $4.00</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-2">
                      <button
                        onClick={() => setActiveDemoStep(4)}
                        className="w-full py-3 bg-[#0F7A66] hover:bg-[#0c6353] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>Add to Order · $38.00</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ================= SCREEN STAGE 4: CHECKOUT FORM ================= */}
                {activeDemoStep === 4 && (
                  <div className="flex-1 bg-white flex flex-col p-3.5 space-y-3 overflow-y-auto animate-in fade-in duration-300">
                    <h3 className="font-bold text-sm text-slate-900">Order Checkout</h3>

                    {/* Customer Info Card */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                      <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">Customer</span>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Name:</span>
                        <span className="font-bold text-slate-900">Ron Collins</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">WhatsApp:</span>
                        <span className="font-bold font-mono text-slate-900">+234 803 123 4567</span>
                      </div>
                    </div>

                    {/* Service Toggle */}
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                      <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">Service</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-lg border-2 border-emerald-600 bg-emerald-50/50 font-bold text-emerald-900 text-center">
                          Delivery ($10.00)
                        </div>
                        <div className="p-2 rounded-lg border border-slate-200 text-slate-600 text-center">
                          Pickup (Free)
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 pt-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="truncate">Beach Road SG 123456 (1.5 km)</span>
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                      <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider mb-1">Summary</span>
                      <div className="flex justify-between text-slate-600">
                        <span>1x Grilled Salmon + Lemon Butter</span>
                        <span className="font-mono">$38.00</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Delivery Fee</span>
                        <span className="font-mono">$10.00</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Tax (10%)</span>
                        <span className="font-mono">$3.80</span>
                      </div>
                      <div className="flex justify-between text-slate-900 font-bold pt-1.5 border-t border-slate-200 text-xs">
                        <span>Total:</span>
                        <span className="font-mono text-sm text-emerald-700">$51.80</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-1">
                      <button
                        onClick={() => setActiveDemoStep(5)}
                        className="w-full py-3 bg-[#0F7A66] hover:bg-[#0c6353] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>Continue to Payment →</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ================= SCREEN STAGE 5: LOCAL PAYMENT RAILS ================= */}
                {activeDemoStep === 5 && (
                  <div className="flex-1 bg-white flex flex-col p-3.5 space-y-3.5 animate-in fade-in duration-300">
                    <div className="text-center pt-2">
                      <span className="text-[11px] text-slate-500">Amount to Pay</span>
                      <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">$51.80</div>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">Order #123</span>
                    </div>

                    <div className="space-y-2 pt-1 text-xs">
                      <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">Choose Payment Platform:</span>

                      {/* Paystack Option */}
                      <button
                        onClick={() => setActiveDemoStep(6)}
                        className="w-full p-2.5 bg-slate-50 hover:bg-emerald-50/50 border-2 border-emerald-500 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-sky-500 text-white font-bold flex items-center justify-center text-xs">
                            P
                          </div>
                          <div className="text-left">
                            <span className="font-bold text-xs text-slate-900 block">Paystack</span>
                            <span className="text-[10px] text-slate-500">Cards, Direct Bank, USSD</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-emerald-700 font-mono">Instant Pay →</span>
                      </button>

                      {/* Flutterwave Option */}
                      <button
                        onClick={() => setActiveDemoStep(6)}
                        className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-amber-500 text-white font-bold flex items-center justify-center text-xs">
                            F
                          </div>
                          <div className="text-left">
                            <span className="font-bold text-xs text-slate-900 block">Flutterwave</span>
                            <span className="text-[10px] text-slate-500">African Mobile Money, Barter</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>

                      {/* Stripe Option */}
                      <button
                        onClick={() => setActiveDemoStep(6)}
                        className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                            S
                          </div>
                          <div className="text-left">
                            <span className="font-bold text-xs text-slate-900 block">Stripe / Apple Pay</span>
                            <span className="text-[10px] text-slate-500">Global Credit &amp; Debit Cards</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>

                    <div className="mt-auto pt-2">
                      <button
                        onClick={() => setActiveDemoStep(6)}
                        className="w-full py-3 bg-[#0F7A66] hover:bg-[#0c6353] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        Pay $51.80 with Paystack
                      </button>
                    </div>
                  </div>
                )}

                {/* ================= SCREEN STAGE 6: STRUCTURED WHATSAPP ORDER ================= */}
                {activeDemoStep === 6 && (
                  <div className="flex-1 p-3.5 flex flex-col justify-end space-y-3 animate-in fade-in duration-300">
                    {/* Payment Success Badge */}
                    <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-2xl flex items-center gap-2 text-xs text-emerald-900 font-bold">
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                        ✓
                      </div>
                      <span>Payment Confirmed via Paystack ($51.80)</span>
                    </div>

                    {/* Official OmniChat Structured WhatsApp Order Receipt */}
                    <div className="self-end bg-[#D9FDD3] text-slate-900 p-3.5 rounded-2xl rounded-br-xs max-w-[94%] text-xs shadow-xs space-y-1.5 font-sans leading-relaxed">
                      <div className="font-bold text-sm text-slate-900 border-b border-black/10 pb-1">
                        #123 Order Receipt
                      </div>
                      <div className="font-semibold text-slate-900">
                        1× Grilled Salmon Fillet
                      </div>
                      <div className="pl-3 text-[11px] text-slate-600">
                        └ Lemon butter sauce (+$2.00)
                      </div>
                      <div className="pt-1 text-[11px] space-y-0.5 border-t border-black/5">
                        <div className="flex justify-between">
                          <span>Item total:</span>
                          <span className="font-mono">$38.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Delivery:</span>
                          <span className="font-mono">$10.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax:</span>
                          <span className="font-mono">$3.80</span>
                        </div>
                        <div className="flex justify-between font-bold text-xs text-slate-950 pt-0.5">
                          <span>Total Paid:</span>
                          <span className="font-mono text-emerald-800">$51.80</span>
                        </div>
                      </div>
                      <div className="pt-1 text-[10px] text-slate-600 border-t border-black/5">
                        Customer: <strong className="text-slate-900">Ron Collins</strong> (+234 803 123 4567)
                      </div>
                      <div className="text-[10px] text-slate-600">
                        Service: <strong className="text-slate-900">Delivery</strong> (Beach Road SG)
                      </div>
                      <div className="text-[10px] text-slate-600">
                        Payment: <strong className="text-emerald-800 font-bold">Paystack (Paid)</strong>
                      </div>
                      <div className="pt-2 text-center border-t border-black/10">
                        <span className="text-xs text-[#027A6D] font-bold block">
                          📄 View Official Tax Invoice →
                        </span>
                      </div>
                      <span className="block text-[9px] text-slate-400 text-right mt-1">12:34 PM ✓✓</span>
                    </div>

                    <div className="pt-2 flex items-center justify-center gap-2">
                      <button
                        onClick={() => setActiveDemoStep(1)}
                        className="px-4 py-2 bg-slate-900 text-white rounded-full text-xs font-bold shadow-xs hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restart Demo</span>
                      </button>
                      <button
                        onClick={() => onOpenAuth('register')}
                        className="px-4 py-2 bg-[#0F7A66] hover:bg-[#0c6353] text-white rounded-full text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        Start Your Store Free →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Social Proof Bar (Backed by Meta & YC, Featured in Yahoo & TechCrunch) */}
          <div className="mt-14 pt-8 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-xs font-medium text-slate-500">
            <span className="uppercase tracking-wider text-[11px] font-bold text-slate-400">
              Backed by
            </span>
            <span className="font-extrabold text-base text-slate-800 tracking-tight">
              Meta
            </span>
            <span className="font-extrabold text-base text-orange-600 tracking-tight">
              Y Combinator
            </span>
            <span className="text-slate-300">|</span>
            <span className="uppercase tracking-wider text-[11px] font-bold text-slate-400">
              Featured in
            </span>
            <span className="font-extrabold text-base text-purple-700 tracking-tight">
              Yahoo
            </span>
            <span className="font-extrabold text-base text-emerald-700 tracking-tight">
              TechCrunch
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SECTION: SIMPLIFY WHATSAPP ORDERING (OmniChat Comparison)               */}
      {/* ========================================================================= */}
      <section id="ordering" className="py-16 md:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-14">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-800">
              WhatsApp ordering
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
              Simplify WhatsApp Ordering
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Turn chaotic back-and-forth chats into clean, structured orders — from first message to paid.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center max-w-5xl mx-auto">
            {/* Left Content Description */}
            <div className="space-y-4">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
                Receive clean orders instead of chat chaos
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Customers pick options, quantities, modifiers, and delivery addresses right in WhatsApp — so orders arrive complete with instant invoice links instead of buried in a 20-message chat.
              </p>
              <ul className="space-y-2 pt-2 text-xs sm:text-sm text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">✓</span>
                  <span>Instant menu modifiers &amp; variant add-ons</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">✓</span>
                  <span>Direct Paystack, Flutterwave, and Card payment links</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">✓</span>
                  <span>Automated official PDF invoices &amp; order IDs</span>
                </li>
              </ul>

              <div className="pt-2">
                <button
                  onClick={() => onOpenAuth('register')}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0F7A66] hover:text-[#0c6353] cursor-pointer"
                >
                  <span>Create your free WhatsApp store</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Comparison Card */}
            <div className="bg-[#EFEAE2] p-5 rounded-3xl border border-slate-300 shadow-lg space-y-3 font-sans text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-black/10">
                <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                  The Old Way vs OmniChat
                </span>
                <span className="text-[10px] bg-rose-500 text-white font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                  7 messages · still no order
                </span>
              </div>

              {/* Fragmented Chat Mess */}
              <div className="space-y-1.5 max-w-[85%] opacity-70">
                <div className="bg-white p-2 rounded-xl rounded-bl-xs text-slate-800">Hi! Can I get 2 pizzas?</div>
                <div className="bg-[#D9FDD3] p-2 rounded-xl rounded-br-xs text-slate-800 self-end ml-auto">Sure! What size?</div>
                <div className="bg-white p-2 rounded-xl rounded-bl-xs text-slate-800">Do you have large with mushrooms?</div>
                <div className="bg-[#D9FDD3] p-2 rounded-xl rounded-br-xs text-slate-800 self-end ml-auto">Yes we do. Delivery or pickup?</div>
                <div className="bg-white p-2 rounded-xl rounded-bl-xs text-slate-800">Delivery. How much is delivery to Ikeja?</div>
              </div>

              {/* The OmniChat Way */}
              <div className="pt-3 border-t border-black/10">
                <div className="bg-white p-3.5 rounded-2xl border-2 border-emerald-500 shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-xs">#76 Order Confirmed</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full font-mono">PAID</span>
                  </div>
                  <div className="text-[11px] text-slate-700 space-y-0.5">
                    <div>2x Margherita Pizza (Large + Mushrooms)</div>
                    <div>Delivery to: Ikeja GRA ($6.00)</div>
                    <div className="font-bold text-slate-950 mt-1">Total: $30.00 (Paid via Paystack)</div>
                  </div>
                  <div className="text-[10px] text-emerald-700 font-bold">
                    ✓ Clean order sent straight to merchant kitchen &amp; delivery rider
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SECTION: ACCEPT LOCAL PAYMENTS (Paystack, Flutterwave, Stripe)         */}
      {/* ========================================================================= */}
      <section id="payments" className="py-16 md:py-24 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-5 md:px-8 space-y-12">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-800">
              Payments
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
              Accept Local Payments
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Accept 100+ local payment methods your customers already use — zero setup fees, direct bank settlement, and every order confirmed.
            </p>
          </div>

          {/* Payment Marquee / Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 max-w-5xl mx-auto">
            {[
              { name: 'Paystack', subtitle: 'Cards & NGN Bank', color: 'bg-sky-500', logo: 'P' },
              { name: 'Flutterwave', subtitle: 'African Mobile Money', color: 'bg-amber-500', logo: 'F' },
              { name: 'Stripe', subtitle: 'Global Cards & Apple Pay', color: 'bg-indigo-600', logo: 'S' },
              { name: 'PayPal', subtitle: 'Global Express', color: 'bg-blue-600', logo: 'PP' },
              { name: 'Direct Bank', subtitle: 'Titan & GTBank', color: 'bg-emerald-600', logo: '🏦' },
              { name: 'Crypto USDT', subtitle: 'TRC20 & ERC20', color: 'bg-teal-600', logo: '₮' }
            ].map(rail => (
              <div 
                key={rail.name} 
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center text-center space-y-2 hover:border-slate-300 transition-colors shadow-2xs"
              >
                <div className={`w-10 h-10 rounded-xl ${rail.color} text-white font-extrabold flex items-center justify-center text-xs shadow-xs`}>
                  {rail.logo}
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 block leading-tight">{rail.name}</span>
                  <span className="text-[10px] text-slate-500 leading-snug">{rail.subtitle}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-slate-900 text-white rounded-3xl max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1.5 text-center md:text-left">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                Instant Automatic Payout
              </span>
              <h3 className="text-lg font-bold text-white">
                Every payment settles directly to your local bank account
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                We never hold your funds. When customers pay via Paystack or Flutterwave, settlements flow straight to your business bank or wallet.
              </p>
            </div>

            <button
              onClick={() => onOpenAuth('register')}
              className="px-6 py-3 bg-[#0F7A66] hover:bg-[#0c6353] text-white text-xs font-bold rounded-full shadow-md transition-all shrink-0 cursor-pointer"
            >
              Connect Your Payouts →
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. SECTION: MANAGE ORDERS ONLINE (OmniChat Live Order Preview)            */}
      {/* ========================================================================= */}
      <section id="management" className="py-16 md:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center max-w-5xl mx-auto">
            {/* Left Order Cards Preview */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xl space-y-3 font-sans">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-extrabold text-sm text-slate-900">Live WhatsApp Order Feed</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  ● Real-time
                </span>
              </div>

              {/* OmniChat Order Feed Items */}
              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">#1207</span>
                      <span className="font-bold text-slate-800">MEI CHEN</span>
                    </div>
                    <span className="text-slate-500 text-[11px] block mt-0.5">2x Caesar Salad · $18.00</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      Pending
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                      Unpaid
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-200 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">#1206</span>
                      <span className="font-bold text-slate-800">RON COLLINS</span>
                    </div>
                    <span className="text-slate-500 text-[11px] block mt-0.5">1x Grilled Salmon · $26.00</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      Confirmed
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 font-bold">
                      Paid
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">#1205</span>
                      <span className="font-bold text-slate-800">TIFFANY WILLIAMS</span>
                    </div>
                    <span className="text-slate-500 text-[11px] block mt-0.5">3x Artisan Burrata · $49.00</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Completed
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Paid
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Information */}
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-800">
                Order Operations
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
                Manage orders online
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                Track order status, share summaries and invoice links, and send automatic WhatsApp notifications — all from one clean merchant dashboard.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs sm:text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">✓</span>
                  <span>Track order status</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">✓</span>
                  <span>Order summaries</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">✓</span>
                  <span>Official invoice link</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">✓</span>
                  <span>Direct chat reply</span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-6 py-3 bg-[#0F7A66] hover:bg-[#0c6353] text-white text-xs font-bold rounded-full shadow-xs transition-colors cursor-pointer"
                >
                  Try the free order taking app →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. SECTION: PRICING TIERS                                                 */}
      {/* ========================================================================= */}
      <section id="pricing" className="py-16 md:py-24 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-5 md:px-8 space-y-12">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-800">
              Fair &amp; Transparent
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
              Simple pricing that scales with your sales
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Start completely free. Upgrade only when your order volume grows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Starter</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900">$0</span>
                  <span className="text-xs text-slate-500">/ forever free</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Perfect for solo merchants starting out on WhatsApp.
                </p>

                <ul className="space-y-2 pt-3 border-t border-slate-200 text-xs text-slate-700">
                  <li className="flex items-center gap-2">✓ <strong>20 Products</strong></li>
                  <li className="flex items-center gap-2">✓ <strong>1 Storefront</strong></li>
                  <li className="flex items-center gap-2">✓ <strong>1 Staff Seat</strong></li>
                  <li className="flex items-center gap-2">✓ Paystack &amp; Flutterwave</li>
                  <li className="flex items-center gap-2">✓ 200 Monthly AI Replies</li>
                </ul>
              </div>

              <button
                onClick={() => onOpenAuth('register')}
                className="w-full py-2.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-800 font-bold text-xs rounded-full transition-colors cursor-pointer"
              >
                Start Free
              </button>
            </div>

            {/* Pro Plan (Highlighted) */}
            <div className="p-6 bg-[#0F7A66] text-white border-2 border-emerald-500 rounded-3xl flex flex-col justify-between space-y-5 shadow-xl relative">
              <span className="absolute -top-3 right-6 bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                Most Popular
              </span>

              <div className="space-y-3">
                <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider font-mono">Pro Store</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">$29</span>
                  <span className="text-xs text-emerald-100">/ month</span>
                </div>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  For growing shops requiring team members &amp; multiple stores.
                </p>

                <ul className="space-y-2 pt-3 border-t border-white/20 text-xs text-white">
                  <li className="flex items-center gap-2">✓ <strong>150 Products</strong></li>
                  <li className="flex items-center gap-2">✓ <strong>3 Multi-Stores</strong></li>
                  <li className="flex items-center gap-2">✓ <strong>5 Staff Logins</strong></li>
                  <li className="flex items-center gap-2">✓ All Payment Gateways</li>
                  <li className="flex items-center gap-2">✓ 2,500 Monthly AI Replies</li>
                </ul>
              </div>

              <button
                onClick={() => onOpenAuth('register')}
                className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs rounded-full transition-colors cursor-pointer shadow-sm"
              >
                Upgrade to Pro
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider font-mono">Enterprise / Agency</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900">$79</span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  For high-volume retail chains and marketing agencies.
                </p>

                <ul className="space-y-2 pt-3 border-t border-slate-200 text-xs text-slate-700">
                  <li className="flex items-center gap-2">✓ <strong>1,000 Products</strong></li>
                  <li className="flex items-center gap-2">✓ <strong>10 Multi-Stores</strong></li>
                  <li className="flex items-center gap-2">✓ <strong>25 Team Seats</strong></li>
                  <li className="flex items-center gap-2">✓ Custom Domain (omnichat.store/yourname)</li>
                  <li className="flex items-center gap-2">✓ 10,000 Monthly AI Replies</li>
                </ul>
              </div>

              <button
                onClick={() => onOpenAuth('register')}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-full transition-colors cursor-pointer"
              >
                Get Enterprise
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-5 md:px-8 text-xs font-sans">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#0F7A66] flex items-center justify-center text-white">
              <Store className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-sm text-white">
              OmniChat<span className="text-[#0F7A66]"> Commerce</span>
            </span>
            <span className="text-slate-500 ml-2">· Create your online store for WhatsApp</span>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-slate-400">
            <button onClick={() => onLaunchDemo('food')} className="hover:text-white transition-colors cursor-pointer">
              Restaurant Demo
            </button>
            <button onClick={() => onLaunchDemo('fashion')} className="hover:text-white transition-colors cursor-pointer">
              Fashion Demo
            </button>
            <button onClick={onOpenAdmin} className="text-purple-400 hover:text-purple-300 font-bold transition-colors cursor-pointer">
              Super Admin Console
            </button>
            <button onClick={() => onOpenAuth('login')} className="hover:text-white transition-colors cursor-pointer">
              Log In
            </button>
            <button onClick={() => onOpenAuth('register')} className="hover:text-white transition-colors cursor-pointer">
              Sign Up
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-slate-900 text-slate-500 text-[11px] text-center md:text-left">
          © {new Date().getFullYear()} OmniChat Commerce Inc. All rights reserved. Meta, WhatsApp, Paystack, and Flutterwave are trademarks of their respective owners.
        </div>
      </footer>
    </div>
  );
};
