# PropIntel deterministic lead scoring

The lead score is calculated by the backend. Gemini does not generate or modify the score.

The result is an internal prioritization aid out of 100. It is not a probability of purchase, a conversion forecast or a guarantee that a customer will buy.

## Components

| Component | Maximum | Rule |
|---|---:|---|
| Buying timeline | 30 | Immediately / within 2 months: 30; 3–6 months: 22; more than 6 months: 12; just exploring: 5; unknown: 0 |
| Budget clarity | 25 | Both minimum and maximum provided: 25; one boundary provided: 12; no budget: 0 |
| Requirement clarity | 25 | A specific property requirement: 15; a less specific non-empty requirement: 8; plus message detail: 10 for at least 100 characters, 5 for at least 40 characters, otherwise 0 |
| Engagement signals | 20 | Explicit next-step language (visit, schedule, book, call, meet, etc.): 12; a request for actionable property/process information (availability, price, floor plan, options, etc.): 8 |

## Priority bands

- Hot: 75–100
- Warm: 45–74
- Cold: 0–44

## Explainability

Each analysis stores a JSON score breakdown with points earned and maximum points for every component, a plain-language reason for each component, total points and the score interpretation disclaimer.

## Limitations

The scoring rules use the lead fields and a small set of explicit text signals. Keyword matching can miss context or misread negation. For example, “I do not want a site visit” contains a visit keyword. Salespeople should review the underlying lead and not treat the score as a decision. The rubric is an initial product heuristic and should be revisited using observed outcomes if real, appropriately governed data becomes available.
