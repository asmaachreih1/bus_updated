import Cluster from '../models/Cluster';
import User from '../models/User';

export const ClusterService = {
    create: async (payload: { name: string; driverId: string; code: string }) => {
        const cluster = new Cluster({
            id: Math.random().toString(36).substring(7),
            name: payload.name,
            driver_id: payload.driverId,
            code: payload.code
        });
        await cluster.save();
        return cluster;
    },

    join: async (code: string, userId: string) => {
        // Check if cluster exists
        const cluster = await Cluster.findOne({ code });
        if (!cluster) throw new Error('Cluster not found');

        // Update user's clusterId
        await User.findOneAndUpdate({ id: userId }, { cluster_id: code });

        return cluster;
    },

    getDriverCluster: async (driverId: string) => {
        return await Cluster.findOne({ driver_id: driverId });
    },

    getByUserId: async (userId: string) => {
        const user = await User.findOne({ id: userId });
        if (!user?.cluster_id) return null;

        return await Cluster.findOne({ code: user.cluster_id });
    },

    getMembers: async (code: string) => {
        return await User.find({ cluster_id: code });
    },

    listAll: async () => {
        return await Cluster.find();
    }
};
