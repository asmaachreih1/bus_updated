import { Request, Response } from 'express';
import { ClusterService } from '../services/cluster.service';
import { AttendanceService } from '../services/attendance.service';
import { Cluster } from '../models/Cluster';
import { User } from '../models/User';

export const ClusterController = {
    create: async (req: Request, res: Response) => {
        try {
            const { name, driverId } = req.body;
            const cluster = await ClusterService.create(name, driverId);
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
            const cluster = await ClusterService.getDriverCluster(driverId);
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
            const user = await User.findOne({ id: userId });
            if (!user || !user.clusterId) return res.json({ cluster: null });
            const cluster = await Cluster.findOne({ code: user.clusterId });
            res.json({ cluster });
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
                const user = await User.findOne({ id: userId as string });
                if (user?.clusterId) {
                    cluster = await Cluster.findOne({ code: user.clusterId });
                }
            }

            if (!cluster) return res.json({ success: false });

            const members = await ClusterService.getMembers(cluster.code);
            const attendance = await AttendanceService.getForCluster(cluster.code);

            res.json({
                success: true,
                cluster,
                members,
                attendance: attendance.reduce((acc: any, curr: any) => {
                    acc[curr.userId] = curr.status;
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
            await AttendanceService.mark(userId, clusterId, status);
            res.json({ success: true });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    }
};
