import { supabase } from "@/integrations/supabase/client";
import { Integration } from "@/features/integrations/types";

export const integrationsApi = {
  async invokeFunction(functionName: string, body: any) {
    console.log(`integrationsApi: Invoking ${functionName} with action: ${body.action}`);

    // 1. Get Session
    const { data: { session } } = await supabase.auth.getSession();

    // 2. Prepare URL and Keys
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const url = `${supabaseUrl}/functions/v1/${functionName}`;

    // 3. Log for debugging
    console.log(`integrationsApi: Fetching ${url}`);
    if (session) {
      const isAnon = session.access_token === anonKey;
      console.log(`integrationsApi: Token Check - Same as Anon Key? ${isAnon ? "YES (BAD)" : "NO (GOOD)"}`);
    } else {
      console.warn("integrationsApi: No session found (request might fail if auth required)");
    }

    try {
      // 4. Manual Fetch (Mirroring the working CURL)
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
          'apikey': anonKey,
          'Content-Type': 'application/json',
          // 'x-client-info': 'supabase-js-web', // Optional, removing to be safe
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`integrationsApi: Function error ${response.status}`, errorText);
        let errorJson;
        try { errorJson = JSON.parse(errorText); } catch { }

        throw new Error(
          `Function failed: ${errorJson?.error || errorJson?.message || errorText || response.statusText}`
        );
      }

      const data = await response.json();
      return { data, error: null };

    } catch (error) {
      console.error("integrationsApi: Network or Fetch Error", error);
      throw error;
    }
  },

  async initiateConnection(platform: 'youtube' | 'gemini' | 'google', prompt?: string) {
    const { data } = await this.invokeFunction('channel-integration', {
      action: 'init', platform, prompt, redirectUrl: window.location.origin + '/auth/callback'
    });
    return data;
  },

  async exchangeCode(code: string, platform: string) {
    const { data } = await this.invokeFunction('channel-integration', {
      action: 'exchange', code, platform, redirectUri: window.location.origin + '/auth/callback'
    });
    return data;
  },

  async getStatus() {
    console.log("integrationsApi: Checking status...");
    try {
      const { data, error } = await this.invokeFunction('channel-integration', { action: 'status' });
      console.log("integrationsApi: Response data:", data);
      if (error) {
        console.error("integrationsApi: Status check error:", error);
        return { data: null, error };
      }
      // Handle both cases: [ ... ] or { data: [ ... ] }
      const integrations = Array.isArray(data) ? data : (data?.data || []);
      return { data: integrations as Integration[], error: null };
    } catch (error) {
      console.error("integrationsApi: Status check failed", error);
      return { data: null, error };
    }
  },

  async getChannelStats(platform: 'youtube') {
    const { data } = await this.invokeFunction('channel-integration', { action: 'stats', platform });
    return data;
  },

  async getReports(platform: string, startDate: string, endDate: string, dimensions = 'day', metrics?: string, reportType?: 'main' | 'audience' | 'traffic', filters?: string) {
    const { data } = await this.invokeFunction('channel-integration', {
      action: 'reports', // Reverted from 'get_reports' for compatibility
      platform,
      startDate,
      endDate,
      dimensions,
      metrics,
      reportType,
      filters
    });
    return data;
  },

  async getVideos(platform: 'youtube', maxResults = 10, order: 'date' | 'viewCount' | 'rating' = 'date') {
    const { data } = await this.invokeFunction('channel-integration', {
      action: 'videos',
      platform,
      maxResults,
      order
    });
    return data;
  },

  async disconnect(platform: string) {
    const { data } = await this.invokeFunction('channel-integration', { action: 'disconnect', platform });
    return data;
  }
};
