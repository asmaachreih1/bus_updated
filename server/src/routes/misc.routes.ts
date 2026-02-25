import { Router } from 'express';
import { LocationController, ReportController } from '../controllers/misc.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// Location routes
router.post('/location', requireAuth, LocationController.update);
router.get('/vans', LocationController.getAll); // Publicly viewable on map

// Report routes
router.post('/reports', requireAuth, ReportController.submit);
router.get('/reports', requireAuth, ReportController.getAll);
router.post('/reports/resolve', requireAuth, ReportController.resolve);

export default router;
