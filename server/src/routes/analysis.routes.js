import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { analyzeLead, listLeadAnalyses } from '../services/analysis.service.js';

const router = Router();

const analysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'ANALYSIS_RATE_LIMITED',
      message: 'Too many analysis requests. Please wait before trying again.'
    }
  }
});

router.post('/:id/analyze', analysisLimiter, async (req, res, next) => {
  try {
    const analysis = await analyzeLead(req.params.id);
    res.status(201).json({ data: { analysis } });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/analyses', async (req, res, next) => {
  try {
    const analyses = await listLeadAnalyses(req.params.id);
    res.json({ data: { analyses } });
  } catch (error) {
    next(error);
  }
});

export default router;
