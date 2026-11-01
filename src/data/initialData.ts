import { 
  Product, Order, BotSettings, ChatMessage, MarketingCampaign, 
  PresetStore, PaymentGatewaysConfig, GeminiKeyRotation, 
  WhatsAppCloudApiConfig, AdminUser, SupportTicket,
  AppointmentBooking, CustomerLead, FollowUpRule, AbandonedCartSequence,
  StoredUserAccount, StoreInfo, TeamMember, MerchantGatewaysConfig,
  AuthProvidersConfig
} from '../types';

export const MULTI_INDUSTRY_PRESETS: PresetStore[] = [
  {
    id: 'fashion',
    name: 'AURA Atelier & Goods',
    industry: 'fashion',
    tagline: 'Curated menswear, footwear & handcrafted leather',
    currency: 'USD',
    currencySymbol: '$',
    products: [
      {
        id: 'prod_linen_01',
        name: 'Artisanal Linen Overshirt',
        category: 'Apparel',
        industry: 'fashion',
        price: 118,
        originalPrice: 145,
        description: 'Tailored relaxed-fit 100% Normandy flax linen with natural mother-of-pearl buttons. Breathable, pre-washed for soft drape.',
        image: '/src/assets/images/linen_overshirt_1793193350092.jpg',
        images: [
          '/src/assets/images/linen_overshirt_1793193350092.jpg',
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1589310243389-96a5483213a8?auto=format&fit=crop&w=800&q=80'
        ],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Oat Sand', 'Chalk White'],
        stock: 14,
        featured: true,
        productType: 'physical',
        tags: ['linen', 'shirt', 'overshirt', 'summer', 'apparel', 'bestseller']
      },
      {
        id: 'prod_weekender_02',
        name: 'Full-Grain Cognac Leather Weekender',
        category: 'Leather Goods',
        industry: 'fashion',
        productType: 'physical',
        price: 285,
        originalPrice: 320,
        description: 'Handcrafted vegetable-tanned Italian leather with solid brass hardware, reinforced base, and detachable shoulder strap.',
        image: '/src/assets/images/leather_weekender_1793193350506.jpg',
        images: [
          '/src/assets/images/leather_weekender_1793193350506.jpg',
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80'
        ],
        sizes: ['One Size (45L)'],
        colors: ['Cognac Brown', 'Dark Espresso'],
        stock: 7,
        featured: true,
        tags: ['leather', 'bag', 'weekender', 'travel', 'duffle', 'luggage']
      },
      {
        id: 'prod_sneakers_03',
        name: 'Minimalist Chalk Low-Top Sneakers',
        category: 'Footwear',
        industry: 'fashion',
        productType: 'physical',
        price: 165,
        originalPrice: 185,
        description: 'Buttery calfskin leather upper paired with durable Margom rubber sole and memory-foam arch support insoles.',
        image: '/src/assets/images/artisan_sneakers_1793193350841.jpg',
        images: [
          '/src/assets/images/artisan_sneakers_1793193350841.jpg',
          'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80'
        ],
        sizes: ['40', '41', '42', '43', '44', '45'],
        colors: ['Chalk White', 'Monochrome Gray'],
        stock: 18,
        featured: true,
        tags: ['sneakers', 'shoes', 'footwear', 'leather', 'chalk', 'trainers']
      },
      {
        id: 'prod_cashmere_04',
        name: 'Charcoal Ribbed Cashmere Crewneck',
        category: 'Apparel',
        industry: 'fashion',
        price: 195,
        originalPrice: 240,
        description: '100% Mongolian 2-ply grade-A cashmere knit with saddle shoulder construction and rib-knit cuffs.',
        image: '/src/assets/images/cashmere_knit_1793193352022.jpg',
        images: [
          '/src/assets/images/cashmere_knit_1793193352022.jpg',
          'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80'
        ],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Charcoal Melange', 'Deep Navy'],
        stock: 9,
        featured: true,
        productType: 'physical',
        tags: ['cashmere', 'knit', 'sweater', 'crewneck', 'apparel', 'winter']
      },
      {
        id: 'prod_lookbook_digital',
        name: 'Atelier Capsule Lookbook & Masterclass',
        category: 'Digital Guides',
        industry: 'fashion',
        productType: 'digital',
        price: 29,
        originalPrice: 49,
        description: 'Complete 84-page wardrobe capsule architecture guide (PDF) + 4K video masterclass. Delivered directly to your email instantly upon verified payment.',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80'
        ],
        sizes: ['Digital Access (PDF + Video)'],
        colors: ['Direct Email Delivery'],
        stock: 999,
        featured: true,
        digitalFileUrl: 'https://storage.googleapis.com/omnichat-digital-assets/atelier_capsule_masterclass_v3.pdf',
        digitalDownloadNotes: 'Includes high-res PDF download, video access link, and seasonal updates.',
        tags: ['digital', 'lookbook', 'guide', 'ebook', 'masterclass', 'pdf', 'instant']
      }
    ]
  },
  {
    id: 'food',
    name: 'Tavola Artisan Kitchen & Delivery',
    industry: 'food',
    tagline: 'Neapolitan sourdough pizzas, pasta fresca & fine wines',
    currency: 'USD',
    currencySymbol: '$',
    products: [
      {
        id: 'prod_pizza_01',
        name: 'San Marzano Truffle Burrata Pizza',
        category: 'Wood-Fired Pizza',
        industry: 'food',
        price: 24,
        description: '48-hour fermented sourdough crust, San Marzano D.O.P. tomatoes, fresh Puglia burrata, and black summer truffle oil.',
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80'
        ],
        sizes: ['12-inch Individual', '16-inch Sharing'],
        colors: ['Original Crust', 'Gluten-Free (+ $3)'],
        stock: 45,
        featured: true,
        tags: ['pizza', 'truffle', 'burrata', 'food', 'dinner', 'italian']
      },
      {
        id: 'prod_burger_02',
        name: 'Wagyu Smash Double Cheeseburger',
        category: 'Gourmet Burgers',
        industry: 'food',
        price: 19,
        description: 'Prime Australian Wagyu beef smashed thin on a griddle, aged cave cheddar, caramelized shallots, brioche bun.',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80'
        ],
        sizes: ['Double Patty', 'Triple Patty (+ $4)'],
        colors: ['Truffle Fries Combo', 'Sweet Potato Fries'],
        stock: 30,
        featured: true,
        tags: ['burger', 'wagyu', 'fries', 'lunch', 'delivery']
      },
      {
        id: 'prod_matcha_03',
        name: 'Ceremonial Uji Matcha Cold Brew',
        category: 'Artisan Beverages',
        industry: 'food',
        price: 7.5,
        description: 'Stone-ground first harvest Kyoto matcha whisked over chilled oat milk and Madagascar vanilla bean syrup.',
        image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?auto=format&fit=crop&w=800&q=80'
        ],
        sizes: ['Regular (16oz)', 'Large (24oz)'],
        colors: ['Oat Milk', 'Almond Milk', 'Whole Milk'],
        stock: 60,
        featured: true,
        tags: ['matcha', 'drink', 'beverage', 'tea', 'cold brew']
      }
    ]
  },
  {
    id: 'electronics',
    name: 'AeroTech Gadgets & Audio',
    industry: 'electronics',
    tagline: 'Precision audio, mechanical peripherals & MagSafe gear',
    currency: 'USD',
    currencySymbol: '$',
    products: [
      {
        id: 'prod_audio_01',
        name: 'Spatial Pro Wireless ANC Headphones',
        category: 'Personal Audio',
        industry: 'electronics',
        price: 249,
        originalPrice: 299,
        description: '40mm custom beryllium dynamic drivers, 42dB hybrid active noise cancellation, and 45-hour battery playback.',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80'
        ],
        sizes: ['Standard'],
        colors: ['Space Slate', 'Chalk Silver'],
        stock: 22,
        featured: true,
        tags: ['headphones', 'audio', 'wireless', 'anc', 'gadget']
      },
      {
        id: 'prod_charger_02',
        name: '3-in-1 Foldable MagSafe Charging Stand',
        category: 'Charging & Power',
        industry: 'electronics',
        price: 68,
        description: 'Machined aerospace aluminum stand charging phone (15W Qi2), Apple Watch, and AirPods simultaneously.',
        image: 'https://images.unsplash.com/photo-1622445262464-84b14e0745b1?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1622445262464-84b14e0745b1?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=800&q=80'
        ],
        sizes: ['Standard'],
        colors: ['Midnight Black', 'Anodized Silver'],
        stock: 35,
        featured: true,
        tags: ['charger', 'magsafe', 'apple', 'wireless', 'accessories']
      }
    ]
  },
  {
    id: 'beauty_services',
    name: 'LUMEN Skin Clinic & Apothecary',
    industry: 'beauty_services',
    tagline: 'Clean clinical botanicals & medical-grade spa treatments',
    currency: 'USD',
    currencySymbol: '$',
    products: [
      {
        id: 'prod_serum_01',
        name: 'Botanical Ceramide Radiance Elixir',
        category: 'Skincare',
        industry: 'beauty_services',
        price: 84,
        description: 'Lipid-barrier repair serum with 5 essential ceramides, squalane, cold-pressed rosehip seed, and peptide complex.',
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1608248597359-705d9859f518?auto=format&fit=crop&w=800&q=80'
        ],
        sizes: ['30ml Bottle', '50ml Deluxe'],
        colors: ['Standard'],
        stock: 28,
        featured: true,
        tags: ['serum', 'skincare', 'botanical', 'beauty', 'face']
      },
      {
        id: 'prod_service_02',
        name: 'Hydra-Infusion Glow Facial (60 Mins)',
        category: 'Clinic Treatments',
        industry: 'beauty_services',
        price: 160,
        description: 'Deep vortex pore extraction, oxygen micro-mist infusion, lymphatic contour massage, and medical LED light therapy.',
        image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
        images: [
          'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=800&q=80'
        ],
        sizes: ['60-Min Appointment', '90-Min Deluxe (+ $60)'],
        colors: ['Downtown Clinic', 'Uptown Spa'],
        stock: 12,
        featured: true,
        tags: ['facial', 'spa', 'booking', 'appointment', 'clinic']
      }
    ]
  }
];

