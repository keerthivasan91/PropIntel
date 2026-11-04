import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidTaskDueFilter,
  isValidTaskStatus,
  validateCreateTask,
  validateTaskUpdate
} from '../src/validators/task.validator.js';

test('validates and trims a new follow-up task', () => {
  const task = validateCreateTask({
    title: '  Call customer  ',
    description: 'Confirm preferred site visit date.',
    due_at: '2026-11-08T10:00:00.000Z'
  });
  assert.equal(task.title, 'Call customer');
  assert.equal(task.description, 'Confirm preferred site visit date.');
  assert.equal(task.due_at, '2026-11-08 10:00:00');
});

test('allows optional due date and description', () => {
  const task = validateCreateTask({ title: 'Prepare property shortlist' });
  assert.equal(task.description, null);
  assert.equal(task.due_at, null);
});

test('rejects an empty title', () => {
  assert.throws(() => validateCreateTask({ title: '  ' }), (error) => error.status === 400);
});

test('rejects an oversized task title', () => {
  assert.throws(() => validateCreateTask({ title: 'x'.repeat(181) }), (error) => error.status === 400);
});

test('rejects invalid due date input', () => {
  assert.throws(() => validateCreateTask({ title: 'Call customer', due_at: 'next week maybe' }), (error) => error.status === 400);
});

test('allows status-only updates', () => {
  assert.deepEqual(validateTaskUpdate({ status: 'completed' }), { status: 'completed' });
});

test('rejects invalid task status', () => {
  assert.throws(() => validateTaskUpdate({ status: 'started' }), (error) => error.status === 400);
});

test('validates allowed task statuses and due filters', () => {
  assert.equal(isValidTaskStatus('pending'), true);
  assert.equal(isValidTaskStatus('complete'), false);
  assert.equal(isValidTaskDueFilter('overdue'), true);
  assert.equal(isValidTaskDueFilter('tomorrow'), false);
});
