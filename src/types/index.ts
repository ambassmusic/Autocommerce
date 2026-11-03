export type BusinessIndustry = 'fashion' | 'food' | 'electronics' | 'beauty_services';
export type PlanTier = 'starter' | 'pro' | 'enterprise' | 'free';

export interface PlanTierConfig {
  tier: PlanTier;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  maxProducts: number;
  maxAiReplies: number;
  maxStores: number;
  maxTeamSeats: number;
  abandonedCartSteps: number;
  maxFollowUpRules: number;
  customWabaNumber: boolean;
  priorityAiLatency: boolean;
  features: string[];
}

export const PLAN_TIER_CONFIGS: Record<PlanTier, PlanTierConfig> = {
  starter: {
    tier: 'starter',
    name: 'Starter Tier',
    priceMonthly: 29,
    priceAnnual: 279,
    maxProducts: 15,
    maxAiReplies: 500,
    maxStores: 1,
    maxTeamSeats: 1,
    abandonedCartSteps: 1,
    maxFollowUpRules: 1,
    customWabaNumber: false,
    priorityAiLatency: false,
    features: [
      '15 Store Products',
      '500 AI Sales Bot replies/mo',
      '1 WhatsApp Storefront',
      '1 Team Admin Seat',
      '1-Step Abandoned Cart Recovery',
      '1 Automated Follow-up Rule',
      'Paystack, Flutterwave, Stripe & Crypto',
      'Standard WABA Connection'
    ]
  },
  pro: {
    tier: 'pro',
    name: 'Pro Growth Tier',
    priceMonthly: 79,
    priceAnnual: 759,
    maxProducts: 100,
    maxAiReplies: 5000,
    maxStores: 3,
    maxTeamSeats: 5,
    abandonedCartSteps: 3,
    maxFollowUpRules: 5,
    customWabaNumber: true,
    priorityAiLatency: true,
    features: [
      '100 Store Products',
      '5,000 AI Sales Bot replies/mo',
      'Up to 3 Multi-Stores',
      '5 Team Staff Seats with Roles',
      'Full 3-Step Abandoned Cart Funnel',
      '5 Automated Follow-up Rules',
      'Priority Rotational Gemini 2.5 Flash',
      'Custom WABA Meta Cloud API & Webhooks',
      'Booking Reminders & Shared Inbox'
    ]
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise Agency Tier',
    priceMonthly: 199,
    priceAnnual: 1899,
    maxProducts: 9999,
    maxAiReplies: 50000,
    maxStores: 50,
    maxTeamSeats: 50,
    abandonedCartSteps: 3,
    maxFollowUpRules: 20,
    customWabaNumber: true,
    priorityAiLatency: true,
    features: [
      'Unlimited Store Products',
      '50,000 AI Sales Bot replies/mo',
      'Unlimited Multi-Stores & Brands',
      'Unlimited Team Staff & Sub-Accounts',
      'Advanced Multi-Touch Recovery Engine',
      'Dedicated Custom WABA Meta Node',
      'Sub-50ms Rotational Gemini Key Pooling',
      '24/7 Priority SLA & Dedicated Tech Lead'
    ]
  },
  free: {
    tier: 'starter',
    name: 'Starter Tier',
    priceMonthly: 29,
    priceAnnual: 279,
    maxProducts: 15,
    maxAiReplies: 500,
    maxStores: 1,
    maxTeamSeats: 1,
    abandonedCartSteps: 1,
    maxFollowUpRules: 1,
    customWabaNumber: false,
    priorityAiLatency: false,
    features: [
      '15 Store Products',
      '500 AI Sales Bot replies/mo',
      '1 WhatsApp Storefront',
      '1 Team Admin Seat',
      'Paystack, Flutterwave, Stripe & Crypto'
    ]
  }
};

export interface StoreInfo {
  id: string;
  name: string;
  industry: BusinessIndustry;
  tagline: string;
  currency: string;
  currencySymbol: string;
  productsCount: number;
  monthlyRevenue: number;
  whatsappPhone: string;
  isActive: boolean;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Store Manager' | 'Sales Specialist' | 'Support Agent';
  status: 'active' | 'invited';
  assignedStores: string[];
  addedAt: string;
  lastActive: string;
}

export type ProductType = 'physical' | 'digital';

export interface Product {
  id: string;
  name: string;
  category: string;
  industry: BusinessIndustry;
  productType?: ProductType; // 'physical' (shipped to address) or 'digital' (download/license to email)
  digitalFileUrl?: string;
  digitalDownloadNotes?: string;
  price: number;
  originalPrice?: number;
  description: string;
  image: string;
  images?: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  featured: boolean;
  tags: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export type MessageType = 
  | 'text' 
  | 'catalog' 
  | 'product_card' 
  | 'cart_summary' 
  | 'checkout_request' 
  | 'order_confirmation' 
  | 'status_update'
  | 'campaign_promo'
  | 'appointment_booking'
  | 'follow_up_reminder';

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'bot' | 'system';
  text: string;
  timestamp: string;
  type: MessageType;
  payload?: {
    product?: Product;
    products?: Product[];
    cart?: CartItem[];
    order?: Order;
    appointment?: AppointmentBooking;
    quickReplies?: string[];
    discountApplied?: number;
  };
  status?: 'sent' | 'delivered' | 'read';
}

