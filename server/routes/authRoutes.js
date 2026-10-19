import express from 'express';
import {
  register,
  login,
  getMe,
  logout,
  logoutAll,
  getSessionInfo,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/logout-all', logoutAll);
router.get('/me', protect, getMe);
router.get('/session', protect, getSessionInfo);

export default router;

