import { Request, Response } from 'express';
import { ClusterService } from '../services/cluster.service';
import { AttendanceService } from '../services/attendance.service';

export const ClusterController = {
    create: async (req: Request, res: Response) => {
        try {
            const { name, driverId } = req.body;
            const code = Math.random().toString(36).substring(7).toUpperCase();
            const cluster = await ClusterService.create({ name, driverId, code });
            res.json({ success: true, cluster });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    },

    join: async (req: Request, res: Response) => {
        try {
            const { code, userId } = req.body;
            const cluster = await ClusterService.join(code, userId);
            res.json({ success: true, cluster });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    },

    getDriverCluster: async (req: Request, res: Response) => {
        try {
            const { driverId } = req.params;
            const cluster = await ClusterService.getDriverCluster(String(driverId));
            if (!cluster) return res.json({ cluster: null, members: [] });
            const members = await ClusterService.getMembers(cluster.code);
            res.json({ cluster, members });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    },

    getMemberCluster: async (req: Request, res: Response) => {
        try {
            const { userId } = req.params;
            // In a real app we'd fetch the user from Supabase here
            // For now, let's assume the frontend might provide the clusterId or we fetch from service
            const members = await ClusterService.getMembers(String(userId)); // This is just a placeholder, logic depends on schema
            res.json({ members });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    },

    getInfo: async (req: Request, res: Response) => {
        try {
            const { driverId, userId, role } = req.query;

            let cluster: any = null;
            if (role === 'driver') {
                cluster = await ClusterService.getDriverCluster(String(driverId));
            } else {
                // Simplified: assuming userId is used to find cluster
                const clusters = await ClusterService.listAll();
                cluster = clusters.find((c: any) => c.members?.includes(String(userId)));
            }

            if (!cluster) return res.json({ success: false });

            const members = await ClusterService.getMembers(cluster.code);
            const date = new Date().toISOString().split('T')[0];
            const attendance = await AttendanceService.getForCluster(cluster.code, date);

            res.json({
                success: true,
                cluster,
                members,
                attendance: attendance.reduce((acc: any, curr: any) => {
                    acc[curr.user_id] = curr.status;
                    return acc;
                }, {})
            });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    },

    markAttendance: async (req: Request, res: Response) => {
        try {
            const { userId, clusterId, status } = req.body;
            const date = new Date().toISOString().split('T')[0];
            await AttendanceService.mark({ userId, clusterId, status, date });
            res.json({ success: true });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    }
};
