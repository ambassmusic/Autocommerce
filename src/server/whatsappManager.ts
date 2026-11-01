import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import pino from 'pino';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  WASocket,
  Browsers,
  proto
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { whatsappOrderEngine } from './whatsappOrderEngine.js';

export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  text: string;
  timestamp: string;
  direction: 'inbound' | 'outbound';
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'received';
  pushName?: string;
  source: 'baileys_embedded' | 'evolution_api';
}

export interface TenantSession {
  tenantId: string;
  instanceName: string;
  engine: 'baileys_embedded' | 'evolution_api';
  status: 'disconnected' | 'connecting' | 'qrcode' | 'connected' | 'reconnecting' | 'error';
  qrCode: string | null;
  qrRaw: string | null;
  qrExpiresAt: number | null;
  pairingCode: string | null;
  pairingExpiresAt: number | null;
  phone: string | null;
  verifiedName: string | null;
  connectedAt: string | null;
  lastPingMs: number;
  lastError: string | null;
  messages: WhatsAppMessage[];
  sock?: WASocket;
}

export interface EvolutionApiConfig {
  apiUrl: string;
  apiKey: string;
  enabled: boolean;
}

class WhatsAppManager {
  private sessions = new Map<string, TenantSession>();
  private tenantCatalogs = new Map<string, { storeName: string; products: any[] }>();
  private sessionBaseDir = path.resolve(process.cwd(), 'sessions');
  private evolutionConfig: EvolutionApiConfig = {
    apiUrl: process.env.EVOLUTION_API_URL || '',
    apiKey: process.env.EVOLUTION_API_KEY || '',
    enabled: Boolean(process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY)
  };

  public setTenantCatalog(tenantId: string, storeName: string, products: any[]) {
    const cleanId = tenantId.replace(/[^a-zA-Z0-9_-]/g, '_') || 'default_store';
    this.tenantCatalogs.set(cleanId, {
      storeName: storeName || 'Our WhatsApp Store',
      products: Array.isArray(products) ? products : []
    });
    console.log(`[Baileys Bot] Synced ${products.length} catalog items for tenant ${cleanId}`);
  }

  constructor() {
    if (!fs.existsSync(this.sessionBaseDir)) {
      try {
        fs.mkdirSync(this.sessionBaseDir, { recursive: true });
      } catch (err) {
        console.error('Failed to create sessions directory:', err);
      }
    }
  }

  public getEvolutionConfig(): EvolutionApiConfig & { hasValidConfig: boolean } {
    return {
      apiUrl: this.evolutionConfig.apiUrl,
      apiKey: this.evolutionConfig.apiKey ? '••••••••' + this.evolutionConfig.apiKey.slice(-4) : '',
      enabled: this.evolutionConfig.enabled,
      hasValidConfig: Boolean(this.evolutionConfig.apiUrl && this.evolutionConfig.apiKey)
    };
  }

  public setEvolutionConfig(apiUrl: string, apiKey: string, enabled: boolean) {
    this.evolutionConfig = {
      apiUrl: apiUrl.trim().replace(/\/+$/, ''),
      apiKey: apiKey.trim(),
      enabled
    };
  }

  public getOrCreateSession(tenantId: string, instanceName?: string): TenantSession {
    const cleanId = tenantId.replace(/[^a-zA-Z0-9_-]/g, '_') || 'default_store';
    const cleanInstance = instanceName || `omni_${cleanId}`;

    let session = this.sessions.get(cleanId);
    if (!session) {
      session = {
        tenantId: cleanId,
        instanceName: cleanInstance,
        engine: this.evolutionConfig.enabled ? 'evolution_api' : 'baileys_embedded',
        status: 'disconnected',
        qrCode: null,
        qrRaw: null,
        qrExpiresAt: null,
        pairingCode: null,
        pairingExpiresAt: null,
        phone: null,
        verifiedName: null,
        connectedAt: null,
        lastPingMs: 24,
        lastError: null,
        messages: []
      };
      this.sessions.set(cleanId, session);
    }
    return session;
  }

