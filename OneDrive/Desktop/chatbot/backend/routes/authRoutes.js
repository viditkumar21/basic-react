import express from 'express';
import { signup, login } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

// Example to verify middleware - typically not used like this purely, but as a testable protected route inside auth if needed
router.get('/profile', protect, (req, res) => {
    res.json(req.user);
});

export default router;
