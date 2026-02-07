import { supabase } from "@/integrations/supabase/client";
import { Integration } from "@/features/integrations/types";

export const integrationsApi = {
  async initiateConnection(platform: 'youtube' | 'gemini') {
    const { data: response, error: invokeError } = await supabase.functions.invoke('oauth-connect', {
      body: { action: 'init', platform, redirectUrl: window.location.origin + '/auth/callback' }
    });

    if (invokeError) throw invokeError;
    return response;
  },

  async exchangeCode(code: string, platform: string) {
    const { data, error } = await supabase.functions.invoke('oauth-connect', {
      body: { action: 'exchange', code, platform, redirectUri: window.location.origin + '/auth/callback' }
    });
    if (error) throw error;
    return data;
  },

  async getStatus() {
    const { data, error } = await supabase.functions.invoke('oauth-connect', {
      body: { action: 'status' }
    });
    if (error) throw error;
    return data as { data: Integration[] };
  },

  async getChannelStats(platform: 'youtube') {
    const { data, error } = await supabase.functions.invoke('oauth-connect', {
      body: { action: 'stats', platform }
    });
    if (error) throw error;
    return data;
  },

  async disconnect(platform: string) {
    const { data, error } = await supabase.functions.invoke('oauth-connect', {
      body: { action: 'disconnect', platform }
    });
    if (error) throw error;
    return data;
  }
};
