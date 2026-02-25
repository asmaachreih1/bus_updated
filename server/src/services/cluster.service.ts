import { Cluster } from '../models/Cluster';
import { User } from '../models/User';

export const ClusterService = {
    create: async (name: string, driverId: string) => {
        // Generate unique 6-digit code
        let code = '';
        let exists = true;
        while (exists) {
            code = Math.random().toString(36).substring(2, 8).toUpperCase();
            const existing = await Cluster.findOne({ code });
            if (!existing) exists = false;
        }

        const driver = await User.findOne({ id: driverId });
        const capacity = driver?.capacity || 12;

        const newCluster = new Cluster({ name, driverId, code, capacity });
        await newCluster.save();

        // Update driver's clusterId
        await User.findOneAndUpdate({ id: driverId }, { clusterId: code });

        return newCluster;
    },

    join: async (code: string, userId: string) => {
        const cluster = await Cluster.findOne({ code });
        if (!cluster) throw new Error('Cluster not found');

        if (!cluster.members.includes(userId)) {
            cluster.members.push(userId);
            await cluster.save();
        }

        // Update user's clusterId
        await User.findOneAndUpdate({ id: userId }, { clusterId: code });

        return cluster;
    },

    getDriverCluster: async (driverId: string) => {
        return await Cluster.findOne({ driverId });
    },

    getMembers: async (code: string) => {
        const cluster = await Cluster.findOne({ code });
        if (!cluster) return [];

        // Fetch user details for members
        return await User.find({ id: { $in: cluster.members } });
    }
};
