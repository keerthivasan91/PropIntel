import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertBudgetRange,
  validateLeadInput
} from '../src/validators/lead.validator.js';

const validLead = {
  name: 'Aarav Mehta',
  location: 'Whitefield, Bengaluru',
  property_requirement: '3BHK apartment',
  budget_min: 9000000,
  budget_max: 12000000,
  buying_timeline: 'Within 2 months',
  customer_message: 'Looking for a 3BHK near schools and good connectivity.'
};

test('validates and normalizes a valid lead', () => {
  const result = validateLeadInput(validLead);
  assert.equal(result.name, 'Aarav Mehta');
  assert.equal(result.status, 'new');
  assert.equal(result.budget_min, 9000000);
});

test('rejects missing required fields', () => {
  assert.throws(
    () => validateLeadInput({ name: 'Aarav' }),
    (error) => error.status === 400 && error.code === 'VALIDATION_ERROR'
  );
});

test('rejects whitespace-only required text', () => {
  assert.throws(
    () => validateLeadInput({ ...validLead, name: '   ' }),
    (error) => error.status === 400
  );
});

test('rejects a negative budget', () => {
  assert.throws(
    () => validateLeadInput({ ...validLead, budget_min: -10 }),
    (error) => error.status === 400
  );
});

test('rejects an invalid status', () => {
  assert.throws(
    () => validateLeadInput({ ...validLead, status: 'urgent' }),
    (error) => error.status === 400
  );
});

test('rejects a minimum budget greater than maximum', () => {
  assert.throws(
    () => assertBudgetRange(15000000, 10000000),
    (error) => error.status === 400
  );
});

test('allows a partial status update', () => {
  const result = validateLeadInput({ status: 'contacted' }, { partial: true });
  assert.deepEqual(result, { status: 'contacted' });
});
