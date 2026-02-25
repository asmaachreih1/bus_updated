import { Router } from 'express';
import { ClusterController } from '../controllers/cluster.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/create', requireAuth, ClusterController.create);
router.post('/join', ClusterController.join); // Public: only the cluster code is needed
router.get('/info', requireAuth, ClusterController.getInfo);
router.post('/attendance', requireAuth, ClusterController.markAttendance);

export default router;
