export type Platform = 'youtube' | 'gemini' | 'google';

export interface Integration {
  id: string; // generated ID from DB
  platform: Platform;
  scopes: string[];
  metadata: Record<string, any>;
  connectedAt: string;
}

export interface IntegrationStatus {
  isConnected: boolean;
  platform: Platform;
  details?: Integration;
}
