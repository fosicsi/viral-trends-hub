
import { supabase } from "@/integrations/supabase/client";

export type MorningItem = {
    id: string;
    title: string;
    thumbnail: string;
    channelTitle: string;
    channelSubs: number;
    views: number;
    publishedAt: string;
    ratio: number;
    reason?: string;
    duration?: string;
};

export async function getMorningOpportunities(keywords?: string): Promise<{ success: boolean; data: MorningItem[]; error?: string; source?: string }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { success: false, error: "Unauthorized", data: [] };

    const { data, error } = await supabase.functions.invoke("get-morning-opportunities", {
        body: { userId: session.user.id, keywords },
        headers: {
            Authorization: `Bearer ${session.access_token}`
        }
    });

    if (error) {
        console.error("Invoke Error:", error);
        return { success: false, error: error.message || "Connection Failed", data: [] };
    }

    return data;
}
