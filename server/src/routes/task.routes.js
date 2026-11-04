import { Router } from 'express';
import {
  createTaskForLead,
  getTaskSummary,
  listLeadActivities,
  listTasks,
  updateTask
} from '../services/task.service.js';
import {
  isValidTaskDueFilter,
  isValidTaskStatus
} from '../validators/task.validator.js';
import { httpError } from '../utils/httpError.js';

const router = Router();

router.get('/tasks/summary', async (_req, res, next) => {
  try {
    const summary = await getTaskSummary();
    res.json({ data: summary });
  } catch (error) {
    next(error);
  }
});

router.get('/tasks', async (req, res, next) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : '';
    const due = typeof req.query.due === 'string' ? req.query.due : '';
    const leadId = typeof req.query.lead_id === 'string' ? req.query.lead_id : '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const page = Number.parseInt(req.query.page ?? '1', 10);
    const limit = Number.parseInt(req.query.limit ?? '20', 10);

    if (status && !isValidTaskStatus(status)) {
      throw httpError(400, 'VALIDATION_ERROR', 'Invalid task status filter.');
    }
    if (!isValidTaskDueFilter(due)) {
      throw httpError(400, 'VALIDATION_ERROR', 'Invalid due date filter.');
    }
    if (search.length > 80) {
      throw httpError(400, 'VALIDATION_ERROR', 'Search must be 80 characters or fewer.');
    }
    if (!Number.isInteger(page) || page < 1) {
      throw httpError(400, 'VALIDATION_ERROR', 'page must be a positive integer.');
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      throw httpError(400, 'VALIDATION_ERROR', 'limit must be between 1 and 50.');
    }

    const result = await listTasks({ status, due, leadId, search, page, limit });
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/leads/:id/tasks', async (req, res, next) => {
  try {
    const task = await createTaskForLead(req.params.id, req.body);
    res.status(201).json({ data: { task } });
  } catch (error) {
    next(error);
  }
});

router.get('/leads/:id/tasks', async (req, res, next) => {
  try {
    const result = await listTasks({ leadId: req.params.id, page: 1, limit: 50 });
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/leads/:id/activities', async (req, res, next) => {
  try {
    const activities = await listLeadActivities(req.params.id, { limit: 50 });
    res.json({ data: { activities } });
  } catch (error) {
    next(error);
  }
});

router.patch('/tasks/:id', async (req, res, next) => {
  try {
    const task = await updateTask(req.params.id, req.body);
    res.json({ data: { task } });
  } catch (error) {
    next(error);
  }
});

export default router;