export const INITIAL_PRODUCTS: Product[] = MULTI_INDUSTRY_PRESETS[0].products;

// Mapped products per initial store
export const INITIAL_STORE_PRODUCTS: Record<string, Product[]> = {
  store_aura_main: MULTI_INDUSTRY_PRESETS[0].products,
  store_tavola_kitchen: MULTI_INDUSTRY_PRESETS[1].products,
  store_aerotech_tech: MULTI_INDUSTRY_PRESETS[2].products
};

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord_1088',
    orderNumber: 'WA-#1088',
    customerName: 'Elena Rostova',
    customerPhone: '+1 (415) 892-4410',
    customerAddress: '450 Sutter St, Suite 1200, San Francisco, CA 94108',
    industry: 'fashion',
    items: [
      {
        product: INITIAL_PRODUCTS[1],
        quantity: 1,
        selectedSize: 'One Size (45L)',
        selectedColor: 'Cognac Brown'
      }
    ],
    subtotal: 285,
    discount: 28.5,
    shipping: 0,
    total: 256.5,
    paymentMethod: 'paystack',
    paymentStatus: 'completed',
    status: 'shipping',
    trackingNumber: 'USPS-9405-5118-9922',
    createdAt: 'Today, 04:12 PM',
    updatedAt: 'Today, 04:45 PM',
    notes: 'Paid via Paystack Card'
  },
  {
    id: 'ord_1087',
    orderNumber: 'WA-#1087',
    customerName: 'Marcus Vance',
    customerPhone: '+1 (650) 332-9011',
    customerAddress: '725 Green St, Apt 4B, Palo Alto, CA 94301',
    industry: 'fashion',
    items: [
      {
        product: INITIAL_PRODUCTS[0],
        quantity: 1,
        selectedSize: 'L',
        selectedColor: 'Oat Sand'
      },
      {
        product: INITIAL_PRODUCTS[2],
        quantity: 1,
        selectedSize: '43',
        selectedColor: 'Chalk White'
      }
    ],
    subtotal: 283,
    discount: 0,
    shipping: 0,
    total: 283,
    paymentMethod: 'crypto_usdt',
    paymentStatus: 'completed',
    status: 'packing',
    trackingNumber: 'FEDEX-7782-1903-8840',
    createdAt: 'Today, 02:24 PM',
    updatedAt: 'Today, 03:10 PM',
    notes: 'USDT TRC20 instant on-chain confirmation (0x9f1a...4bc2)'
  },
  {
    id: 'ord_1086',
    orderNumber: 'WA-#1086',
    customerName: 'Sofia Chen',
    customerPhone: '+1 (510) 904-7721',
    customerAddress: '1942 Berkeley Way, Berkeley, CA 94704',
    industry: 'fashion',
    items: [
      {
        product: INITIAL_PRODUCTS[3],
        quantity: 1,
        selectedSize: 'M',
        selectedColor: 'Charcoal Melange'
      }
    ],
    subtotal: 195,
    discount: 19.5,
    shipping: 0,
    total: 175.5,
    paymentMethod: 'flutterwave',
    paymentStatus: 'completed',
    status: 'delivered',
    trackingNumber: 'LOCAL-COURIER-SF04',
    createdAt: 'Yesterday, 11:15 AM',
    updatedAt: 'Today, 01:20 PM',
    notes: 'Paid via Flutterwave Mobile Money'
  }
];

