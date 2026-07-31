# libs/domain/stewardship

Framework-agnostic business logic for Stewardship (PRD §13.5): the
Financial Transaction state machine (PRD §12.7), separation-of-duties
rules (BR-STW-01 through BR-STW-11).

Depends only on `@ecclesia/contracts`. Authorization guards that consume
this library's rules (e.g. the same-actor-verification check, Blueprint
§9.4) live in `apps/api`'s `stewardship` module, not here.

**Status:** registered as a real Nx project (Sprint 0 Milestone 2), building and testing cleanly. Real domain logic lands in the Stewardship domain-modeling milestone.
