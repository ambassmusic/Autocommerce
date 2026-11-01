# WhatsApp AI Store & Automation Hub (Retail & Boutique Edition)

An interactive, turnkey WhatsApp conversational commerce and business operations platform tailored for local retail boutiques and high-converting direct-to-consumer businesses, featuring a live dual-pane experience with an interactive WhatsApp chat store simulator, a real-time merchant operations CRM, and real multi-device backend WhatsApp connectivity.

## Core Accomplishments & Architecture

1. **Multi-Photo Direct File Upload & Camera Snap**:
   - Merchants can tap "Tap to Upload Photo or Snap Camera" to upload product images directly from their mobile photo library or camera (supporting JPG, PNG, WEBP with multi-file selection).
   - Every photo thumbnail includes an **always-visible red trash button** (`w-6 h-6`, top-right corner) operable directly on touchscreens without needing hover.
   - One-tap "Set Cover" and "Clear All" actions.
   - Secondary option for pasting external web/CDN URLs or picking sample photography angles.

2. **Mobile-Friendly Storefront & Modals**:
   - Modals use `max-h-[92vh]` with sticky header, scrollable body, and sticky action footers with touch-friendly buttons (`min-h-[44px]`).
   - Storefront product cards format cleanly on small mobile viewports, stacking images and details with clear stock adjustment and editing controls.

3. **External Firestore Cloud Storage & Automatic Catalog Seeding**:
   - Provisioned Firestore database (`ai-studio-autochatcommerce-3940aef7-5e53-4560-9b9b-1b89edff35c2`) with deployed ABAC security rules.
   - Automatic seeding of rich preset catalog items if the store collection is empty, ensuring new merchants always start with an operational store.
   - Synchronized product deletions and updates with Firestore via `deleteStoreProduct` and `saveStoreProduct`.

4. **Live WhatsApp Bot Catalog Sync**:
   - Client automatically syncs current products and prices to `/api/whatsapp/catalog`.
   - Baileys Multi-Device bot dynamically queries and answers catalog inquiries, sends product cards, and handles order flows in real-time.