export const INITIAL_STORE_ORDERS: Record<string, Order[]> = {
  store_aura_main: INITIAL_ORDERS,
  store_tavola_kitchen: [
    {
      id: 'ord_tavola_01',
      orderNumber: 'WA-#TAV-501',
      customerName: 'Leonardo Rossi',
      customerPhone: '+1 (415) 772-9018',
      customerAddress: '880 North Point St, San Francisco, CA 94109',
      industry: 'food',
      items: [
        {
          product: MULTI_INDUSTRY_PRESETS[1].products[0],
          quantity: 2,
          selectedSize: '16-inch Sharing',
          selectedColor: 'Original Crust'
        },
        {
          product: MULTI_INDUSTRY_PRESETS[1].products[2],
          quantity: 2,
          selectedSize: 'Large (24oz)',
          selectedColor: 'Oat Milk'
        }
      ],
      subtotal: 63,
      discount: 0,
      shipping: 5,
      total: 68,
      paymentMethod: 'stripe',
      paymentStatus: 'completed',
      status: 'shipping',
      trackingNumber: 'DOORDASH-COURIER-91',
      createdAt: 'Today, 12:30 PM',
      updatedAt: 'Today, 12:45 PM',
      notes: 'Hot delivery to North Beach'
    }
  ],
  store_aerotech_tech: [
    {
      id: 'ord_aero_01',
      orderNumber: 'WA-#AERO-902',
      customerName: 'Tariq Al-Mansoor',
      customerPhone: '+1 (408) 662-8812',
      customerAddress: '320 Santana Row, San Jose, CA 95128',
      industry: 'electronics',
      items: [
        {
          product: MULTI_INDUSTRY_PRESETS[2].products[0],
          quantity: 1,
          selectedSize: 'Standard',
          selectedColor: 'Space Slate'
        }
      ],
      subtotal: 249,
      discount: 25,
      shipping: 0,
      total: 224,
      paymentMethod: 'crypto_usdt',
      paymentStatus: 'completed',
      status: 'packing',
      trackingNumber: 'UPS-2DAY-8921092',
      createdAt: 'Today, 01:10 PM',
      updatedAt: 'Today, 01:25 PM',
      notes: 'Confirmed on TRON network'
    }
  ]
};

