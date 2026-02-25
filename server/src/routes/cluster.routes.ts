import { Router } from 'express';
import { ClusterController } from '../controllers/cluster.controller';

const router = Router();

router.post('/create', ClusterController.create);
router.post('/join', ClusterController.join);
router.get('/driver/:driverId', ClusterController.getDriverCluster);
router.get('/member/:userId', ClusterController.getMemberCluster);
router.get('/info', ClusterController.getInfo);
router.post('/attendance', ClusterController.markAttendance);

export default router;
