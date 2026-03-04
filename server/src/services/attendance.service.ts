import { supabase } from '../config/supabase';

export const AttendanceService = {
    mark: async (payload: { clusterId: string; userId: string; status: string; date: string }) => {
        const { data, error } = await supabase
            .from('attendance')
            .upsert({
                cluster_id: payload.clusterId,
                user_id: payload.userId,
                status: payload.status,
                date: payload.date
            }, { onConflict: 'cluster_id,user_id,date' })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    getForCluster: async (clusterId: string, date: string) => {
        const { data, error } = await supabase
            .from('attendance')
            .select('*, users(name)')
            .eq('cluster_id', clusterId)
            .eq('date', date);

        if (error) throw error;
        return data || [];
    }
};