export type OrderStatus = 'new' | 'paid' | 'packing' | 'shipping' | 'delivered' | 'cancelled';

export type PaymentMethod = 
  | 'paypal' 
  | 'stripe' 
  | 'paystack' 
  | 'flutterwave' 
  | 'bank_transfer' 
  | 'crypto_usdt' 
  | 'cash_on_delivery' 
  | 'whatsapp_pay';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  productType?: ProductType;
  industry: BusinessIndustry;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'completed' | 'cod';
  status: OrderStatus;
  trackingNumber?: string;
  digitalDeliveryStatus?: 'pending' | 'delivered';
  digitalDeliverySentAt?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

// Feature 5: Booking and Reminder Automation
export interface AppointmentBooking {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceName: string;
  providerName: string;
  date: string;
  time: string;
  price: number;
  status: 'confirmed' | 'reminder_sent' | 'completed' | 'cancelled';
  notes?: string;
}

// Feature 6: Customer CRM and Shared Inbox
export type LeadStage = 'lead' | 'enquired' | 'abandoned' | 'customer' | 'vip';

export interface CustomerLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  industry: BusinessIndustry;
  stage: LeadStage;
  totalSpend: number;
  ordersCount: number;
  lastActive: string;
  notes: string;
  assignedStaff: string;
  lastMessagePreview?: string;
}

// Feature 2: Automated Follow-ups
export interface FollowUpRule {
  id: string;
  title: string;
  triggerType: 'enquiry_no_purchase' | 'catalog_view_pause' | 'general_question';
  delayHours: number;
  messageTemplate: string;
  enabled: boolean;
  isProFeature: boolean;
  conversionsCount: number;
}

// Feature 4: Abandoned Cart Recovery
export interface AbandonedCartSequence {
  id: string;
  step: string;
  delayMinutes: number;
  messageTemplate: string;
  discountCode?: string;
  enabled: boolean;
  isProFeature: boolean;
  recoveryRate: string;
}

// ======================== MERCHANT SELF-MANAGED PAYMENT GATEWAYS ========================
export interface MerchantPayPalConfig {
  enabled: boolean;
  mode: 'sandbox' | 'live';
  clientId: string;
  clientSecret: string;
  webhookId: string;
  currency: string;
  verified: boolean;
}

export interface MerchantStripeConfig {
  enabled: boolean;
  testMode: boolean;
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  enableApplePay: boolean;
  verified: boolean;
}

export interface MerchantPaystackConfig {
  enabled: boolean;
  testMode: boolean;
  publicKey: string;
  secretKey: string;
  currency: string;
  verified: boolean;
}

export interface MerchantFlutterwaveConfig {
  enabled: boolean;
  testMode: boolean;
  publicKey: string;
  secretKey: string;
  encryptionKey: string;
  currency: string;
  verified: boolean;
}

export interface MerchantBankTransferConfig {
  enabled: boolean;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingOrSwift: string;
  bankAddress?: string;
  instructions: string;
  requireProofUpload: boolean;
  verified: boolean;
}

export interface MerchantCryptoConfig {
  enabled: boolean;
  provider: 'DirectWallet' | 'NowPayments' | 'CoinbaseCommerce';
  usdtTrc20Address: string;
  usdtErc20Address: string;
  btcAddress: string;
  solAddress: string;
  instantConfirmation: boolean;
  verified: boolean;
}

export interface MerchantGatewaysConfig {
  paypal: MerchantPayPalConfig;
  stripe: MerchantStripeConfig;
  paystack: MerchantPaystackConfig;
  flutterwave: MerchantFlutterwaveConfig;
  bankTransfer: MerchantBankTransferConfig;
  crypto: MerchantCryptoConfig;
}

export interface EvolutionBaileysConfig {
  instanceName: string;
  serverUrl: string;
  apiKey: string;
  webhookUrl: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'qr_ready';
  phoneConnected: string;
  pushName: string;
  pairingCode?: string;
  batteryPercentage: number;
  engineVersion: string;
  lastPingMs: number;
  syncEvents: {
    messagesUpsert: boolean;
    connectionUpdate: boolean;
    qrcodeUpdated: boolean;
  };
}

export interface BotSettings {
  storeName: string;
  storeTagline: string;
  industry: BusinessIndustry;
  persona: 'Luxury Boutique Stylist' | 'Direct Concierge' | 'Friendly Assistant';
  autoReplyGreeting: boolean;
  welcomeMessage: string;
  operatingHours: string;
  currency: string;
  currencySymbol: string;
  freeShippingThreshold: number;
  defaultShippingFee: number;
  activeDiscountCode: string;
  discountPercentage: number;
  autoSendTrackingUpdates: boolean;
  allowCashOnDelivery: boolean;
  
