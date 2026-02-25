import { Request, Response } from 'express';
import { ClusterService } from '../services/cluster.service';
import { AttendanceService } from '../services/attendance.service';

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

    getInfo: async (req: Request, res: Response) => {
        try {
            const { driverId, userId, role } = req.query;

            let cluster: any = null;
            if (role === 'driver') {
                cluster = await ClusterService.getDriverCluster(driverId as string);
            } else {
                // Find cluster the user is a member of
                // This is simplified, usually you'd check User.clusterId
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
