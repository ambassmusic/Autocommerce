# WhatsApp AI Store & Automation SaaS Platform

A multi-tenant conversational commerce SaaS platform enabling independent store owners to automate sales, product catalogs, order processing, and customer support on WhatsApp using official Meta Cloud API infrastructure.

## SaaS Multi-Tenant WhatsApp Architecture

### 1. Platform Master Meta Configuration (SuperAdmin Console Only)
All technical developer configurations are isolated strictly within the platform **SuperAdmin Console** (`SuperAdminConsole.tsx`). Individual merchants never touch, view, or enter these technical credentials:
- **Master Meta App**: `Chat omni` (App ID: `2206505670077954`)
- **Master Business Manager ID**: `1440312700767064`
- **Master App Secret & Permanent System User Token**
- **Webhook Endpoint**: `/api/whatsapp/webhook` with challenge verification (`hub.challenge` returning `200 OK`)
- **SaaS Master Toggle**: Enables 1-Click Meta Embedded Signup across all tenant stores.

### 2. Merchant Store Experience (100% Zero-Tech & Zero Developer Fields)
The Merchant Dashboard (`MerchantDashboard.tsx`) provides a zero-friction, 1-click onboarding experience:
- **Zero Technical Inputs**: All developer inputs (`Phone Number ID`, `WABA ID`, `Access Token`, and `Webhook Endpoint`) have been completely purged from the merchant UI.
- **Fresh Account State**: Every new merchant store starts in a fresh, disconnected state (`whatsappConnected: false`, `whatsappPhoneNumber: ''`, `whatsappVerifiedName: ''`).
- **1-Click WhatsApp Connection**:
  - **Option 1 (Meta Facebook Login Dialog)**: A single button launches Meta's official OAuth authorization (`https://www.facebook.com/v21.0/dialog/oauth?client_id=2206505670077954...`) with `whatsapp_business_management,whatsapp_business_messaging` permissions.
  - **Option 2 (Direct Business Phone Link)**: The merchant enters their business phone number (e.g., `+234 803 123 4567`) and taps "Activate WhatsApp (1-Click)". The backend binds their store to the platform's Meta Cloud API infrastructure.
- **Connected State**:
  - Displays verified store name, live WhatsApp number, and active AI Concierge status badge.
  - Action to dispatch a test customer order response.
  - Single-click "Disconnect WhatsApp" button to cleanly unlink and reset to a fresh state.

### 3. Backend Implementation (`server.ts`)
- `GET /api/whatsapp/embedded-signup/config`: Returns the master Meta App ID and Business ID.
- `POST /api/whatsapp/embedded-signup/connect`: Binds a merchant store's phone number and business name to the platform's WhatsApp routing engine.
- `POST /api/whatsapp/meta-disconnect`: Cleanly unlinks the session and resets store settings.
- `GET/POST /api/whatsapp/webhook`: Handles Meta webhook challenge verification and incoming customer messages via `whatsappOrderEngine.ts`.