// Feature 5: Bookings and Appointments
export const INITIAL_APPOINTMENTS: AppointmentBooking[] = [
  {
    id: 'app_01',
    customerName: 'Claire Beaumont',
    customerPhone: '+1 (415) 891-2309',
    customerEmail: 'claire.b@gmail.com',
    serviceName: 'Hydra-Infusion Glow Facial (60 Mins)',
    providerName: 'Clara Delacroix (Lead Aesthetician)',
    date: 'Tomorrow, Oct 29',
    time: '02:00 PM',
    price: 160,
    status: 'confirmed',
    notes: 'Sensitive skin. Requested cold rose quartz roller finish.'
  },
  {
    id: 'app_02',
    customerName: 'Julian Sterling',
    customerPhone: '+1 (650) 441-9981',
    customerEmail: 'jsterling@outlook.com',
    serviceName: 'Sartorial In-Atelier Wardrobe Fitting',
    providerName: 'Mateo (Senior Stylist)',
    date: 'Friday, Oct 31',
    time: '11:30 AM',
    price: 95,
    status: 'reminder_sent',
    notes: 'Wedding guest outfit curation. Sizing 42 jacket / 32 waist.'
  },
  {
    id: 'app_03',
    customerName: 'Tanya Morales',
    customerPhone: '+1 (510) 772-0092',
    serviceName: 'Deep Scalp Detox & Botanical Oil Treatment',
    providerName: 'Sophie Lin',
    date: 'Saturday, Nov 01',
    time: '04:15 PM',
    price: 120,
    status: 'confirmed',
    notes: 'Booked via WhatsApp direct booking automated workflow.'
  }
];

// Feature 6: Customer CRM & Leads
export const INITIAL_LEADS: CustomerLead[] = [
  {
    id: 'lead_01',
    name: 'Elena Rostova',
    phone: '+1 (415) 892-4410',
    email: 'elena.rostova@gmail.com',
    industry: 'fashion',
    stage: 'vip',
    totalSpend: 785.50,
    ordersCount: 3,
    lastActive: 'Today at 04:45 PM',
    notes: 'Prefers expedited courier dispatch. Bought leather weekender and cashmere knit.',
    assignedStaff: 'Amara (Owner)',
    lastMessagePreview: 'Thank you! The tracking link works perfectly.'
  },
  {
    id: 'lead_02',
    name: 'Marcus Vance',
    phone: '+1 (650) 332-9011',
    email: 'marcus.vance@techcorp.io',
    industry: 'fashion',
    stage: 'customer',
    totalSpend: 283.00,
    ordersCount: 1,
    lastActive: 'Today at 02:24 PM',
    notes: 'Linen Overshirt in Large + Chalk Sneakers. Inquired about shoe care conditioner.',
    assignedStaff: 'David (Sales)',
    lastMessagePreview: 'Paid with Crypto USDT. Can you confirm when it ships?'
  },
  {
    id: 'lead_03',
    name: 'Chloe Davenport',
    phone: '+1 (415) 309-8812',
    email: 'chloe.d@designstudio.co',
    industry: 'fashion',
    stage: 'abandoned',
    totalSpend: 0,
    ordersCount: 0,
    lastActive: '3 hours ago',
    notes: 'Left 1x French Linen Overshirt in bag. Recovery message sent automatically.',
    assignedStaff: 'AI Bot Automator',
    lastMessagePreview: 'Added to bag, paused at payment step.'
  },
  {
    id: 'lead_04',
    name: 'David Aris',
    phone: '+1 (510) 991-3420',
    email: 'david.aris@consulting.com',
    industry: 'fashion',
    stage: 'enquired',
    totalSpend: 0,
    ordersCount: 0,
    lastActive: '5 hours ago',
    notes: 'Asked about sneaker size 44 fit and leather quality. No order placed yet.',
    assignedStaff: 'Amara (Owner)',
    lastMessagePreview: 'Do the sneakers run narrow around the toe box?'
  }
];

// Feature 2: Automated Follow-up Rules
export const INITIAL_FOLLOWUP_RULES: FollowUpRule[] = [
  {
    id: 'flw_01',
    title: 'Silent Enquiry 2-Hour Recovery',
    triggerType: 'enquiry_no_purchase',
    delayHours: 2,
    messageTemplate: 'Hi {CustomerName}! 👋 We noticed you asked about our {ProductName}. We still have a few units reserved for today. Would you like us to hold one for you before it sells out?',
    enabled: true,
    isProFeature: false,
    conversionsCount: 29
  },
  {
    id: 'flw_02',
    title: 'Post-Enquiry VIP Incentive (24-Hour)',
    triggerType: 'general_question',
    delayHours: 24,
    messageTemplate: 'Hello {CustomerName}! Just following up on your inquiry. Here is a private 10% voucher code ({DiscountCode}) valid for the next 24 hours to welcome you!',
    enabled: true,
    isProFeature: true,
    conversionsCount: 46
  }
];

// Feature 4: Abandoned Cart Recovery Sequences
export const INITIAL_CART_SEQUENCES: AbandonedCartSequence[] = [
  {
    id: 'cart_seq_01',
    step: 'Step 1: Gentle Reminder (45 Minutes)',
    delayMinutes: 45,
    messageTemplate: '👋 Hi {CustomerName}! We noticed you left {ItemCount} item(s) in your WhatsApp bag. Tap below to resume your order and get free express shipping!',
    enabled: true,
    isProFeature: false,
    recoveryRate: '38.4%'
  },
  {
    id: 'cart_seq_02',
    step: 'Step 2: Urgency & Stock Alert (4 Hours)',
    delayMinutes: 240,
    messageTemplate: '⚠️ Quick alert {CustomerName}: Items in your WhatsApp bag have low inventory ({StockRemaining} left). Tap below to lock in yours before they sell out.',
    enabled: true,
    isProFeature: true,
    recoveryRate: '51.2%'
  },
  {
    id: 'cart_seq_03',
    step: 'Step 3: Final Sweetener Offer (24 Hours)',
    delayMinutes: 1440,
    messageTemplate: '🎁 Special offer for {CustomerName}: Complete your order today with code RECOVER10 to enjoy 10% off + complimentary gift packaging!',
    discountCode: 'RECOVER10',
    enabled: true,
    isProFeature: true,
    recoveryRate: '62.7%'
  }
];

