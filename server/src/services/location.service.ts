import { supabase } from '../config/supabase';

export const LocationService = {
    update: async (userId: string, latitude: number, longitude: number) => {
        const { data, error } = await supabase
            .from('locations')
            .upsert({
                user_id: userId,
                latitude,
                longitude,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    getAll: async () => {
        const { data, error } = await supabase
            .from('locations')
            .select('*, users(name, role)')
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }
};
