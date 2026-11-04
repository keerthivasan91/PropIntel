import test from 'node:test';
import assert from 'node:assert/strict';
import { GEMINI_HTTP_OPTIONS, mapGeminiProviderError } from '../src/services/gemini.utils.js';

test('Gemini requests use bounded exponential retries for transient statuses', () => {
  const retry = GEMINI_HTTP_OPTIONS.retryOptions;
  assert.equal(retry.attempts, 4);
  assert.equal(retry.initialDelay, 1);
  assert.equal(retry.maxDelay, 4);
  assert.deepEqual(retry.httpStatusCodes, [408, 500, 502, 503, 504]);
});

test('maps Gemini 503 overload to a retryable application 503', () => {
  const error = mapGeminiProviderError({ status: 503 }, 'chat');
  assert.equal(error.status, 503);
  assert.equal(error.code, 'AI_TEMPORARILY_UNAVAILABLE');
  assert.match(error.message, /temporarily busy or unavailable/i);
});

test('maps Gemini 429 rate limits without retrying possible hard quota exhaustion', () => {
  const error = mapGeminiProviderError({ status: 429 }, 'chat');
  assert.equal(error.status, 429);
  assert.equal(error.code, 'AI_RATE_LIMITED');
  assert.match(error.message, /quota/i);
});

test('maps invalid model configuration to an actionable error', () => {
  const error = mapGeminiProviderError({ status: 404 }, 'analysis');
  assert.equal(error.status, 502);
  assert.equal(error.code, 'AI_MODEL_ERROR');
});
