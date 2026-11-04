import { Router } from 'express';
import {
  createLead,
  getLeadById,
  getLeadSummary,
  listLeads,
  updateLead
} from '../services/lead.service.js';
import { isValidLeadStatus } from '../validators/lead.validator.js';
import { httpError } from '../utils/httpError.js';

const router = Router();

router.get('/summary', async (_req, res, next) => {
  try {
    const summary = await getLeadSummary();
    res.json({ data: summary });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const status = typeof req.query.status === 'string' ? req.query.status : '';
    const page = Number.parseInt(req.query.page ?? '1', 10);
    const limit = Number.parseInt(req.query.limit ?? '10', 10);

    if (search.length > 80) {
      throw httpError(400, 'VALIDATION_ERROR', 'Search must be 80 characters or fewer.');
    }
    if (!Number.isInteger(page) || page < 1) {
      throw httpError(400, 'VALIDATION_ERROR', 'page must be a positive integer.');
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      throw httpError(400, 'VALIDATION_ERROR', 'limit must be between 1 and 50.');
    }
    if (status && !isValidLeadStatus(status)) {
      throw httpError(400, 'VALIDATION_ERROR', 'Invalid lead status filter.');
    }

    const result = await listLeads({ search, status, page, limit });
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const lead = await createLead(req.body);
    res.status(201).json({ data: { lead } });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const lead = await getLeadById(req.params.id);
    res.json({ data: { lead } });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const lead = await updateLead(req.params.id, req.body);
    res.json({ data: { lead } });
  } catch (error) {
    next(error);
  }
});

export default router;
