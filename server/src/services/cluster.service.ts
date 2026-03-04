import { supabase } from '../config/supabase';

export const ClusterService = {
    create: async (payload: { name: string; driverId: string; code: string }) => {
        const { data, error } = await supabase
            .from('clusters')
            .insert([{
                name: payload.name,
                driver_id: payload.driverId,
                code: payload.code
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    join: async (code: string, userId: string) => {
        // Check if cluster exists
        const { data: cluster, error: clusterError } = await supabase
            .from('clusters')
            .select('*')
            .eq('code', code)
            .single();

        if (clusterError) throw new Error('Cluster not found');

        // Update user's clusterId
        const { error: userError } = await supabase
            .from('users')
            .update({ cluster_id: code })
            .eq('id', userId);

        if (userError) throw userError;

        return cluster;
    },

    getDriverCluster: async (driverId: string) => {
        const { data, error } = await supabase
            .from('clusters')
            .select('*')
            .eq('driver_id', driverId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    getByUserId: async (userId: string) => {
        // First get the user's cluster_id (which is the code)
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('cluster_id')
            .eq('id', userId)
            .single();

        if (userError || !user?.cluster_id) return null;

        // Then get the cluster
        const { data: cluster, error: clusterError } = await supabase
            .from('clusters')
            .select('*')
            .eq('code', user.cluster_id)
            .single();

        if (clusterError) return null;
        return cluster;
    },

    getMembers: async (code: string) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('cluster_id', code);

        if (error) throw error;
        return data || [];
    },

    listAll: async () => {
        const { data, error } = await supabase
            .from('clusters')
            .select('*');

        if (error) throw error;
        return data || [];
    }
};
