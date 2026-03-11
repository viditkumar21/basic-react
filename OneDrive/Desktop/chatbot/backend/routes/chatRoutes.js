import express from 'express';
import multer from 'multer';
import { generateChatResponse, getChatHistory, deleteChat, getSkillGaps, getUserPerformanceProfile } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

router.post('/', protect, upload.single('image'), generateChatResponse);
router.get('/skills', protect, getSkillGaps);
router.get('/history', protect, getChatHistory);
router.delete('/:id', protect, deleteChat);

// Add performance route
router.get('/performance', protect, getUserPerformanceProfile);

export default router;
