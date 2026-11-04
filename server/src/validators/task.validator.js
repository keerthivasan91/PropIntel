import { httpError } from '../utils/httpError.js';

const TASK_STATUSES = new Set(['pending', 'completed', 'cancelled']);

function cleanText(value, field, maximum, { allowEmpty = false } = {}) {
  if (typeof value !== 'string') {
    throw httpError(400, 'VALIDATION_ERROR', field + ' must be a string.');
  }
  const cleaned = value.trim();
  if (!allowEmpty && !cleaned) {
    throw httpError(400, 'VALIDATION_ERROR', field + ' is required.');
  }
  if (cleaned.length > maximum) {
    throw httpError(400, 'VALIDATION_ERROR', field + ' must be ' + maximum + ' characters or fewer.');
  }
  return cleaned;
}

function normalizeDueAt(value) {
  if (value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw httpError(400, 'VALIDATION_ERROR', 'due_at must be an ISO date-time string or null.');
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw httpError(400, 'VALIDATION_ERROR', 'due_at must be a valid date-time.');
  }
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

export function validateCreateTask(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw httpError(400, 'VALIDATION_ERROR', 'Request body must be a JSON object.');
  }
  const title = cleanText(payload.title, 'title', 180);
  const description = payload.description === undefined || payload.description === null
    ? null
    : cleanText(payload.description, 'description', 2000, { allowEmpty: true });
  const dueAt = payload.due_at === undefined ? null : normalizeDueAt(payload.due_at);
  return { title, description, due_at: dueAt };
}

export function validateTaskUpdate(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw httpError(400, 'VALIDATION_ERROR', 'Request body must be a JSON object.');
  }
  const output = {};
  if (Object.hasOwn(payload, 'title')) output.title = cleanText(payload.title, 'title', 180);
  if (Object.hasOwn(payload, 'description')) {
    output.description = payload.description === null
      ? null
      : cleanText(payload.description, 'description', 2000, { allowEmpty: true });
  }
  if (Object.hasOwn(payload, 'due_at')) output.due_at = normalizeDueAt(payload.due_at);
  if (Object.hasOwn(payload, 'status')) {
    if (typeof payload.status !== 'string' || !TASK_STATUSES.has(payload.status)) {
      throw httpError(400, 'VALIDATION_ERROR', 'status must be pending, completed or cancelled.');
    }
    output.status = payload.status;
  }
  if (Object.keys(output).length === 0) {
    throw httpError(400, 'VALIDATION_ERROR', 'Provide at least one task field to update.');
  }
  return output;
}

export function isValidTaskStatus(value) {
  return TASK_STATUSES.has(value);
}

export function isValidTaskDueFilter(value) {
  return value === '' || ['overdue', 'today', 'upcoming', 'no_date'].includes(value);
}
