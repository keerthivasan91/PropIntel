import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getLeadConversation, sendLeadChatMessage } from '../services/chat.service.js';

const router = Router();

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'CHAT_RATE_LIMITED',
      message: 'Too many assistant messages. Please wait before trying again.'
    }
  }
});

router.get('/:id/conversations', async (req, res, next) => {
  try {
    const messages = await getLeadConversation(req.params.id);
    res.json({ data: { messages } });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/chat', chatLimiter, async (req, res, next) => {
  try {
    const result = await sendLeadChatMessage(req.params.id, req.body);
    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
