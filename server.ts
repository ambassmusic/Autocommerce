import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { whatsappManager } from './src/server/whatsappManager.js';
import { whatsappOrderEngine } from './src/server/whatsappOrderEngine.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to extract tenant ID from request
function getTenantId(req: express.Request): string {
  const headerTenant = req.headers['x-tenant-id'];
  if (headerTenant && typeof headerTenant === 'string') {
    return headerTenant.trim();
  }
  const queryTenant = req.query.tenantId;
  if (queryTenant && typeof queryTenant === 'string') {
    return queryTenant.trim();
  }
  if (req.body && typeof req.body.tenantId === 'string' && req.body.tenantId.trim()) {
    return req.body.tenantId.trim();
  }
  return 'default_store';
}

/* ========================================================================= */
/* WHATSAPP & EVOLUTION API REST ENDPOINTS                                   */
/* ========================================================================= */

// 1. Health check & runtime diagnostic
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    server: 'OmniChat Fullstack Express'
  });
});

// 2. Evolution API / Baileys Engine Configuration
app.get('/api/whatsapp/config', (req, res) => {
  const config = whatsappManager.getEvolutionConfig();
  const allSessions = whatsappManager.getAllSessions();
  res.json({
    evolutionConfig: config,
    activeEngine: config.enabled && config.hasValidConfig ? 'evolution_remote' : 'baileys_embedded',
    activeSessionsCount: allSessions.length,
    activeSessions: allSessions.map(s => ({
      tenantId: s.tenantId,
      status: s.status,
      phone: s.phone,
      engine: s.engine,
      connectedAt: s.connectedAt
    }))
  });
});

app.post('/api/whatsapp/config', (req, res) => {
  const { apiUrl, apiKey, enabled } = req.body;
  whatsappManager.setEvolutionConfig(apiUrl || '', apiKey || '', Boolean(enabled));
  res.json({
    success: true,
    message: 'Evolution API configuration updated successfully',
    config: whatsappManager.getEvolutionConfig()
  });
});

// 3. Connect WhatsApp (Generate real QR or retrieve connection)
app.post('/api/whatsapp/connect', async (req, res) => {
  const tenantId = getTenantId(req);
  const { phone } = req.body;

  try {
    const result = await whatsappManager.connect(tenantId, phone);
    res.json({
      tenantId,
      ...result
    });
  } catch (err: any) {
    console.error('Error connecting WhatsApp:', err);
    res.status(500).json({
      success: false,
      tenantId,
      status: 'error',
      error: err.message || 'Failed to initiate WhatsApp connection'
    });
  }
});

// 3b. Request Real WhatsApp Pairing Code (Zero-Camera / Phone Linking)
app.post('/api/whatsapp/pairing-code', async (req, res) => {
  const tenantId = getTenantId(req);
  const { phone } = req.body;

  if (!phone || typeof phone !== 'string') {
    return res.status(400).json({
      success: false,
      tenantId,
      error: 'Please provide a valid WhatsApp phone number with country code'
    });
  }

  try {
    const result = await whatsappManager.requestPairingCode(tenantId, phone);
    res.json({
      tenantId,
      ...result
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      tenantId,
      error: err.message || 'Failed to generate WhatsApp pairing code'
    });
  }
});

// 4. Get Connection Status & Live QR / Pairing Code
app.get('/api/whatsapp/status', (req, res) => {
  const tenantId = getTenantId(req);
  const session = whatsappManager.getSession(tenantId);

  if (!session) {
    return res.json({
      tenantId,
      status: 'disconnected',
      phone: null,
      qrCode: null,
      pairingCode: null,
      expiresInSeconds: 0,
      pairingExpiresInSeconds: 0,
      verifiedName: null,
      error: null,
      engine: 'baileys_embedded'
    });
  }

  const expiresIn = session.qrExpiresAt
    ? Math.max(0, Math.round((session.qrExpiresAt - Date.now()) / 1000))
    : 0;

  const pairingExpiresIn = session.pairingExpiresAt
    ? Math.max(0, Math.round((session.pairingExpiresAt - Date.now()) / 1000))
    : 0;

  // Check if QR expired
  if (session.status === 'qrcode' && expiresIn === 0) {
    session.status = 'disconnected';
    session.qrCode = null;
    session.lastError = 'QR Code expired. Click Refresh to generate a fresh code.';
  }

  // Check if Pairing Code expired
  if (session.pairingCode && pairingExpiresIn === 0 && session.status !== 'connected') {
    session.pairingCode = null;
    session.pairingExpiresAt = null;
  }

  res.json({
    tenantId: session.tenantId,
    instanceName: session.instanceName,
    status: session.status,
    phone: session.phone,
    qrCode: session.qrCode,
    pairingCode: session.pairingCode,
    expiresInSeconds: expiresIn,
    pairingExpiresInSeconds: pairingExpiresIn,
    verifiedName: session.verifiedName,
    connectedAt: session.connectedAt,
    lastPingMs: session.lastPingMs,
    error: session.lastError,
    engine: session.engine,
    messageCount: session.messages.length
  });
});

// 5. Disconnect / Unlink WhatsApp Device
app.post('/api/whatsapp/disconnect', async (req, res) => {
  const tenantId = getTenantId(req);
  try {
    const result = await whatsappManager.disconnect(tenantId);
    res.json({
      tenantId,
      ...result
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      tenantId,
      error: err.message || 'Failed to disconnect WhatsApp'
    });
  }
});

// 6. Send Outbound WhatsApp Message
app.post('/api/whatsapp/send', async (req, res) => {
  const tenantId = getTenantId(req);
  const { phone, text } = req.body;

  if (!phone || !text) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: phone and text'
    });
  }

  try {
    const result = await whatsappManager.sendMessage(tenantId, phone, text);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to send WhatsApp message'
    });
  }
});

