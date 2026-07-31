# apps/api

The Ecclesia API service: a modular monolith (Blueprint ADR-001) exposing
one NestJS module per bounded context (Blueprint Ch.1 §4.2 / Ch.2 §6.4):
`people`, `pastoral-care`, `ministry`, `gatherings`, `stewardship`,
`insights`, `platform`.

**Status:** registered as a real Nx project (Sprint 0 Milestone 2): compiles, lints, and tests via `nx build/lint/test api`. Only a placeholder root controller exists (Blueprint §11.1 - ECS Fargate is the eventual deployment target); no bounded-context modules, database connection, or authentication yet, per this milestone's scope.
