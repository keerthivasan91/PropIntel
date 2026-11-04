import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLeadScore } from '../src/services/scoring.service.js';

const baseLead = {
  property_requirement: '3BHK apartment',
  location: 'Whitefield, Bengaluru',
  budget_min: 9000000,
  budget_max: 12000000,
  buying_timeline: 'Within 2 months',
  customer_message: 'Looking for a 3BHK apartment close to schools and good connectivity. Please share available options and arrange a site visit.'
};

test('calculates a transparent score from deterministic rules', () => {
  const result = calculateLeadScore(baseLead);

  assert.equal(result.lead_score, 100);
  assert.equal(result.priority, 'hot');
  assert.equal(result.score_breakdown.timeline.score, 30);
  assert.equal(result.score_breakdown.budget.score, 25);
  assert.equal(result.score_breakdown.requirement.score, 25);
  assert.equal(result.score_breakdown.engagement.score, 20);
});

test('unknown timeline and budget do not receive positive points', () => {
  const result = calculateLeadScore({
    ...baseLead,
    buying_timeline: 'Not specified',
    budget_min: null,
    budget_max: null,
    customer_message: 'I am looking at property.'
  });

  assert.equal(result.score_breakdown.timeline.score, 0);
  assert.equal(result.score_breakdown.budget.score, 0);
  assert.ok(result.lead_score < 45);
  assert.equal(result.priority, 'cold');
});

test('one budget boundary receives partial budget points', () => {
  const result = calculateLeadScore({
    ...baseLead,
    budget_min: null,
    budget_max: 10000000
  });

  assert.equal(result.score_breakdown.budget.score, 12);
});

test('longer buying timelines score below near-term timelines', () => {
  const nearTerm = calculateLeadScore(baseLead);
  const longerTerm = calculateLeadScore({
    ...baseLead,
    buying_timeline: 'More than 6 months'
  });

  assert.ok(nearTerm.lead_score > longerTerm.lead_score);
  assert.equal(longerTerm.score_breakdown.timeline.score, 12);
});

test('lead score is explicitly not a purchase probability', () => {
  const result = calculateLeadScore(baseLead);
  assert.match(result.score_breakdown.interpretation, /not a probability/i);
});
