# libs/domain/insights

Framework-agnostic business logic for Insights (PRD §13.6): the Church
Pulse weighted-scoring model (PRD §12.8). Consumes only the Engagement
Signal shape defined in `@ecclesia/contracts` - never another domain's
repositories directly (Blueprint Ch.1 §4.3 rule 3, Ch.4 §5).

**Status:** scaffolded once `apps/worker`'s consumer skeleton exists.
Initial Church Pulse weights ship as an explicitly provisional placeholder
pending PRD OQ-10 (see PRD §24).
