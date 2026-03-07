import Report from '../models/Report';

export const ReportService = {
    submit: async (payload: { userId: string; type: string; message: string; userName?: string }) => {
        const report = new Report({
            id: Math.random().toString(36).substring(7),
            user_id: payload.userId,
            type: payload.type,
            message: payload.message,
            user_name: payload.userName
        });
        await report.save();
        return report;
    },

    getAll: async () => {
        return await Report.find().sort({ created_at: -1 });
    },

    resolve: async (reportId: string) => {
        return await Report.findOneAndUpdate(
            { id: reportId },
            { status: 'resolved' },
            { new: true }
        );
    }
};
