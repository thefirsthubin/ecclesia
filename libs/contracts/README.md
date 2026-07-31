# libs/contracts

Shared DTOs and Zod schemas (Blueprint §6.3): the single source of truth
for API request/response shapes and the Engagement Signal envelope
(Blueprint §10.3), consumed by `apps/api`, `apps/worker`, `apps/mobile`,
and `apps/web-admin` alike. A leaf library - depends on nothing else in
the workspace.

**Status:** scaffolded in the milestone that introduces the first shared
DTO (alongside `apps/api`).
