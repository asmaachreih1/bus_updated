import Attendance from '../models/Attendance';
import User from '../models/User';

export const AttendanceService = {
    mark: async (payload: { clusterId: string; userId: string; status: string; date: string }) => {
        return await Attendance.findOneAndUpdate(
            {
                cluster_id: payload.clusterId,
                user_id: payload.userId,
                date: payload.date
            },
            { status: payload.status },
            { upsert: true, new: true }
        );
    },

    getForCluster: async (clusterId: string, date: string) => {
        // In MongoDB, we might need a manual join or populate if we had foreign keys
        // But for now, we'll just get the attendance records.
        // If the frontend needs names, we might need to fetch users too.
        const records = await Attendance.find({
            cluster_id: clusterId,
            date: date
        }).lean();

        // Manual join for names since we're not using refs yet
        const enrichedRecords = await Promise.all(records.map(async (rec) => {
            const user = await User.findOne({ id: rec.user_id }).select('name').lean();
            return { ...rec, users: user };
        }));

        return enrichedRecords;
    }
};