export const INITIAL_BOT_SETTINGS: BotSettings = {
  storeName: 'AURA Atelier & Goods',
  storeTagline: 'Curated menswear, footwear & handcrafted leather',
  industry: 'fashion',
  persona: 'Luxury Boutique Stylist',
  autoReplyGreeting: true,
  welcomeMessage: 'Hello and welcome to AURA Atelier! ✨ Browse our new arrivals catalog below, ask about fabric & sizing, or tap View Cart anytime.',
  operatingHours: 'Daily 09:00 - 21:00 PST (AI Stylist 24/7)',
  currency: 'USD',
  currencySymbol: '$',
  freeShippingThreshold: 150,
  defaultShippingFee: 12,
  activeDiscountCode: 'AURA10',
  discountPercentage: 10,
  autoSendTrackingUpdates: true,
  allowCashOnDelivery: true,
  
  // Account Details
  ownerName: 'Amara Okafor',
  contactEmail: 'amara@aurafashion.co',
  contactPhone: '+1 (415) 892-4410',
  storeAddress: '1240 Geary Blvd, San Francisco, CA 94109',
  payoutBank: 'Paystack Settlement / Standard Chartered',
  payoutAccountNumber: '0129482019',
  payoutAccountName: 'AURA Atelier LLC',
  payoutCryptoWallet: 'TYDzsY8fFq2G2mYf6yXzUu3k5v4Hj2qP',

  // Merchant Self-Managed Customer Payment Gateways
  merchantGateways: {
    paypal: {
      enabled: true,
      mode: 'live',
      clientId: 'AeA1Y3Bn992_PPL_8830194827',
      clientSecret: 'EL48201_SEC_994201948201',
      webhookId: 'WH-8902819024',
      currency: 'USD',
      verified: true
    },
    stripe: {
      enabled: true,
      testMode: false,
      publishableKey: 'pk_live_51M0982KaLpz8901Yt',
      secretKey: 'sk_live_51M0982KaLpz9948201Z',
      webhookSecret: 'whsec_981204892018402',
      enableApplePay: true,
      verified: true
    },
    paystack: {
      enabled: true,
      testMode: false,
      publicKey: 'pk_live_8910482019842001a',
      secretKey: 'sk_live_7710482019842991b',
      currency: 'NGN',
      verified: true
    },
    flutterwave: {
      enabled: true,
      testMode: false,
      publicKey: 'FLWPUBK_LIVE-882948201984-X',
      secretKey: 'FLWSECK_LIVE-192048201984-X',
      encryptionKey: 'FLWSECK_382019482019',
      currency: 'USD',
      verified: true
    },
    bankTransfer: {
      enabled: true,
      bankName: 'Standard Chartered Bank',
      accountName: 'AURA Atelier LLC',
      accountNumber: '0129482019',
      routingOrSwift: 'SCBLUS33XXX',
      bankAddress: '1240 Geary Blvd, San Francisco, CA 94109',
      instructions: 'Please include your WhatsApp Order Number as the transfer memo. Your order will be confirmed immediately once payment clears.',
      requireProofUpload: true,
      verified: true
    },
    crypto: {
      enabled: true,
      provider: 'DirectWallet',
      usdtTrc20Address: 'TYDzsY8fFq2G2mYf6yXzUu3k5v4Hj2qP',
      usdtErc20Address: '0x71C8491049281749201948201948201948201948',
      btcAddress: 'bc1q98201948201948201948201948201948201948',
      solAddress: '8Yq2mP8492019482019482019482019482019482019',
      instantConfirmation: true,
      verified: true
    }
  },

  // WhatsApp Connection (Supports Evolution API / Baileys No-CAC WebSockets & Meta WABA)
  connectionEngine: 'evolution_baileys',
  evolutionConfig: {
    instanceName: 'evolution_ng_instance',
    serverUrl: 'https://api.evolution-server.net',
    apiKey: 'B6D711FCDE4D4FD59365441E00E105DC',
    webhookUrl: 'https://ais-dev-lmwkdqxzmtvt53bkdoqhpm-763361010399.europe-west2.run.app/api/webhooks/whatsapp',
    status: 'disconnected',
    phoneConnected: '',
    pushName: '',
    pairingCode: '',
    batteryPercentage: 0,
    engineVersion: 'Evolution API v2.2.0 (Baileys v6.7.9)',
    lastPingMs: 0,
    syncEvents: {
      messagesUpsert: true,
      connectionUpdate: true,
      qrcodeUpdated: true
    }
  },
  whatsappPhoneNumber: '',
  whatsappVerifiedName: '',
  whatsappConnected: false,
  metaWabaId: '',
  autoSyncCatalog: false,

  // Subscription Status
  planTier: 'starter',
  monthlyAiRepliesLimit: 500,
  monthlyAiRepliesUsed: 14
};

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_01',
    sender: 'bot',
    text: 'Welcome to AURA Atelier WhatsApp Store! 🌿 Browse our current collection, check size availability, or ask our AI stylist for advice.',
    timestamp: '10:14 AM',
    type: 'text',
    status: 'read'
  },
  {
    id: 'msg_02',
    sender: 'bot',
    text: 'Here are this week\'s curated bestsellers for you:',
    timestamp: '10:14 AM',
    type: 'catalog',
    payload: {
      products: INITIAL_PRODUCTS,
      quickReplies: ['Browse Linen Overshirt', 'Check Sneakers Size 43', 'View Weekender Bag', 'Current Promo Code']
    },
    status: 'read'
  },
  {
    id: 'msg_03',
    sender: 'customer',
    text: 'Hi! Is the Artisanal Linen Overshirt true to size, or should I size up?',
    timestamp: '10:15 AM',
    type: 'text',
    status: 'read'
  },
  {
    id: 'msg_04',
    sender: 'bot',
    text: 'Great question! The Artisanal Linen Overshirt is cut in a relaxed, easy drape. If you prefer a tailored fit, stay with your regular size. If you plan to layer it over heavy tees or prefer an oversized look, we recommend sizing up one size.\n\nWe have size L and XL in stock today! Would you like me to reserve one for you?',
    timestamp: '10:15 AM',
    type: 'text',
    status: 'read'
  }
];

