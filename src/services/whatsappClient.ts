export interface WhatsAppStatusResponse {
  tenantId: string;
  instanceName?: string;
  status: 'disconnected' | 'connecting' | 'qrcode' | 'connected' | 'reconnecting' | 'error';
  phone: string | null;
  qrCode: string | null;
  pairingCode?: string | null;
  expiresInSeconds: number;
  pairingExpiresInSeconds?: number;
  verifiedName: string | null;
  connectedAt?: string | null;
  lastPingMs?: number;
  error: string | null;
  engine: 'baileys_embedded' | 'evolution_api';
  messageCount?: number;
}

export interface WhatsAppMessageItem {
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

export interface WhatsAppConfigResponse {
  evolutionConfig: {
    apiUrl: string;
    apiKey: string;
    enabled: boolean;
    hasValidConfig: boolean;
  };
  activeEngine: 'evolution_remote' | 'baileys_embedded';
  activeSessionsCount: number;
  activeSessions: Array<{
    tenantId: string;
    status: string;
    phone: string | null;
    engine: string;
    connectedAt: string | null;
  }>;
}

class WhatsAppClient {
  private getHeaders(tenantId: string) {
    return {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId
    };
  }

  public async getConfig(): Promise<WhatsAppConfigResponse> {
    const res = await fetch('/api/whatsapp/config');
    if (!res.ok) throw new Error('Failed to fetch WhatsApp configuration');
    return res.json();
  }

  public async updateConfig(apiUrl: string, apiKey: string, enabled: boolean): Promise<any> {
    const res = await fetch('/api/whatsapp/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiUrl, apiKey, enabled })
    });
    if (!res.ok) throw new Error('Failed to update WhatsApp configuration');
    return res.json();
  }

  public async connect(tenantId: string, phone?: string): Promise<WhatsAppStatusResponse> {
    const res = await fetch('/api/whatsapp/connect', {
      method: 'POST',
      headers: this.getHeaders(tenantId),
      body: JSON.stringify({ phone })
    });
    const data = await res.json();
    if (!res.ok && !data.qrCode) {
      throw new Error(data.error || 'Failed to initiate WhatsApp connection');
    }
    return data;
  }

  public async requestPairingCode(tenantId: string, phone: string): Promise<{
    success: boolean;
    pairingCode?: string;
    phone?: string;
    expiresInSeconds?: number;
    error?: string;
  }> {
    const res = await fetch('/api/whatsapp/pairing-code', {
      method: 'POST',
      headers: this.getHeaders(tenantId),
      body: JSON.stringify({ phone })
    });
    const data = await res.json();
    if (!res.ok && !data.pairingCode) {
      throw new Error(data.error || 'Failed to request WhatsApp pairing code');
    }
    return data;
  }

  public async getStatus(tenantId: string): Promise<WhatsAppStatusResponse> {
    const res = await fetch(`/api/whatsapp/status?tenantId=${encodeURIComponent(tenantId)}`, {
      headers: this.getHeaders(tenantId)
    });
    if (!res.ok) throw new Error('Failed to fetch WhatsApp status');
    return res.json();
  }

  public async disconnect(tenantId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/whatsapp/disconnect', {
      method: 'POST',
      headers: this.getHeaders(tenantId)
    });
    if (!res.ok) throw new Error('Failed to disconnect WhatsApp');
    return res.json();
  }

  public async sendMessage(tenantId: string, phone: string, text: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const res = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: this.getHeaders(tenantId),
      body: JSON.stringify({ phone, text })
    });
    return res.json();
  }

  public async getMessages(tenantId: string): Promise<{ tenantId: string; messages: WhatsAppMessageItem[] }> {
    const res = await fetch(`/api/whatsapp/messages?tenantId=${encodeURIComponent(tenantId)}`, {
      headers: this.getHeaders(tenantId)
    });
    if (!res.ok) throw new Error('Failed to fetch WhatsApp messages');
    return res.json();
  }

  public async testSimulation(tenantId: string, from?: string, text?: string): Promise<any> {
    const res = await fetch('/api/whatsapp/test-simulation', {
      method: 'POST',
      headers: this.getHeaders(tenantId),
      body: JSON.stringify({ from, text })
    });
    return res.json();
  }
}

export const whatsAppClient = new WhatsAppClient();
