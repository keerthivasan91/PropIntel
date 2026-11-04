import { httpError } from '../utils/httpError.js';

const statuses = new Set([
  'new',
  'contacted',
  'qualified',
  'site_visit',
  'negotiation',
  'won',
  'lost'
]);

const fieldLimits = {
  name: 120,
  location: 160,
  property_requirement: 160,
  buying_timeline: 80,
  customer_message: 5000
};

function cleanText(value, field, maxLength) {
  if (typeof value !== 'string') {
    throw httpError(400, 'VALIDATION_ERROR', field + ' must be a string.');
  }

  const cleaned = value.trim();
  if (!cleaned) {
    throw httpError(400, 'VALIDATION_ERROR', field + ' is required.');
  }
  if (cleaned.length > maxLength) {
    throw httpError(400, 'VALIDATION_ERROR', field + ' must be ' + maxLength + ' characters or fewer.');
  }

  return cleaned;
}

function cleanBudget(value, field) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 9999999999999.99) {
    throw httpError(400, 'VALIDATION_ERROR', field + ' must be a non-negative valid amount.');
  }

  return numeric;
}

export function validateLeadInput(input, { partial = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw httpError(400, 'VALIDATION_ERROR', 'Request body must be a JSON object.');
  }

  const output = {};
  const textFields = Object.keys(fieldLimits);

  for (const field of textFields) {
    if (input[field] === undefined) {
      if (!partial) {
        throw httpError(400, 'VALIDATION_ERROR', field + ' is required.');
      }
      continue;
    }
    output[field] = cleanText(input[field], field, fieldLimits[field]);
  }

  for (const field of ['budget_min', 'budget_max']) {
    const value = cleanBudget(input[field], field);
    if (value !== undefined) output[field] = value;
  }

  if (input.status !== undefined) {
    if (typeof input.status !== 'string' || !statuses.has(input.status)) {
      throw httpError(400, 'VALIDATION_ERROR', 'status must be one of: ' + [...statuses].join(', ') + '.');
    }
    output.status = input.status;
  }

  if (!partial && input.status === undefined) {
    output.status = 'new';
  }

  if (partial && Object.keys(output).length === 0) {
    throw httpError(400, 'VALIDATION_ERROR', 'Provide at least one field to update.');
  }

  return output;
}

export function assertBudgetRange(minimum, maximum) {
  if (minimum !== null && minimum !== undefined &&
      maximum !== null && maximum !== undefined &&
      Number(minimum) > Number(maximum)) {
    throw httpError(400, 'VALIDATION_ERROR', 'budget_min cannot be greater than budget_max.');
  }
}

export function isValidLeadStatus(status) {
  return statuses.has(status);
}
