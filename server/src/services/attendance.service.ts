import { Attendance } from '../models/Attendance';

export const AttendanceService = {
    mark: async (userId: string, clusterId: string, status: string) => {
        const date = new Date().toISOString().split('T')[0];

        await Attendance.findOneAndUpdate(
            { userId, clusterId, date },
            { status, timestamp: new Date() },
            { upsert: true }
        );

        return { success: true };
    },

    getForCluster: async (clusterId: string) => {
        const date = new Date().toISOString().split('T')[0];
        return await Attendance.find({ clusterId, date });
    }
};
