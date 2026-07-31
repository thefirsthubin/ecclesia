# Ecclesia — Church Operating System

Nx monorepo implementing the system specified in the **Ecclesia PRD (v1.0)**
and the **Ecclesia Technical Blueprint / PTB v2.0 (v1.0)**. Those two
documents, plus the **PRD Open Questions Resolution Workshop**, are the only
source of truth for product and architectural decisions; this repository
implements them and must not silently diverge from them. If code and
documentation disagree, that is a bug in one of the two — raise it, don't
pick a side quietly.

## Current status

**Sprint 0 — Engineering Foundation, Milestone 1 of N.** No application code
exists yet. This milestone establishes the repository's tooling substrate:
package manager, monorepo graph, TypeScript configuration, linting
(including module-boundary enforcement), formatting, and commit hygiene.
Subsequent milestones add the NestJS API, the background Worker, the React
Native and React Admin clients, Prisma/PostgreSQL, authentication, CI/CD,
and CDK infrastructure — each one incrementally, each one verified before
the next begins.

## Prerequisites

| Tool | Version | Why |
|---|---|---|
| Node.js | 22.x (see `.nvmrc`) | Runtime |
| pnpm | ≥ 9.0 (via Corepack) | Package manager (Blueprint ADR-002) |

```bash
# Enable Corepack and pin the pnpm version declared in package.json
corepack enable
corepack prepare pnpm@9.12.0 --activate
```

## Getting started

```bash
pnpm install       # installs dependencies and runs `prepare` (Husky hooks)
pnpm build         # nx run-many --target=build --all (no-op until apps/libs exist)
pnpm lint          # nx run-many --target=lint --all
pnpm test          # nx run-many --target=test --all
pnpm format:check  # prettier --check .
```

> **A note on this environment.** These files were authored in a sandboxed
> session with no outbound access to npm, GitHub, or any package registry —
> every config file here was hand-verified for syntactic correctness, but
> `pnpm install` / `nx build` / `nx lint` have not been executed against a
> real dependency tree. Run the commands above on your machine (or let CI
> run them on push) as the first real build/lint gate, and report back
> anything that doesn't pass before we proceed to Milestone 2.

## Repository layout

This layout mirrors Blueprint Chapter 2, §6.2 exactly — each directory's
own `README.md` states its purpose, which PRD/Blueprint section it
implements, and which future milestone populates it.

```
apps/
  api/          NestJS modular monolith (Blueprint ADR-001)
  worker/       Background worker: Church Pulse, notifications, sweeps
  mobile/       React Native (Shepherds, Basonta Leaders, Treasurers, Members)
  web-admin/    React (Resident Pastor, Assistant Pastors, Admins)
libs/
  domain/       Framework-agnostic business logic, one lib per bounded context
    people/
    pastoral-care/
    ministry/
    gatherings/
    stewardship/
    insights/
  contracts/    Shared DTOs / Zod schemas (Blueprint §6.3)
  rbac/         Permission matrix as code + guard primitives (Blueprint §9.3-9.4)
  config/       Typed configuration loading (Blueprint §6.2)
  testing/      Shared fixtures/factories (Blueprint §14.2)
infra/          AWS CDK (Blueprint Ch.5)
db/
  migrations/   Prisma migration history (Blueprint §7.6)
```

## Module boundaries

`eslint.config.mjs` enforces the dependency-direction rules from Blueprint
§4.3 and §5.2 via `@nx/enforce-module-boundaries`: a domain library may
depend only on `libs/contracts`, never on another domain library or on
`libs/rbac` directly; applications may depend on anything. This is checked
in CI on every pull request, not left to code-review discipline alone.

## Commit conventions

Commits follow [Conventional Commits](https://www.conventionalcommits.org/),
enforced by Commitlint (`commitlint.config.js`) via the `commit-msg` Husky
hook. Scopes are restricted to the module/app inventory above plus a small
set of infrastructure scopes (`ci`, `deps`, `repo`, `infra`, `db`) — see
`commitlint.config.js` for the exact list. Example:

```
feat(stewardship): enforce same-actor check on transaction verification

Implements FR-STW-03, BR-STW-04 (PRD §13.5, §15.5): a Treasurer may not
verify a transaction they personally recorded.
```
