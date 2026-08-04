import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import authenticateJWT from '../middlewares/authenticate.middleware.js';

const router = Router();

// Công khai (public)
router.post('/register', authController.register);
router.post('/login', authController.login);

// Bảo vệ (protected) — yêu cầu JWT hợp lệ
router.get('/me', authenticateJWT, authController.getMe);

export default router;