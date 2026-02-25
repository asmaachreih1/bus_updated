import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/me', requireAuth, authController.me);
router.get('/users', requireAuth, authController.users);

export default router;
