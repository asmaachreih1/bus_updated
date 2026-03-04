import { supabase } from '../config/supabase';

export const ReportService = {
    submit: async (payload: { userId: string; type: string; message: string; userName?: string }) => {
        const { data, error } = await supabase
            .from('reports')
            .insert([{
                user_id: payload.userId,
                type: payload.type,
                message: payload.message,
                user_name: payload.userName
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    getAll: async () => {
        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    resolve: async (reportId: string) => {
        const { data, error } = await supabase
            .from('reports')
            .update({ status: 'resolved' })
            .eq('id', reportId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
