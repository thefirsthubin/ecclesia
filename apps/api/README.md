# apps/api

The Ecclesia API service: a modular monolith (Blueprint ADR-001) exposing
one NestJS module per bounded context (Blueprint Ch.1 §4.2 / Ch.2 §6.4):
`people`, `pastoral-care`, `ministry`, `gatherings`, `stewardship`,
`insights`, `platform`.

**Status:** scaffolded in Sprint 0 Milestone 2 (Blueprint §11.1 - ECS Fargate
is the eventual deployment target; locally this runs as a plain Nest app).
Not yet generated as an Nx project.
