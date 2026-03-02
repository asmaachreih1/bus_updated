import { Router } from 'express';
import * as busController from '../controllers/bus.controller';

const router = Router();

router.get('/vans', busController.getVans);
router.post('/update-location', busController.updateLocation);
router.post('/update-member', busController.updateMember);
router.post('/clusters/create', busController.createCluster);
router.post('/clusters/join', busController.joinCluster);
router.post('/attendance', busController.setAttendance);
router.get('/attendance', busController.getAttendance);
router.get('/dispatch', busController.getDispatchAssignments);
router.post('/dispatch', busController.assignDispatch);
router.post('/dispatch/clear', busController.clearDispatch);
router.post('/reports', busController.createReport);
router.get('/reports', busController.getReports);
router.post('/reports/status', busController.updateReportStatus);
router.post('/reports/resolve', busController.resolveReport);
router.get('/reset', busController.resetSimulation);

export default router;
