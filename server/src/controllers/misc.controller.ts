import { Request, Response } from 'express';
import { LocationService } from '../services/location.service';
import { ReportService } from '../services/report.service';

export const LocationController = {
    update: async (req: Request, res: Response) => {
        try {
            const { driverId, lat, lng, isDriving } = req.body;
            const location = await LocationService.update(driverId, lat, lng, isDriving);
            res.json({ success: true, location });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    },

    getAll: async (req: Request, res: Response) => {
        try {
            const locations = await LocationService.getAll();
            res.json({ success: true, vans: locations });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    }
};

export const ReportController = {
    submit: async (req: Request, res: Response) => {
        try {
            const report = await ReportService.submit(req.body);
            res.json({ success: true, report });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    },

    getAll: async (req: Request, res: Response) => {
        try {
            const reports = await ReportService.getAll();
            res.json(reports);
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    },

    resolve: async (req: Request, res: Response) => {
        try {
            const { reportId } = req.body;
            await ReportService.resolve(reportId);
            res.json({ success: true });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    }
};
