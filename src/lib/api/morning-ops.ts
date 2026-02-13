
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
    });

    if (error) return { success: false, error: error.message, data: [] };
    return data;
}