export const MARKETING_CAMPAIGNS: MarketingCampaign[] = [
  {
    id: 'camp_01',
    title: 'Weekend VIP Flash Drop: 15% Off',
    tagline: 'Exclusive 48-hour WhatsApp-only private discount code',
    badge: 'High Conversion',
    message: '✨ VIP Private Access: Enjoy 15% off our French Linen & Footwear collection this weekend only with code VIP15. Free express delivery on orders over $150.',
    industry: 'fashion',
    targetAudience: 'Past buyers & VIP subscribers (340 contacts)',
    estimatedReach: 340,
    historicalConversion: '48.6%',
    featuredProductId: 'prod_linen_01'
  },
  {
    id: 'camp_02',
    title: 'Abandoned Cart WhatsApp Recovery',
    tagline: 'Triggered 45 minutes after customer pauses checkout',
    badge: 'Instant ROI',
    message: '👋 Hi there! We noticed you left an item in your WhatsApp bag. Complete your order today and we will include complimentary express shipping!',
    industry: 'fashion',
    targetAudience: 'Visitors with unconfirmed checkout (28 contacts/week)',
    estimatedReach: 28,
    historicalConversion: '61.2%',
    featuredProductId: 'prod_linen_01'
  },
  {
    id: 'camp_03',
    title: 'Back in Stock Alert: Leather Weekender',
    tagline: 'Direct notification to waitlist customers',
    badge: 'Fast Cash Flow',
    message: '📦 Good news! The Full-Grain Cognac Leather Weekender is back in our atelier. Only 7 units crafted for this batch. Tap below to claim yours before it sells out.',
    industry: 'fashion',
    targetAudience: 'Waitlist inquiries (42 contacts)',
    estimatedReach: 42,
    historicalConversion: '52.4%',
    featuredProductId: 'prod_weekender_02'
  }
];

export const FAST_LAUNCH_AGENCY_PACKAGES = [
  {
    id: 'pkg_starter',
    name: '48-Hour Retail QuickLaunch',
    price: 697,
    recurringPrice: 199,
    targetAudience: 'Single boutique, restaurant, or independent shop',
    setupTime: '2 Days (48 Hours)',
    features: [
      'Official WhatsApp Business catalog setup (up to 20 items)',
      'Automated 24/7 AI Sales Stylist bot trained on their brand',
      'Instant WhatsApp Cart & Order notifications directly to phone',
      'Paystack, Flutterwave & Crypto payment gateway connection',
      'Table tent QR codes & Instagram "Order on WhatsApp" bio links'
    ],
    recommendedForFastSale: true
  },
  {
    id: 'pkg_growth',
    name: 'Omnichannel Commerce Growth Kit',
    price: 1497,
    recurringPrice: 399,
    targetAudience: 'Busy retail store or restaurant chain with delivery',
    setupTime: '3-4 Days',
    features: [
      'Full catalog sync up to 100 products with variants & stock alerts',
      'Multi-rotational Gemini AI bot personality with live order status updates',
      'Automated Order Tracking dispatches (Packing -> Courier -> Delivered)',
      'VIP Broadcast campaigns & abandoned cart recovery sequences',
      'Staff routing (seamless handoff between AI and human associates)'
    ],
    recommendedForFastSale: false
  },
  {
    id: 'pkg_turnkey',
    name: 'Turnkey Multi-Store Automation Partner',
    price: 2997,
    recurringPrice: 699,
    targetAudience: 'Multi-location franchise or high-volume merchant',
    setupTime: '5-7 Days',
    features: [
      'Multi-agent dashboard with individual staff performance tracking',
      'Dedicated POS & ERP inventory webhook synchronization',
      'Bi-weekly custom broadcast campaign copywriting & creative',
      'Guaranteed 99.9% uptime SLA & priority VIP phone support',
      'Comprehensive monthly ROI & conversion analytics report'
    ],
    recommendedForFastSale: false
  }
];

