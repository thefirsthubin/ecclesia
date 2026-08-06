# libs/domain/insights

Framework-agnostic business logic for Insights (PRD §13.6): the Church
Pulse weighted-scoring model (PRD §12.8). Consumes only the Engagement
Signal shape defined in `@ecclesia/contracts` - never another domain's
repositories directly (Blueprint Ch.1 §4.3 rule 3, Ch.4 §5).

## Contents

- **`church-pulse-scoring.ts`** - BR-INS-01's weighted composite score.
  `CHURCH_PULSE_SIGNAL_TYPES` (the six `[PRD-DERIVED]` Engagement Signal
  source types from §12.8's flowchart), `DEFAULT_CHURCH_PULSE_WEIGHTS`
  (OQ-10's resolved equal-sixths provisional placeholder),
  `computeCategoryScore()` (raw signal count -> 0-100 sub-score, an
  `[INFERRED - PROVISIONAL]` linear-to-10 formula disclosed as a genuine
  specification gap, not a citation), and `computeChurchPulseScore()`
  (the defensively-normalized weighted average, guaranteeing BR-INS-01's
  "must not be reducible to attendance alone" property).

- **`pulse-trend.ts`** - FR-INS-03's decline-alert evaluation.
  `DEFAULT_PULSE_TREND_WINDOW_DAYS` (21, `[PRD-DERIVED]` from §11.2's
  Pastor Emmanuel "15 points over 3 weeks" scenario),
  `DEFAULT_PULSE_DECLINE_THRESHOLD_POINTS` (10, `[INFERRED - PROVISIONAL]`
  - no PRD text supplies a threshold number), and `evaluatePulseTrend()`,
  which compares the earliest `PulseScoreHistory` point within the
  trailing window against the latest point.

Both provisional constants are disclosed in
`apps/api/src/modules/insights/INSIGHTS_DESIGN_NOTES.md` once that module
lands, in the same spirit as OQ-10's own "provisional... pending
calibration" framing.

**Deliberately out of scope here (NFR-PRIV-02):** Person-level Church
Pulse scoring. This module's functions are agnostic to what a "subject"
is - the hard gate is enforced one layer up, in
`apps/api/src/modules/insights/services/pulse-score.service.ts`, which
must never invoke these functions for a Person-scoped subject until a
separate access-control review is complete.

**Status:** real domain logic (Sprint: Insights domain), building and
testing cleanly. The apps/api module consuming these functions is the
next layer; the real EventBridge/SQS Engagement Signal ingestion pipeline
described in Blueprint Ch.4 that would populate `EngagementSignal` rows
from the other four domains does not exist yet anywhere in this project -
see `INSIGHTS_DESIGN_NOTES.md` for the disclosed gap.
