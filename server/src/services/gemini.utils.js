import { httpError } from '../utils/httpError.js';

// @google/genai 2.32 supports per-request retryOptions on generateContent.
// Four attempts means one initial request plus at most three retries.
// 429 is intentionally excluded: it can mean a hard quota limit, not just a short burst.
export const GEMINI_HTTP_OPTIONS = {
  timeout: 30000,
  retryOptions: {
    attempts: 4,
    initialDelay: 1,
    maxDelay: 4,
    expBase: 2,
    jitter: 1,
    httpStatusCodes: [408, 500, 502, 503, 504]
  }
};

export function mapGeminiProviderError(error, operation) {
  const status = Number(error?.status ?? error?.code);

  if (status === 429) {
    console.error('[PropIntel Gemini ' + operation + '] Provider rate limit or quota response.', {
      status
    });
    return httpError(
      429,
      'AI_RATE_LIMITED',
      'Gemini rejected the request due to a rate limit or quota. Check your API project usage and try again when the limit resets.'
    );
  }

  if ([500, 502, 503, 504].includes(status)) {
    console.error('[PropIntel Gemini ' + operation + '] Provider temporarily unavailable after retry policy.', {
      status
    });
    return httpError(
      503,
      'AI_TEMPORARILY_UNAVAILABLE',
      'Gemini is temporarily busy or unavailable. Your message was not saved. Please try again in a few seconds.'
    );
  }

  if ([400, 404].includes(status)) {
    console.error('[PropIntel Gemini ' + operation + '] Model or request configuration error.', {
      status
    });
    return httpError(
      502,
      'AI_MODEL_ERROR',
      'Gemini rejected the configured model or request. Check GEMINI_MODEL and model access.'
    );
  }

  console.error('[PropIntel Gemini ' + operation + '] Provider request failed.', {
    status: Number.isFinite(status) ? status : 'unknown',
    errorName: error?.name ?? 'Error'
  });
  return httpError(
    502,
    'AI_PROVIDER_ERROR',
    'Gemini could not complete this request. Check the backend logs and try again.'
  );
}
