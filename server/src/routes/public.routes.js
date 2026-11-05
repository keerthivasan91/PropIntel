import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createLead } from '../services/lead.service.js';

const router = Router();

const enquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'ENQUIRY_RATE_LIMITED',
      message: 'Too many enquiries were submitted from this connection. Please try again later.'
    }
  }
});

router.post('/enquiries', enquiryLimiter, async (req, res, next) => {
  try {
    const body = req.body ?? {};
    // Only accept customer enquiry fields. Admin-controlled fields such as status
    // are deliberately ignored so a public visitor cannot alter the sales pipeline.
    const lead = await createLead({
      name: body.name,
      location: body.location,
      property_requirement: body.property_requirement,
      budget_min: body.budget_min,
      budget_max: body.budget_max,
      buying_timeline: body.buying_timeline,
      customer_message: body.customer_message,
      status: 'new'
    });

    res.status(201).json({ data: { reference: lead.id } });
  } catch (error) {
    next(error);
  }
});

export default router;