// Super Admin initial data
export const INITIAL_PAYMENT_GATEWAYS: PaymentGatewaysConfig = {
  paystack: {
    enabled: true,
    testMode: false,
    publicKey: 'pk_live_891a27e04f9810b4290c0b3291882',
    secretKey: 'sk_live_••••••••••••••••••••••••••••••••',
    webhookSecret: 'whsec_paystack_88921a',
    supportedCurrencies: ['NGN', 'USD', 'GHS', 'ZAR', 'KES']
  },
  flutterwave: {
    enabled: true,
    testMode: false,
    publicKey: 'FLWPUBK-892109280a91823901b-X',
    secretKey: 'FLWSECK-••••••••••••••••••••••••••••••••',
    encryptionKey: 'FLWENCRK-••••••••••••••••',
    webhookSecret: 'flw_wh_secret_99812',
    supportedCurrencies: ['NGN', 'KES', 'GHS', 'USD', 'EUR', 'GBP']
  },
  crypto: {
    enabled: true,
    provider: 'NowPayments',
    usdtTrc20Address: 'TYDzsY8fFq2G2mYf6yXzUu3k5v4Hj2qP',
    usdtErc20Address: '0x71C8363837918b827C94849202D58E971A377192',
    btcAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    acceptedCoins: ['USDT (TRC20)', 'USDT (ERC20)', 'Bitcoin (BTC)', 'Ethereum (ETH)'],
    instantConfirmations: true
  },
  stripe: {
    enabled: true,
    publishableKey: 'pk_live_51M08920198283019823',
    secretKey: 'sk_live_••••••••••••••••••••••••••••••••'
  }
};

export const INITIAL_GEMINI_KEYS: GeminiKeyRotation[] = [
  {
    id: 'key_primary',
    label: 'Primary Gemini 2.5 Flash Production Key',
    keyPreview: 'AIzaSyC490...18209aB',
    model: 'gemini-2.5-flash',
    status: 'active',
    totalRequests: 14209,
    latencyMs: 142,
    lastUsedAt: '12 seconds ago',
    isPrimary: true
  },
  {
    id: 'key_rotational_02',
    label: 'Rotational Tier 2 Key (Failover & Burst)',
    keyPreview: 'AIzaSyB810...90234zL',
    model: 'gemini-2.5-flash',
    status: 'active',
    totalRequests: 6840,
    latencyMs: 168,
    lastUsedAt: '4 minutes ago',
    isPrimary: false
  },
  {
    id: 'key_rotational_03',
    label: 'Rotational Tier 3 Key (Standby Backup)',
    keyPreview: 'AIzaSyD731...48911wQ',
    model: 'gemini-2.5-flash',
    status: 'standby',
    totalRequests: 890,
    latencyMs: 155,
    lastUsedAt: '3 hours ago',
    isPrimary: false
  }
];

export const INITIAL_WHATSAPP_CLOUD_API: WhatsAppCloudApiConfig = {
  status: 'connected',
  wabaId: '108492019823091',
  phoneNumberId: '109283019823901',
  displayPhoneNumber: '+1 (555) 019-9482',
  tokenPreview: 'EAAO82910...9812903',
  webhookUrl: 'https://api.omnichat.ai/v1/webhooks/whatsapp',
  verifyToken: 'omnichat_verify_token_prod_9921',
  apiVersion: 'v21.0',
  lastPingMs: 48
};

export const INITIAL_ADMIN_USERS: AdminUser[] = [
  {
    id: 'usr_01',
    name: 'Amara Okafor',
    email: 'amara@aurafashion.co',
    businessName: 'AURA Atelier & Goods',
    industry: 'fashion',
    plan: 'Starter ($29/mo)',
    status: 'active',
    ordersCount: 412,
    mrr: 79,
    registeredAt: 'Oct 12, 2026'
  },
  {
    id: 'usr_02',
    name: 'Chef Marco Rossi',
    email: 'marco@tavolakitchen.com',
    businessName: 'Tavola Artisan Kitchen',
    industry: 'food',
    plan: 'Scale ($249/mo)',
    status: 'active',
    ordersCount: 1840,
    mrr: 249,
    registeredAt: 'Sep 28, 2026'
  },
  {
    id: 'usr_03',
    name: 'David Kwok',
    email: 'david@aerotechgear.io',
    businessName: 'AeroTech Gadgets',
    industry: 'electronics',
    plan: 'Growth ($79/mo)',
    status: 'active',
    ordersCount: 689,
    mrr: 79,
    registeredAt: 'Oct 04, 2026'
  },
  {
    id: 'usr_04',
    name: 'Dr. Celine Dupont',
    email: 'celine@lumenskin.com',
    businessName: 'LUMEN Skin Clinic',
    industry: 'beauty_services',
    plan: 'Starter ($29/mo)',
    status: 'active',
    ordersCount: 142,
    mrr: 29,
    registeredAt: 'Oct 21, 2026'
  }
];

export const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'tick_101',
    ticketNumber: 'TICK-#4091',
    merchantName: 'AURA Atelier & Goods',
    email: 'amara@aurafashion.co',
    subject: 'Paystack NGN currency settlement payout schedule',
    category: 'Payment Gateway',
    priority: 'high',
    status: 'in_progress',
    lastUpdated: '18 mins ago',
    preview: 'Can we switch our daily settlement from NGN to USD domiciliary account automatically on Paystack?'
  },
  {
    id: 'tick_102',
    ticketNumber: 'TICK-#4090',
    merchantName: 'Tavola Artisan Kitchen',
    email: 'marco@tavolakitchen.com',
    subject: 'Meta WhatsApp Business Template approval for dinner delivery promos',
    category: 'WhatsApp API',
    priority: 'urgent',
    status: 'open',
    lastUpdated: '42 mins ago',
    preview: 'Our dinner flash broadcast template was marked pending by Meta. Can we expedite WABA verification?'
  },
  {
    id: 'tick_103',
    ticketNumber: 'TICK-#4088',
    merchantName: 'AeroTech Gadgets',
    email: 'david@aerotechgear.io',
    subject: 'Crypto USDT TRC20 webhook payment confirmation delay',
    category: 'Payment Gateway',
    priority: 'normal',
    status: 'resolved',
    lastUpdated: '2 hours ago',
    preview: 'Instant confirmation on TRON network verified and resolved after 1 block confirmation.'
  }
];

