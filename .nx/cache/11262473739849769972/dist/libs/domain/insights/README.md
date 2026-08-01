# libs/domain/insights

Framework-agnostic business logic for Insights (PRD §13.6): the Church
Pulse weighted-scoring model (PRD §12.8). Consumes only the Engagement
Signal shape defined in `@ecclesia/contracts` - never another domain's
repositories directly (Blueprint Ch.1 §4.3 rule 3, Ch.4 §5).

**Status:** registered as a real Nx project (Sprint 0 Milestone 2), building and testing cleanly. Real domain logic lands once apps/worker's Engagement Signal consumer exists.
