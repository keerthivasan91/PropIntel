const NEXT_STEP_SIGNALS = [
  'visit', 'site visit', 'schedule', 'book', 'call me', 'arrange a call',
  'ready to buy', 'ready to proceed', 'meet', 'viewing'
];

const INFORMATION_SIGNALS = [
  'availability', 'price', 'pricing', 'floor plan', 'maintenance',
  'amenities', 'options', 'details', 'brochure', 'possession'
];

function includesAny(text, signals) {
  return signals.some((signal) => text.includes(signal));
}

function timelinePoints(timeline) {
  const value = String(timeline ?? '').trim().toLowerCase();

  if (value === 'immediately' || value.includes('within 2 months') || value.includes('within 1 month')) {
    return { score: 30, reason: 'Customer stated an immediate or near-term buying timeline.' };
  }
  if (value.includes('3 to 6 months') || value.includes('3-6 months')) {
    return { score: 22, reason: 'Customer stated a 3–6 month buying timeline.' };
  }
  if (value.includes('more than 6 months') || value.includes('over 6 months')) {
    return { score: 12, reason: 'Customer stated a longer-term buying timeline.' };
  }
  if (value.includes('explor')) {
    return { score: 5, reason: 'Customer is currently exploring options.' };
  }
  return { score: 0, reason: 'Buying timeline is unknown or not specific.' };
}

function budgetPoints(lead) {
  const hasMinimum = lead.budget_min !== null && lead.budget_min !== undefined && lead.budget_min !== '';
  const hasMaximum = lead.budget_max !== null && lead.budget_max !== undefined && lead.budget_max !== '';

  if (hasMinimum && hasMaximum) {
    return { score: 25, reason: 'Both minimum and maximum budget are provided.' };
  }
  if (hasMinimum || hasMaximum) {
    return { score: 12, reason: 'One budget boundary is provided.' };
  }
  return { score: 0, reason: 'No budget information has been provided.' };
}

function requirementPoints(lead) {
  const requirement = String(lead.property_requirement ?? '').trim();
  const message = String(lead.customer_message ?? '').trim();

  const words = requirement.split(/\s+/).filter(Boolean);
  const requirementScore = words.length >= 3 || /\d|bhk|villa|plot|apartment|duplex/i.test(requirement)
    ? 15
    : words.length > 0 ? 8 : 0;

  const messageScore = message.length >= 100 ? 10 : message.length >= 40 ? 5 : 0;
  return {
    score: requirementScore + messageScore,
    reason: requirementScore === 15
      ? 'Property requirement contains a specific type or multiple details.'
      : 'Property requirement is present but could be more specific.'
  };
}

function engagementPoints(lead) {
  const text = String(lead.customer_message ?? '').toLowerCase();
  const nextStep = includesAny(text, NEXT_STEP_SIGNALS);
  const information = includesAny(text, INFORMATION_SIGNALS);
  const score = (nextStep ? 12 : 0) + (information ? 8 : 0);

  let reason = 'No explicit next-step or actionable information request was detected.';
  if (nextStep && information) reason = 'Customer indicates a next step and requests actionable information.';
  else if (nextStep) reason = 'Customer message includes an explicit next-step signal.';
  else if (information) reason = 'Customer asks for specific property or process information.';

  return { score, reason };
}

export function calculateLeadScore(lead) {
  const timeline = timelinePoints(lead.buying_timeline);
  const budget = budgetPoints(lead);
  const requirement = requirementPoints(lead);
  const engagement = engagementPoints(lead);

  const total = timeline.score + budget.score + requirement.score + engagement.score;
  const priority = total >= 75 ? 'hot' : total >= 45 ? 'warm' : 'cold';

  return {
    lead_score: total,
    priority,
    score_breakdown: {
      timeline: { ...timeline, maximum: 30 },
      budget: { ...budget, maximum: 25 },
      requirement: { ...requirement, maximum: 25 },
      engagement: { ...engagement, maximum: 20 },
      total,
      maximum: 100,
      interpretation: 'Internal prioritization score only; it is not a probability of purchase.'
    }
  };
}