// Multi-Store Management Preset Stores
export const INITIAL_STORES: StoreInfo[] = [
  {
    id: 'store_aura_main',
    name: 'AURA Atelier Flagship',
    industry: 'fashion',
    tagline: 'Curated menswear, footwear & handcrafted leather',
    currency: 'USD',
    currencySymbol: '$',
    productsCount: 4,
    monthlyRevenue: 12450,
    whatsappPhone: '+1 (555) 019-9482',
    isActive: true,
    createdAt: 'Sep 10, 2026'
  },
  {
    id: 'store_tavola_kitchen',
    name: 'Tavola Artisan Kitchen',
    industry: 'food',
    tagline: 'Wood-fired neapolitan pizza & hand-rolled pasta',
    currency: 'USD',
    currencySymbol: '$',
    productsCount: 4,
    monthlyRevenue: 8940,
    whatsappPhone: '+1 (555) 019-3382',
    isActive: false,
    createdAt: 'Oct 01, 2026'
  },
  {
    id: 'store_aerotech_tech',
    name: 'AeroTech Gadgets',
    industry: 'electronics',
    tagline: 'Hi-Fi audiophile gear & workspace ergonomics',
    currency: 'USD',
    currencySymbol: '$',
    productsCount: 4,
    monthlyRevenue: 16800,
    whatsappPhone: '+1 (555) 019-7714',
    isActive: false,
    createdAt: 'Oct 15, 2026'
  }
];

// Team Members for Shared Inbox and Multi-Account Management
export const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'team_01',
    name: 'Amara Okafor',
    email: 'amara@aurafashion.co',
    role: 'Owner',
    status: 'active',
    assignedStores: ['store_aura_main', 'store_tavola_kitchen'],
    addedAt: 'Aug 20, 2026',
    lastActive: 'Just now'
  },
  {
    id: 'team_02',
    name: 'Mateo Rossi',
    email: 'mateo.rossi@aurafashion.co',
    role: 'Sales Specialist',
    status: 'active',
    assignedStores: ['store_aura_main'],
    addedAt: 'Sep 12, 2026',
    lastActive: '12 mins ago'
  },
  {
    id: 'team_03',
    name: 'Clara Delacroix',
    email: 'clara@aurafashion.co',
    role: 'Support Agent',
    status: 'active',
    assignedStores: ['store_aura_main'],
    addedAt: 'Oct 01, 2026',
    lastActive: '1 hour ago'
  }
];

// Initial registered accounts for authentic Login & Signup validation across tiers
export const INITIAL_STORED_ACCOUNTS: StoredUserAccount[] = [
  {
    id: 'acc_01',
    name: 'Elena Vance (Pro)',
    email: 'elena@aurafashion.co',
    passwordHash: 'password123',
    businessName: 'AURA Atelier & Goods',
    industry: 'fashion',
    role: 'merchant',
    planTier: 'pro',
    createdAt: 'Oct 12, 2026'
  },
  {
    id: 'acc_02',
    name: 'Marcus Chen (Starter)',
    email: 'marcus@volttech.io',
    passwordHash: 'password123',
    businessName: 'VoltTech Innovations',
    industry: 'electronics',
    role: 'merchant',
    planTier: 'starter',
    createdAt: 'Oct 18, 2026'
  },
  {
    id: 'acc_03',
    name: 'Sarah Jenkins (Enterprise)',
    email: 'sarah@luxegroup.agency',
    passwordHash: 'password123',
    businessName: 'Luxe Brands Agency',
    industry: 'beauty_services',
    role: 'merchant',
    planTier: 'enterprise',
    createdAt: 'Sep 28, 2026'
  },
  {
    id: 'acc_04',
    name: 'Amara Okafor',
    email: 'amara@aurafashion.co',
    passwordHash: 'password123',
    businessName: 'AURA Atelier & Goods',
    industry: 'fashion',
    role: 'merchant',
    planTier: 'pro',
    createdAt: 'Oct 10, 2026'
  },
  {
    id: 'acc_05',
    name: 'Admin Root',
    email: 'admin@omnichat.ai',
    passwordHash: 'admin123',
    businessName: 'OmniChat Cloud Platform',
    industry: 'fashion',
    role: 'superadmin',
    planTier: 'enterprise',
    createdAt: 'Sep 01, 2026'
  }
];

export const INITIAL_AUTH_PROVIDERS: AuthProvidersConfig = {
  google: {
    enabled: true,
    clientId: '1029384756-publicdemo.apps.googleusercontent.com',
    clientSecret: 'GOCSPX-demo_secret_token_9821',
    redirectUri: typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-lmwkdqxzmtvt53bkdoqhpm-763361010399.europe-west2.run.app',
    verified: true
  },
  github: {
    enabled: true,
    clientId: 'gh_demo_client_id_4821',
    clientSecret: 'gh_sec_token_991823',
    redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/auth/github` : 'https://ais-dev-lmwkdqxzmtvt53bkdoqhpm-763361010399.europe-west2.run.app/auth/github',
    verified: true
  },
  whatsappOtp: {
    enabled: true,
    provider: 'Evolution_Baileys'
  },
  allowEmailPassword: true,
  defaultCountry: 'Nigeria'
};