// 7. Get WhatsApp Messages for Tenant
app.get('/api/whatsapp/messages', (req, res) => {
  const tenantId = getTenantId(req);
  const session = whatsappManager.getSession(tenantId);
  res.json({
    tenantId,
    messages: session?.messages || []
  });
});

// 8. Remote Evolution API Webhook Receiver
app.post('/api/whatsapp/webhook', (req, res) => {
  const result = whatsappManager.handleEvolutionWebhook(req.body);
  res.json({ received: true, ...result });
});

// 9. Diagnostic test endpoint to simulate an incoming message through stateful Order Engine
app.post('/api/whatsapp/test-simulation', (req, res) => {
  const tenantId = getTenantId(req);
  const { from, text, pushName } = req.body;
  const session = whatsappManager.getOrCreateSession(tenantId);

  const testSender = from || '+234 803 999 8888';
  const testText = text || 'Hi! Can I see your catalog and prices?';
  const customerName = pushName || 'Test Customer';

  const inboundMsg = {
    id: `sim_${Date.now()}`,
    from: testSender,
    to: session.phone || 'Store Phone',
    text: testText,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    direction: 'inbound' as const,
    status: 'received' as const,
    pushName: customerName,
    source: session.engine
  };

  session.messages.push(inboundMsg);

  // Retrieve tenant's catalog
  const catalog = (whatsappManager as any).tenantCatalogs?.get?.(tenantId) || { storeName: 'Our WhatsApp Store', products: [] };
  
  // Process through WhatsApp Order Engine
  const engineResult = whatsappOrderEngine.processMessage(
    tenantId,
    testSender,
    customerName,
    testText,
    catalog.products || [],
    catalog.storeName || 'Our WhatsApp Store'
  );

  const outboundMsg = {
    id: `sim_out_${Date.now()}`,
    from: session.phone || 'Store Phone',
    to: testSender,
    text: engineResult.replyText,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    direction: 'outbound' as const,
    status: 'sent' as const,
    source: session.engine
  };
  session.messages.push(outboundMsg);

  res.json({
    success: true,
    inbound: inboundMsg,
    reply: outboundMsg,
    currentStep: engineResult.currentStep,
    orderCreated: engineResult.orderCreated,
    orderUpdated: engineResult.orderUpdated
  });
});

// 10. Sync & Query Store Catalog with WhatsApp Bot
app.post('/api/whatsapp/catalog', (req, res) => {
  const tenantId = getTenantId(req);
  const { storeName, products } = req.body;
  whatsappManager.setTenantCatalog(tenantId, storeName || 'Our WhatsApp Store', products || []);
  res.json({
    success: true,
    tenantId,
    itemCount: Array.isArray(products) ? products.length : 0
  });
});

app.get('/api/whatsapp/catalog', (req, res) => {
  const tenantId = getTenantId(req);
  const catalog = (whatsappManager as any).tenantCatalogs?.get?.(tenantId) || { storeName: 'Store', products: [] };
  res.json({
    tenantId,
    storeName: catalog.storeName,
    products: catalog.products || []
  });
});

/* ========================================================================= */
/* ORDER & FULFILLMENT BACKEND REST ENDPOINTS                                */
/* ========================================================================= */

// 11. List Store Orders
app.get('/api/orders', (req, res) => {
  const tenantId = getTenantId(req);
  const orders = whatsappOrderEngine.getTenantOrders(tenantId);
  res.json({
    tenantId,
    orders
  });
});

// 12. Save / Sync Order from Client
app.post('/api/orders', (req, res) => {
  const tenantId = getTenantId(req);
  const order = req.body;
  if (!order || !order.id) {
    return res.status(400).json({ success: false, error: 'Invalid order payload' });
  }
  whatsappOrderEngine.addTenantOrder(tenantId, order);
  res.json({
    success: true,
    tenantId,
    order
  });
});

// 13. Verify Gateway Payment (Never marks paid from customer claim alone)
// Triggers digital delivery if digital product, or packaging update if physical.
app.post('/api/orders/:orderId/verify-payment', async (req, res) => {
  const tenantId = getTenantId(req);
  const { orderId } = req.params;
  const { reference } = req.body;

  const result = whatsappOrderEngine.verifyOrderPayment(tenantId, orderId, reference);
  if (!result.success) {
    return res.status(404).json(result);
  }

  // If WhatsApp socket is connected, notify customer directly on WhatsApp
  const session = whatsappManager.getSession(tenantId);
  if (session && session.sock && session.status === 'connected' && result.order?.customerPhone && result.notificationText) {
    try {
      const cleanPhone = result.order.customerPhone.replace(/\D/g, '');
      const recipientJid = `${cleanPhone}@s.whatsapp.net`;
      await session.sock.sendMessage(recipientJid, { text: result.notificationText });
      console.log(`[Order Payment] Sent payment verification notification to ${cleanPhone}`);
    } catch (err) {
      console.error('[Order Payment] Failed to send payment confirmation over WhatsApp:', err);
    }
  }

  res.json(result);
});

// 14. Update Order Fulfillment Status
app.post('/api/orders/:orderId/status', (req, res) => {
  const tenantId = getTenantId(req);
  const { orderId } = req.params;
  const { status } = req.body;

  const updated = whatsappOrderEngine.updateTenantOrderStatus(tenantId, orderId, status);
  if (!updated) {
    return res.status(404).json({ success: false, error: `Order ${orderId} not found` });
  }

  res.json({
    success: true,
    tenantId,
    order: updated
  });
});

/* ========================================================================= */
/* VITE MIDDLEWARE OR STATIC SERVING                                         */
/* ========================================================================= */

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`> OmniChat Commerce Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