  public getSession(tenantId: string): TenantSession | undefined {
    const cleanId = tenantId.replace(/[^a-zA-Z0-9_-]/g, '_') || 'default_store';
    return this.sessions.get(cleanId);
  }

  public getAllSessions(): Array<Omit<TenantSession, 'sock'>> {
    return Array.from(this.sessions.values()).map(s => {
      const { sock, ...rest } = s;
      return rest;
    });
  }

  /**
   * Connects a tenant's WhatsApp session.
   * If remote Evolution API is configured and enabled, routes to Evolution API.
   * Otherwise, launches the built-in Baileys Multi-Device WebSocket engine.
   */
  public async connect(tenantId: string, phoneInput?: string): Promise<{
    success: boolean;
    status: string;
    qrCode?: string | null;
    expiresInSeconds?: number;
    phone?: string | null;
    error?: string | null;
  }> {
    const session = this.getOrCreateSession(tenantId);

    // If already connected, return active status
    if (session.status === 'connected' && session.phone) {
      return {
        success: true,
        status: 'connected',
        phone: session.phone
      };
    }

    // Option 1: Remote Evolution API
    if (this.evolutionConfig.enabled && this.evolutionConfig.apiUrl) {
      return this.connectViaEvolutionApi(session, phoneInput);
    }

    // Option 2: Built-in Baileys Multi-Device WebSocket Engine
    return this.connectViaBaileys(session, phoneInput);
  }

  /**
   * Request genuine WhatsApp 8-digit Pairing Code via phone number.
   * Uses Baileys sock.requestPairingCode(number) or Evolution API.
   * The user enters this code on THEIR PHONE under WhatsApp > Linked Devices > Link with Phone Number.
   */
  public async requestPairingCode(tenantId: string, phoneInput: string): Promise<{
    success: boolean;
    pairingCode?: string;
    phone?: string;
    expiresInSeconds?: number;
    error?: string;
  }> {
    let cleanPhone = phoneInput.replace(/\D/g, '');

    // Normalize Nigerian phone numbers
    if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
      cleanPhone = '234' + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith('2340') && cleanPhone.length === 14) {
      cleanPhone = '234' + cleanPhone.slice(4);
    }

    // Validate phone number length
    if (cleanPhone.startsWith('234')) {
      if (cleanPhone.length > 13) {
        return {
          success: false,
          error: `Nigerian WhatsApp numbers must have exactly 10 digits after +234 (total 13 digits, e.g. +234 906 029 8657). Your input "+${cleanPhone}" has ${cleanPhone.length - 3} digits after +234. Please remove the extra digit.`
        };
      }
      if (cleanPhone.length < 13) {
        return {
          success: false,
          error: `Incomplete Nigerian number: expected 10 digits after +234 (e.g. +234 906 029 8657), but "+${cleanPhone}" has only ${cleanPhone.length - 3} digits.`
        };
      }
    } else if (cleanPhone.length < 9) {
      return {
        success: false,
        error: 'Please enter a valid WhatsApp phone number with country code (e.g. +234 812 345 6789).'
      };
    }

    const session = this.getOrCreateSession(tenantId);
    session.status = 'connecting';
    session.lastError = null;
    session.phone = `+${cleanPhone}`;
    session.qrCode = null;

