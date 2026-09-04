import { Router } from 'express';
import { AuthController } from '../controller/auth.controller.js';
import { validate, loginSchema, updateProfileSchema } from '../validator/auth.validator.js';
import { protect } from '../../../middlewares/auth.middleware.js';

const router = Router();
const controller = new AuthController();

router.post('/login', validate(loginSchema), controller.login);
router.post('/refresh-token', controller.refreshToken);
router.post('/logout', protect, controller.logout);
router.post('/logout-all', protect, controller.logoutAll);
router.get('/profile', protect, controller.getProfile);
router.put('/profile', protect, validate(updateProfileSchema), controller.updateProfile);
router.get('/sessions', protect, controller.getSessions);
router.delete('/sessions/:id', protect, controller.revokeSession);

export default router;

