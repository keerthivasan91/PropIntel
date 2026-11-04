import { httpError } from '../utils/httpError.js';

const POLICY_IDS = new Set([
  'company_profile',
  'sales_policies',
  'communication_guidelines',
  'escalation_rules'
]);

const DECISIONS = new Set([
  'allowed',
  'out_of_scope',
  'needs_policy_clarification',
  'escalate'
]);

export function validateChatInput(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw httpError(400, 'VALIDATION_ERROR', 'Request body must be a JSON object.');
  }

  if (typeof payload.message !== 'string') {
    throw httpError(400, 'VALIDATION_ERROR', 'message must be a string.');
  }

  const message = payload.message.trim();
  if (!message) {
    throw httpError(400, 'VALIDATION_ERROR', 'Enter a message before sending.');
  }
  if (message.length > 2000) {
    throw httpError(400, 'VALIDATION_ERROR', 'Message must be 2,000 characters or fewer.');
  }

  return { message };
}

function validateStringArray(value, field, limit = 8) {
  if (!Array.isArray(value) || value.length > limit) {
    throw httpError(502, 'INVALID_AI_RESPONSE', 'Gemini returned an invalid ' + field + ' list.');
  }

  return value.map((item) => {
    if (typeof item !== 'string' || !item.trim() || item.trim().length > 240) {
      throw httpError(502, 'INVALID_AI_RESPONSE', 'Gemini returned an invalid item in ' + field + '.');
    }
    return item.trim();
  });
}

function validateText(value, field, maximum, allowEmpty = false) {
  if (typeof value !== 'string') {
    throw httpError(502, 'INVALID_AI_RESPONSE', 'Gemini returned an invalid ' + field + '.');
  }

  const cleaned = value.trim();
  if ((!allowEmpty && !cleaned) || cleaned.length > maximum) {
    throw httpError(502, 'INVALID_AI_RESPONSE', 'Gemini returned an empty or oversized ' + field + '.');
  }
  return cleaned;
}

export function validateChatResponse(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw httpError(502, 'INVALID_AI_RESPONSE', 'Gemini did not return a JSON object.');
  }

  if (typeof payload.decision !== 'string' || !DECISIONS.has(payload.decision)) {
    throw httpError(502, 'INVALID_AI_RESPONSE', 'Gemini returned an unsupported decision.');
  }

  const policyIds = validateStringArray(payload.supporting_policy_ids, 'supporting policies', 4);
  if (policyIds.some((id) => !POLICY_IDS.has(id))) {
    throw httpError(502, 'INVALID_AI_RESPONSE', 'Gemini referenced an unknown company policy.');
  }

  return {
    decision: payload.decision,
    answer: validateText(payload.answer, 'answer', 3000),
    supporting_policy_ids: [...new Set(policyIds)],
    missing_information: validateStringArray(payload.missing_information, 'missing information'),
    suggested_action: validateText(payload.suggested_action, 'suggested action', 500)
  };
}

const INJECTION_PATTERNS = [
  /\b(ignore|disregard|override|bypass)\b.{0,60}\b(previous|above|system|developer|policy|instruction|rules)\b/i,
  /\b(reveal|print|dump|show|repeat|expose)\b.{0,50}\b(system prompt|developer message|hidden prompt|api key|secret|environment variable)\b/i,
  /\b(system prompt|developer message|hidden instructions)\b.{0,40}\b(reveal|print|show|copy|repeat)\b/i
];

const CLEARLY_UNRELATED_PATTERNS = [
  /\b(write|generate|debug|review|explain|solve)\b.{0,50}\b(python|java|javascript|typescript|c\+\+|program|code|leetcode|algorithm|data structure)\b/i,
  /\b(leetcode|hackerrank|codeforces|programming assignment|coding interview|debug my code)\b/i,
  /\b(recipe|horoscope|election prediction|political campaign|religious debate|football score|cricket score)\b/i,
  /\b(diagnose|medical prescription|dosage|treat my illness|symptoms of)\b/i
];

const GREETING_PATTERN = /^(hi|hello|hey|good morning|good afternoon|good evening|thanks|thank you)[.! ]*$/i;

export function getDeterministicChatGuard(message) {
  const value = message.trim();

  if (INJECTION_PATTERNS.some((pattern) => pattern.test(value))) {
    return {
      decision: 'out_of_scope',
      answer: 'I can help with the selected real-estate lead, Northstar Homes demo policies and sales follow-up workflows. I cannot reveal internal instructions, secrets or hidden configuration.',
      supporting_policy_ids: [],
      missing_information: [],
      suggested_action: 'Ask a question about this lead or the approved sales policies.'
    };
  }

  if (CLEARLY_UNRELATED_PATTERNS.some((pattern) => pattern.test(value))) {
    return {
      decision: 'out_of_scope',
      answer: 'I am the PropIntel sales assistant. I can help with this real-estate lead, customer requirements, the demo company policies and sales follow-up preparation, but not unrelated general-purpose tasks.',
      supporting_policy_ids: [],
      missing_information: [],
      suggested_action: 'Ask a question related to the selected lead or its sales workflow.'
    };
  }

  if (GREETING_PATTERN.test(value)) {
    return {
      decision: 'allowed',
      answer: 'Hello. I can help you understand this lead, check the Northstar Homes demo policies, prepare a customer response or decide on a follow-up action. What would you like to review?',
      supporting_policy_ids: ['company_profile'],
      missing_information: [],
      suggested_action: 'Ask a question about the selected lead.'
    };
  }

  return null;
}