    // Check if Evolution API is configured
    if (this.evolutionConfig.enabled && this.evolutionConfig.apiUrl) {
      try {
        const evoUrl = `${this.evolutionConfig.apiUrl}/instance/connect/${encodeURIComponent(session.instanceName)}?number=${cleanPhone}`;
        const evoRes = await fetch(evoUrl, {
          method: 'GET',
          headers: { 'apikey': this.evolutionConfig.apiKey }
        });
        if (evoRes.ok) {
          const data = await evoRes.json();
          const code = data.pairingCode || data.code;
          if (code) {
            const formatted = code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
            session.pairingCode = formatted;
            session.pairingExpiresAt = Date.now() + 180000;
            return {
              success: true,
              pairingCode: formatted,
              phone: `+${cleanPhone}`,
              expiresInSeconds: 180
            };
          }
        }
      } catch (err: any) {
        console.warn('[Evolution API] Pairing code request failed, falling back to embedded Baileys engine:', err.message);
      }
    }

    // Built-in Baileys Multi-Device Pairing Engine
    try {
      if (session.sock) {
        try {
          session.sock.end(undefined);
        } catch {}
        session.sock = undefined;
      }

      const tenantDir = path.join(this.sessionBaseDir, `tenant_${session.tenantId}`);
      // Wipe stale or partial credentials so WhatsApp handshake starts 100% clean
      if (fs.existsSync(tenantDir)) {
        try {
          fs.rmSync(tenantDir, { recursive: true, force: true });
        } catch (e) {
          console.warn('Could not remove tenant directory:', e);
        }
      }
      fs.mkdirSync(tenantDir, { recursive: true });

      const { state, saveCreds } = await useMultiFileAuthState(tenantDir);
      const { version } = await fetchLatestBaileysVersion();
      const logger = pino({ level: 'silent' });

      const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        auth: state,
        browser: Browsers.macOS('Desktop'),
        syncFullHistory: false,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
        emitOwnEvents: false
      });

      session.sock = sock;
      session.engine = 'baileys_embedded';

      sock.ev.on('creds.update', saveCreds);

      // Listen for when the user types the code into their WhatsApp on phone
      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
          session.status = 'connected';
          session.qrCode = null;
          session.qrRaw = null;
          session.pairingCode = null;
          session.pairingExpiresAt = null;
          session.connectedAt = new Date().toISOString();
          session.lastError = null;

          const userJid = sock.user?.id || '';
          const rawPhone = userJid.split(':')[0] || userJid.split('@')[0];
          session.phone = rawPhone ? (rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`) : `+${cleanPhone}`;
          session.verifiedName = sock.user?.name || 'OmniChat Verified Store';
          console.log(`[Baileys] WhatsApp phone number successfully paired for tenant ${session.tenantId}: ${session.phone}`);
        } else if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          console.log(`[Baileys] Socket closed during pairing for tenant ${session.tenantId}, status code: ${statusCode}`);
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          if (statusCode === DisconnectReason.loggedOut) {
            session.status = 'disconnected';
            session.phone = null;
            session.pairingCode = null;
            session.sock = undefined;
            session.lastError = 'WhatsApp rejected pairing. Consider scanning QR Code for guaranteed connection.';
          } else if (shouldReconnect) {
            console.log(`[Baileys] WhatsApp handshake restart required (status ${statusCode}). Re-establishing pairing socket...`);
            session.status = 'connecting';
            setTimeout(() => {
              this.reconnectBaileysPairingSocket(session, cleanPhone);
            }, 600);
          }
        }
      });

      // Hook inbound message listener
      this.attachMessageListener(sock, session);

      // Wait 3 seconds for WebSocket connection to initialize before requesting pairing code
      await new Promise(r => setTimeout(r, 3000));

      if (!sock.authState.creds.registered) {
        console.log(`[Baileys] Requesting official WhatsApp pairing code for ${cleanPhone}...`);
        const rawCode = await sock.requestPairingCode(cleanPhone);
        console.log(`[Baileys] Genuine WhatsApp pairing code received: ${rawCode}`);

        const formatted = rawCode.length === 8 ? `${rawCode.slice(0, 4)}-${rawCode.slice(4)}` : rawCode;
        session.pairingCode = formatted;
        session.pairingExpiresAt = Date.now() + 180000;
        session.status = 'connecting';

        return {
          success: true,
          pairingCode: formatted,
          phone: `+${cleanPhone}`,
          expiresInSeconds: 180
        };
      } else {
        session.status = 'connected';
        return {
          success: true,
          phone: session.phone || `+${cleanPhone}`
        };
      }
    } catch (err: any) {
      console.error('[Baileys] Pairing code request error:', err);
      session.status = 'error';
      session.lastError = err.message || 'WhatsApp pairing service failed to respond';
      return {
        success: false,
        error: err.message || 'Failed to request pairing code from WhatsApp servers'
      };
    }
  }

  /**
   * Reconnects socket during Pairing Code exchange after WhatsApp Stream Restart (515)
   * Keeps auth tokens and does NOT switch to QR mode or wipe folder.
   */
  private async reconnectBaileysPairingSocket(session: TenantSession, cleanPhone: string) {
    try {
      const tenantDir = path.join(this.sessionBaseDir, `tenant_${session.tenantId}`);
      if (!fs.existsSync(tenantDir)) return;

      const { state, saveCreds } = await useMultiFileAuthState(tenantDir);
      const { version } = await fetchLatestBaileysVersion();
      const logger = pino({ level: 'silent' });

      if (session.sock) {
        try {
          session.sock.end(undefined);
        } catch {}
        session.sock = undefined;
      }

      const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        auth: state,
        browser: Browsers.macOS('Desktop'),
        syncFullHistory: false,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
        emitOwnEvents: false
      });

      session.sock = sock;
      session.engine = 'baileys_embedded';

      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
          session.status = 'connected';
          session.qrCode = null;
          session.qrRaw = null;
          session.pairingCode = null;
          session.pairingExpiresAt = null;
          session.connectedAt = new Date().toISOString();
          session.lastError = null;

          const userJid = sock.user?.id || '';
          const rawPhone = userJid.split(':')[0] || userJid.split('@')[0];
          session.phone = rawPhone ? (rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`) : `+${cleanPhone}`;
          session.verifiedName = sock.user?.name || 'OmniChat Verified Store';
          console.log(`[Baileys Reconnect] WhatsApp phone number successfully paired for tenant ${session.tenantId}: ${session.phone}`);
        } else if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          console.log(`[Baileys Reconnect] Socket closed with statusCode ${statusCode}`);
          if (statusCode === DisconnectReason.loggedOut) {
            session.status = 'disconnected';
            session.phone = null;
            session.pairingCode = null;
            session.sock = undefined;
            session.lastError = 'WhatsApp rejected device link. Please try scanning QR code directly.';
          } else if (statusCode !== DisconnectReason.loggedOut) {
            session.status = 'connecting';
            setTimeout(() => {
              this.reconnectBaileysPairingSocket(session, cleanPhone);
            }, 1000);
          }
        }
      });

      this.attachMessageListener(sock, session);
    } catch (err: any) {
      console.error('[Baileys Reconnect] Error during pairing reconnect:', err);
    }
  }

  private attachMessageListener(sock: WASocket, session: TenantSession) {
    sock.ev.on('messages.upsert', async ({ messages: incomingMsgs, type }) => {
      if (type !== 'notify') return;

      for (const msg of incomingMsgs) {
        if (!msg.message || msg.key.fromMe) continue;

        const text = msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          msg.message.imageMessage?.caption ||
          '';

        if (!text) continue;

        const senderJid = msg.key.remoteJid || '';
        const senderPhone = senderJid.replace('@s.whatsapp.net', '');
        const pushName = msg.pushName || 'WhatsApp Customer';

        const incomingRecord: WhatsAppMessage = {
          id: msg.key.id || `msg_${Date.now()}`,
          from: senderPhone,
          to: session.phone || 'Store',
          text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          direction: 'inbound',
          status: 'received',
          pushName,
          source: 'baileys_embedded'
        };

        session.messages.push(incomingRecord);
        console.log(`[Baileys Inbound] Received message from ${senderPhone}: "${text}"`);

        // Automated Bot Response Pipeline via Stateful WhatsApp Order Engine
        try {
          const catalogInfo = this.tenantCatalogs.get(session.tenantId);
          const storeName = catalogInfo?.storeName || 'Our WhatsApp Store';
          const products = catalogInfo?.products || [];

          const engineResult = whatsappOrderEngine.processMessage(
            session.tenantId,
            senderPhone,
            pushName,
            text,
            products,
            storeName
          );

          const replyText = engineResult.replyText;
          if (replyText && session.sock) {
            await session.sock.sendMessage(senderJid, { text: replyText });

            const outboundRecord: WhatsAppMessage = {
              id: `reply_${Date.now()}`,
              from: session.phone || 'Store',
              to: senderPhone,
              text: replyText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              direction: 'outbound',
              status: 'sent',
              source: 'baileys_embedded'
            };
            session.messages.push(outboundRecord);
            console.log(`[Baileys Outbound] Order Engine response dispatched to ${senderPhone} (Step: ${engineResult.currentStep})`);
          }
        } catch (replyErr) {
          console.error('Failed to send automated reply:', replyErr);
        }
      }
    });
  }

  /**
   * Baileys Native Multi-Device Connection
   */
  private async connectViaBaileys(session: TenantSession, phoneInput?: string): Promise<{
    success: boolean;
    status: string;
    qrCode?: string | null;
    expiresInSeconds?: number;
    phone?: string | null;
    error?: string | null;
  }> {
    try {
      session.status = 'connecting';
      session.lastError = null;
      session.engine = 'baileys_embedded';

      // Clean existing socket if any
      if (session.sock) {
        try {
          session.sock.end(undefined);
        } catch {}
        session.sock = undefined;
      }

      const tenantDir = path.join(this.sessionBaseDir, `tenant_${session.tenantId}`);
      if (!fs.existsSync(tenantDir)) {
        fs.mkdirSync(tenantDir, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(tenantDir);
      const { version } = await fetchLatestBaileysVersion();

      const logger = pino({ level: 'silent' });

      const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        auth: state,
        browser: Browsers.macOS('Desktop'),
        syncFullHistory: false,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
        emitOwnEvents: false
      });

      session.sock = sock;

      // Handle credentials update (saving session tokens to disk)
      sock.ev.on('creds.update', saveCreds);

      // Return a promise that resolves once QR or connection is established (up to 15s)
      return new Promise((resolve) => {
        let hasResolved = false;

        const timeout = setTimeout(() => {
          if (!hasResolved) {
            hasResolved = true;
            resolve({
              success: session.status === 'connected' || session.status === 'qrcode',
              status: session.status,
              qrCode: session.qrCode,
              expiresInSeconds: session.qrExpiresAt ? Math.max(0, Math.round((session.qrExpiresAt - Date.now()) / 1000)) : undefined,
              phone: session.phone,
              error: session.lastError
            });
          }
        }, 12000);

        sock.ev.on('connection.update', async (update) => {
          const { connection, lastDisconnect, qr } = update;

          if (qr) {
            try {
              const qrDataUrl = await QRCode.toDataURL(qr, {
                width: 320,
                margin: 2,
                color: {
                  dark: '#052e16', // Deep emerald
                  light: '#ffffff'
                }
              });

              session.qrCode = qrDataUrl;
              session.qrRaw = qr;
              session.qrExpiresAt = Date.now() + 60000; // 60s validity per WhatsApp Web spec
              session.status = 'qrcode';

              if (!hasResolved) {
                hasResolved = true;
                clearTimeout(timeout);
                resolve({
                  success: true,
                  status: 'qrcode',
                  qrCode: qrDataUrl,
                  expiresInSeconds: 60
                });
              }
            } catch (qrErr: any) {
              console.error('Failed to generate QR code data URL:', qrErr);
              session.lastError = 'Failed to generate QR Code image';
            }
          }

          if (connection === 'open') {
            session.status = 'connected';
            session.qrCode = null;
            session.qrRaw = null;
            session.qrExpiresAt = null;
            session.connectedAt = new Date().toISOString();
            session.lastError = null;

            // Extract connected phone number from JID
            const userJid = sock.user?.id || '';
            const rawPhone = userJid.split(':')[0] || userJid.split('@')[0];
            session.phone = rawPhone ? (rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`) : (phoneInput || 'Connected WhatsApp Device');
            session.verifiedName = sock.user?.name || 'OmniChat Verified Store';

            console.log(`[Baileys] WhatsApp connected successfully for tenant ${session.tenantId}: ${session.phone}`);

            if (!hasResolved) {
              hasResolved = true;
              clearTimeout(timeout);
              resolve({
                success: true,
                status: 'connected',
                phone: session.phone
              });
            }
          }

          if (connection === 'close') {
            const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            console.log(`[Baileys] Connection closed for tenant ${session.tenantId}. Status code: ${statusCode}, shouldReconnect: ${shouldReconnect}`);

            if (statusCode === DisconnectReason.loggedOut) {
              session.status = 'disconnected';
              session.phone = null;
              session.sock = undefined;
              session.lastError = 'Logged out from device';
              this.deleteSessionDirectory(session.tenantId);
            } else if (shouldReconnect) {
              session.status = 'reconnecting';
              session.lastError = 'Connection dropped. Re-establishing socket...';
              console.log(`[Baileys] Socket reconnecting for tenant ${session.tenantId}...`);
              setTimeout(() => {
                this.connectViaBaileys(session, session.phone || undefined);
              }, 1000);
            } else {
              session.status = 'disconnected';
              session.sock = undefined;
              session.lastError = 'Connection closed';
            }

            if (!hasResolved) {
              hasResolved = true;
              clearTimeout(timeout);
              resolve({
                success: false,
                status: session.status,
                error: session.lastError || 'Connection closed by WhatsApp server'
              });
            }
          }
        });

        // Hook real incoming WhatsApp message listener
        this.attachMessageListener(sock, session);
      });
    } catch (err: any) {
      console.error('Error starting Baileys connection:', err);
      session.status = 'error';
      session.lastError = err.message || 'Failed to initialize Baileys engine';
      return {
        success: false,
        status: 'error',
        error: session.lastError
      };
    }
  }

  /**
   * Remote Evolution API Integration
   */
  private async connectViaEvolutionApi(session: TenantSession, phoneInput?: string): Promise<{
    success: boolean;
    status: string;
    qrCode?: string | null;
    expiresInSeconds?: number;
    phone?: string | null;
    error?: string | null;
  }> {
    session.status = 'connecting';
    session.lastError = null;
    session.engine = 'evolution_api';

    const baseUrl = this.evolutionConfig.apiUrl;
    const apiKey = this.evolutionConfig.apiKey;
    const instance = session.instanceName;

    try {
      // 1. Create or verify instance on Evolution API
      const createRes = await fetch(`${baseUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey
        },
        body: JSON.stringify({
          instanceName: instance,
          token: `token_${session.tenantId}`,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS'
        })
      });

      // Status 403 / 400 may mean instance already exists, which is acceptable
      if (!createRes.ok && createRes.status !== 403 && createRes.status !== 400 && createRes.status !== 409) {
        const errorText = await createRes.text();
        throw new Error(`Evolution API error (${createRes.status}): ${errorText || createRes.statusText}`);
      }

      // 2. Fetch QR Code from Evolution API
      const connectRes = await fetch(`${baseUrl}/instance/connect/${instance}`, {
        method: 'GET',
        headers: { 'apikey': apiKey }
      });

      if (!connectRes.ok) {
        const errorText = await connectRes.text();
        throw new Error(`Evolution API connect failed (${connectRes.status}): ${errorText || connectRes.statusText}`);
      }

      const connectData = await connectRes.json();

      // Check if instance is already connected
      if (connectData.instance?.state === 'open' || connectData.state === 'open') {
        session.status = 'connected';
        session.phone = connectData.instance?.owner || phoneInput || 'Connected WhatsApp Device';
        session.connectedAt = new Date().toISOString();
        return {
          success: true,
          status: 'connected',
          phone: session.phone
        };
      }

      // Extract QR Base64 or QR string
      const base64 = connectData.base64 || connectData.qrcode?.base64;
      const code = connectData.code || connectData.qrcode?.code;

      let qrImage = base64;
      if (!qrImage && code) {
        qrImage = await QRCode.toDataURL(code, { width: 320, margin: 2 });
      }

      if (qrImage) {
        session.status = 'qrcode';
        session.qrCode = qrImage.startsWith('data:') ? qrImage : `data:image/png;base64,${qrImage}`;
        session.qrExpiresAt = Date.now() + 60000;
        return {
          success: true,
          status: 'qrcode',
          qrCode: session.qrCode,
          expiresInSeconds: 60
        };
      }

      return {
        success: false,
        status: 'connecting',
        error: 'Waiting for Evolution API to generate QR code'
      };
    } catch (err: any) {
      console.error('Evolution API Connection Error:', err);
      session.status = 'error';
      session.lastError = err.message || 'Evolution API connection failed';
      return {
        success: false,
        status: 'error',
        error: session.lastError
      };
    }
  }

  /**
   * Disconnects / Unlinks a tenant's WhatsApp session
   */
  public async disconnect(tenantId: string): Promise<{ success: boolean; message: string }> {
    const session = this.getSession(tenantId);
    if (!session) {
      return { success: true, message: 'Session already disconnected' };
    }

    if (session.sock) {
      try {
        await session.sock.logout('User initiated unlink');
      } catch {}
      try {
        session.sock.end(undefined);
      } catch {}
      session.sock = undefined;
    }

    if (this.evolutionConfig.enabled && this.evolutionConfig.apiUrl) {
      try {
        await fetch(`${this.evolutionConfig.apiUrl}/instance/logout/${session.instanceName}`, {
          method: 'DELETE',
          headers: { 'apikey': this.evolutionConfig.apiKey }
        });
      } catch {}
    }

    session.status = 'disconnected';
    session.phone = null;
    session.qrCode = null;
    session.qrRaw = null;
    session.qrExpiresAt = null;
    session.connectedAt = null;
    session.lastError = null;

    this.deleteSessionDirectory(session.tenantId);

    return { success: true, message: 'WhatsApp device unlinked successfully' };
  }

  /**
   * Sends an outbound WhatsApp message
   */
  public async sendMessage(tenantId: string, toPhone: string, text: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    const session = this.getSession(tenantId);
    if (!session || session.status !== 'connected') {
      return {
        success: false,
        error: 'WhatsApp device is not connected. Please connect your phone first.'
      };
    }

    const cleanNumber = toPhone.replace(/\D/g, '');
    if (!cleanNumber) {
      return { success: false, error: 'Invalid recipient phone number' };
    }

    const recipientJid = `${cleanNumber}@s.whatsapp.net`;

    // 1. Send via local Baileys socket if active
    if (session.sock) {
      try {
        const sent = await session.sock.sendMessage(recipientJid, { text });
        const record: WhatsAppMessage = {
          id: sent?.key?.id || `out_${Date.now()}`,
          from: session.phone || 'Store',
          to: toPhone,
          text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          direction: 'outbound',
          status: 'sent',
          source: 'baileys_embedded'
        };
        session.messages.push(record);
        return { success: true, messageId: record.id };
      } catch (err: any) {
        console.error('Baileys sendMessage failed:', err);
        return { success: false, error: err.message || 'Failed to dispatch message via Baileys socket' };
      }
    }

    // 2. Send via remote Evolution API
    if (this.evolutionConfig.enabled && this.evolutionConfig.apiUrl) {
      try {
        const res = await fetch(`${this.evolutionConfig.apiUrl}/message/sendText/${session.instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.evolutionConfig.apiKey
          },
          body: JSON.stringify({
            number: cleanNumber,
            options: { delay: 1000, presence: 'composing' },
            textMessage: { text }
          })
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Evolution API send failed (${res.status}): ${errText}`);
        }

        const data = await res.json();
        const record: WhatsAppMessage = {
          id: data.key?.id || `out_${Date.now()}`,
          from: session.phone || 'Store',
          to: toPhone,
          text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          direction: 'outbound',
          status: 'sent',
          source: 'evolution_api'
        };
        session.messages.push(record);
        return { success: true, messageId: record.id };
      } catch (err: any) {
        return { success: false, error: err.message || 'Evolution API sendText failed' };
      }
    }

    return { success: false, error: 'No active WhatsApp socket available' };
  }

  /**
   * Inbound Webhook handler for external Evolution API deployments
   */
  public handleEvolutionWebhook(body: any): { handled: boolean } {
    try {
      const event = body.event;
      const instance = body.instance;
      if (!instance) return { handled: false };

      // Find matching session
      const session = Array.from(this.sessions.values()).find(s => s.instanceName === instance);
      if (!session) return { handled: false };

      if (event === 'CONNECTION_UPDATE') {
        const state = body.data?.state;
        if (state === 'open') {
          session.status = 'connected';
          session.phone = body.data?.owner || session.phone;
          session.qrCode = null;
        } else if (state === 'close') {
          session.status = 'disconnected';
        }
      }

      if (event === 'QRCODE_UPDATED') {
        const qrcode = body.data?.qrcode?.base64 || body.data?.base64;
        if (qrcode) {
          session.status = 'qrcode';
          session.qrCode = qrcode.startsWith('data:') ? qrcode : `data:image/png;base64,${qrcode}`;
          session.qrExpiresAt = Date.now() + 60000;
        }
      }

      if (event === 'MESSAGES_UPSERT') {
        const data = body.data;
        const text = data?.message?.conversation || data?.message?.extendedTextMessage?.text;
        const sender = data?.key?.remoteJid?.replace('@s.whatsapp.net', '');

        if (text && sender && !data?.key?.fromMe) {
          const incoming: WhatsAppMessage = {
            id: data?.key?.id || `evo_${Date.now()}`,
            from: sender,
            to: session.phone || 'Store',
            text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            direction: 'inbound',
            status: 'received',
            pushName: data?.pushName || 'Customer',
            source: 'evolution_api'
          };
          session.messages.push(incoming);
        }
      }

      return { handled: true };
    } catch (err) {
      console.error('Error handling Evolution webhook:', err);
      return { handled: false };
    }
  }

  public processAutomatedReply(tenantId: string, userText: string, customerName: string, customerPhone?: string): string {
    const catalogInfo = this.tenantCatalogs.get(tenantId);
    const storeName = catalogInfo?.storeName || 'Our WhatsApp Store';
    const products = catalogInfo?.products || [];

    const result = whatsappOrderEngine.processMessage(
      tenantId,
      customerPhone || '+234 803 000 0000',
      customerName,
      userText,
      products,
      storeName
    );

    return result.replyText;
  }

  private deleteSessionDirectory(tenantId: string) {
    const tenantDir = path.join(this.sessionBaseDir, `tenant_${tenantId}`);
    if (fs.existsSync(tenantDir)) {
      try {
        fs.rmSync(tenantDir, { recursive: true, force: true });
      } catch (err) {
        console.error(`Failed to clean session directory for ${tenantId}:`, err);
      }
    }
  }
}

export const whatsappManager = new WhatsAppManager();
