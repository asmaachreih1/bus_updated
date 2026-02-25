import { Report } from '../models/Report';

export const ReportService = {
    submit: async (reportData: any) => {
        const report = new Report({
            ...reportData,
            id: Math.random().toString(36).substring(7),
            timestamp: new Date()
        });
        return await report.save();
    },

    getAll: async () => {
        return await Report.find({}).sort({ timestamp: -1 });
    },

    resolve: async (reportId: string) => {
        return await Report.findOneAndUpdate({ id: reportId }, { status: 'resolved' });
    }
};