  // Account Details
  ownerName: string;
  contactEmail: string;
  contactPhone: string;
  storeAddress: string;
  payoutBank: string;
  payoutAccountNumber: string;
  payoutAccountName: string;
  payoutCryptoWallet: string;

  // Merchant Self-Managed Payment Gateways
  merchantGateways: MerchantGatewaysConfig;

  // WhatsApp Connection Config (Supports Evolution API / Baileys No-CAC WebSockets & Meta WABA)
  connectionEngine: 'evolution_baileys' | 'meta_cloud_waba';
  evolutionConfig: EvolutionBaileysConfig;
  whatsappPhoneNumber: string;
  whatsappVerifiedName: string;
  whatsappConnected: boolean;
  metaWabaId: string;
  metaPhoneNumberId?: string;
  metaAccessToken?: string;
  autoSyncCatalog: boolean;

  // Plan
  planTier: PlanTier;
  monthlyAiRepliesLimit: number;
  monthlyAiRepliesUsed: number;
}

export interface MarketingCampaign {
  id: string;
  title: string;
  tagline: string;
  badge: string;
  message: string;
  industry: BusinessIndustry;
  targetAudience: string;
  estimatedReach: number;
  historicalConversion: string;
  featuredProductId?: string;
}

export interface PresetStore {
  id: string;
  name: string;
  industry: BusinessIndustry;
  tagline: string;
  currency: string;
  currencySymbol: string;
  products: Product[];
}

// ======================== SUPER ADMIN & AUTH TYPES ========================

export interface PaystackConfig {
  enabled: boolean;
  testMode: boolean;
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  supportedCurrencies: string[];
}

export interface FlutterwaveConfig {
  enabled: boolean;
  testMode: boolean;
  publicKey: string;
  secretKey: string;
  encryptionKey: string;
  webhookSecret: string;
  supportedCurrencies: string[];
}

export interface CryptoConfig {
  enabled: boolean;
  provider: 'NowPayments' | 'DirectWallet' | 'CoinbaseCommerce';
  usdtTrc20Address: string;
  usdtErc20Address: string;
  btcAddress: string;
  acceptedCoins: string[];
  instantConfirmations: boolean;
}

export interface StripeConfig {
  enabled: boolean;
  publishableKey: string;
  secretKey: string;
}

export interface PaymentGatewaysConfig {
  paystack: PaystackConfig;
  flutterwave: FlutterwaveConfig;
  crypto: CryptoConfig;
  stripe: StripeConfig;
}

export interface GeminiKeyRotation {
  id: string;
  label: string;
  keyPreview: string;
  model: string;
  status: 'active' | 'rate_limited' | 'quota_warning' | 'standby';
  totalRequests: number;
  latencyMs: number;
  lastUsedAt: string;
  isPrimary: boolean;
}

export interface WhatsAppCloudApiConfig {
  status: 'connected' | 'disconnected';
  appId?: string;
  appSecret?: string;
  systemAccessToken?: string;
  embeddedSignupEnabled?: boolean;
  wabaId: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  tokenPreview: string;
  webhookUrl: string;
  verifyToken: string;
  apiVersion: string;
  lastPingMs: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  businessName: string;
  industry: BusinessIndustry;
  plan: 'Starter ($29/mo)' | 'Growth ($79/mo)' | 'Scale ($249/mo)';
  status: 'active' | 'suspended';
  ordersCount: number;
  mrr: number;
  registeredAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  merchantName: string;
  email: string;
  subject: string;
  category: 'Payment Gateway' | 'WhatsApp API' | 'AI Bot' | 'Billing' | 'General';
  priority: 'urgent' | 'high' | 'normal';
  status: 'open' | 'in_progress' | 'resolved';
  lastUpdated: string;
  preview: string;
}

export interface StoredUserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  businessName: string;
  industry: BusinessIndustry;
  role: 'merchant' | 'superadmin';
  planTier: PlanTier;
  createdAt: string;
}

export interface GoogleOAuthConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  verified: boolean;
}

export interface GitHubOAuthConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  verified: boolean;
}

export interface WhatsAppOtpAuthConfig {
  enabled: boolean;
  provider: 'Evolution_Baileys' | 'Twilio' | 'MetaCloud';
}

export interface AuthProvidersConfig {
  google: GoogleOAuthConfig;
  github: GitHubOAuthConfig;
  whatsappOtp: WhatsAppOtpAuthConfig;
  allowEmailPassword: boolean;
  defaultCountry: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'merchant' | 'superadmin';
  businessName: string;
  industry: BusinessIndustry;
  planTier: PlanTier;
}

export interface SubscriptionInvoice {
  id: string;
  invoiceNumber: string;
  transactionReference: string;
  planTier: PlanTier;
  planName: string;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'annual';
  paymentGateway: 'paystack' | 'flutterwave' | 'stripe' | 'crypto' | 'bank_transfer';
  paymentMethodDetails: string;
  status: 'paid' | 'pending';
  merchantName: string;
  merchantEmail: string;
  businessName: string;
  issuedAt: string;
  validUntil: string;
}
