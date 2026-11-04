import { httpError } from '../utils/httpError.js';

const TEXT_LIMITS = {
  summary: 700,
  customer_intent: 500,
  recommended_action: 600,
  suggested_response: 1200
};

function validateText(value, field, maximum) {
  if (typeof value !== 'string') {
    throw httpError(502, 'INVALID_AI_RESPONSE', 'Gemini returned an invalid ' + field + ' value.');
  }

  const cleaned = value.trim();
  if (!cleaned || cleaned.length > maximum) {
    throw httpError(502, 'INVALID_AI_RESPONSE', 'Gemini returned an empty or oversized ' + field + ' value.');
  }

  return cleaned;
}

function validateStringArray(value, field) {
  if (!Array.isArray(value) || value.length > 10) {
    throw httpError(502, 'INVALID_AI_RESPONSE', 'Gemini returned an invalid ' + field + ' list.');
  }

  return value.map((item, index) => {
    if (typeof item !== 'string' || !item.trim() || item.trim().length > 280) {
      throw httpError(502, 'INVALID_AI_RESPONSE', 'Gemini returned an invalid item in ' + field + '.');
    }
    return item.trim();
  });
}

export function validateAnalysisPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw httpError(502, 'INVALID_AI_RESPONSE', 'Gemini did not return a JSON object.');
  }

  return {
    summary: validateText(payload.summary, 'summary', TEXT_LIMITS.summary),
    customer_intent: validateText(payload.customer_intent, 'customer intent', TEXT_LIMITS.customer_intent),
    key_requirements: validateStringArray(payload.key_requirements, 'key requirements'),
    objections: validateStringArray(payload.objections, 'objections'),
    recommended_action: validateText(payload.recommended_action, 'recommended action', TEXT_LIMITS.recommended_action),
    suggested_response: validateText(payload.suggested_response, 'suggested response', TEXT_LIMITS.suggested_response)
  };
}
