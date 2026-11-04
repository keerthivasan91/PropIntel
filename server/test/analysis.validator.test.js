import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAnalysisPayload } from '../src/services/analysis.validator.js';

const validAnalysis = {
  summary: 'Customer is looking for a 3BHK apartment in Whitefield.',
  customer_intent: 'Compare suitable residential options.',
  key_requirements: ['3BHK apartment', 'Whitefield location'],
  objections: [],
  recommended_action: 'Confirm preferred possession date and shortlist options.',
  suggested_response: 'Thank you for sharing your requirements. I can help shortlist suitable options.'
};

test('accepts a valid structured Gemini analysis', () => {
  const result = validateAnalysisPayload(validAnalysis);
  assert.equal(result.customer_intent, validAnalysis.customer_intent);
  assert.deepEqual(result.objections, []);
});

test('rejects missing required fields', () => {
  assert.throws(
    () => validateAnalysisPayload({ summary: 'Incomplete' }),
    (error) => error.status === 502 && error.code === 'INVALID_AI_RESPONSE'
  );
});

test('rejects empty model-generated text', () => {
  assert.throws(
    () => validateAnalysisPayload({ ...validAnalysis, summary: '   ' }),
    (error) => error.status === 502
  );
});

test('rejects a non-string requirement item', () => {
  assert.throws(
    () => validateAnalysisPayload({ ...validAnalysis, key_requirements: ['3BHK', 42] }),
    (error) => error.status === 502
  );
});

test('rejects oversized requirement lists', () => {
  assert.throws(
    () => validateAnalysisPayload({ ...validAnalysis, objections: Array(11).fill('Concern') }),
    (error) => error.status === 502
  );
});
