# Ecclesia Engineering Principles

**Status:** Sprint 0.3 (Engineering Standards). This document is the codebase's constitution — the standard a pull request is actually reviewed against, distinct from (but derived from) the *Ecclesia PRD* and *Technical Blueprint*. Those two documents state what to build and how to architect it; this one states how we write and change the code, every day, for years.

Every principle below states what it means concretely, and the failure mode it exists to prevent — a principle nobody can point to a violation of is not enforceable, it's decoration.

---

## 1. Ministry First

**Statement.** No technical decision is justified by engineering convenience alone. Every change should be traceable, directly or indirectly, to a requirement, business rule, or persona need in the PRD.

**In practice.** A pull request description should be able to answer "why does this exist" by citing a PRD/Blueprint section or issue, not just "seemed like a good idea." Refactors and infrastructure work are the exception that proves the rule — they're justified by *enabling* ministry-facing work faster or more safely later, and that justification should be stated too, not assumed.

**Prevents.** Feature creep and gold-plating: building the technically interesting version of something instead of the version PRD §6 actually calls for. It is why Sprint 0 itself has stayed disciplined — CI/CD, tooling, and standards, not a single business feature, because that's genuinely what unblocks everything else.

---

## 2. Domain Language is Sacred

**Statement.** Code uses the PRD's own vocabulary — `Bacenta`, `Basonta`, `Shepherd`, `Poimen`, `SilentDrift` — never a genericized synonym (`SmallGroup`, `Team`, `LeaderRole`, `EngagementRiskFlag`).

**In practice.** Blueprint §14.1 states this as a coding standard, and Sprint 0 Milestone 2 already follows it: `libs/domain/pastoral-care`, not `libs/domain/small-groups`. Reviewers should reject a rename that "cleans up" domain terms into generic technical nouns, even when the generic name feels more conventional to someone arriving from a different codebase.

**Prevents.** The specific failure this codebase was built to avoid (PRD §5.3): a translation layer between how the church actually thinks and how the software is organized. That gap is where requirements get silently misunderstood.

---

## 3. Architecture Before Convenience

**Statement.** The bounded-context boundaries and dependency rules in Blueprint §4.3 and §5.2 are enforced by tooling (`@nx/enforce-module-boundaries`, `project.json` tags), not by asking people to remember them.

**In practice.** If a domain library "just needs" to import another domain library directly to unblock a deadline, that is a signal the orchestration belongs in `apps/api`'s module layer instead — not a reason to add an ESLint override. Exceptions to the dependency-constraint rules require a documented ADR update (Blueprint §15.1 style), not a one-line `eslint-disable`.

**Prevents.** The exact kind of unmanaged coupling that turns a modular monolith (ADR-001) into a distributed monolith with all of a monolith's coupling and none of a monolith's simplicity.

---

## 4. Simplicity Over Cleverness

**Statement.** Prefer the boring, explicit, well-understood solution over the clever one — explicit `project.json` targets over relying purely on inferred magic, a modular monolith over microservices at this scale (ADR-001), a plain Node app for the Worker instead of a framework it doesn't need.

**In practice.** A reviewer should be suspicious of code that requires the author to explain a trick before the logic makes sense. If a comment says "this is a bit unusual, but—", that's usually a sign to find the ordinary way to do it instead.

**Prevents.** The specific long-term cost of cleverness: it reads fast the day it's written and slow every day after, by someone who wasn't in the room when it was written — which, over a multi-year codebase, is almost everyone, including its original author.

---

## 5. Security by Default

**Statement.** The default configuration is the secure one. Separation of duties is enforced at the service layer, not the UI (NFR-SEC-02); Row-Level Security is a backstop under application-layer filtering, not a replacement for it (Blueprint §7.3); privileged roles require MFA by default (NFR-SEC-03); denials are logged as rigorously as approvals (§9.6).

**In practice.** A new endpoint or mutation is insecure until proven otherwise — the burden of proof is on demonstrating an authorization check exists and is tested, not on someone else noticing its absence. "We'll add auth later" is not an acceptable state for anything that touches Stewardship or People data, even in a scaffold.

**Prevents.** The quiet accumulation of "temporary" open endpoints that are still open eighteen months later because nothing forced anyone to close them.

---

## 6. Test Everything

**Statement.** Every project has testing configured from the moment it's created (Sprint 0 Milestone 2), not bolted on once "real" logic arrives. The RBAC permission matrix (PRD §17.3) is a test oracle, not just documentation (Blueprint §9.5) — a generated suite asserts every cell.

**In practice.** Even a scaffold module's test should verify something real about the toolchain, not `expect(true).toBe(true)`. A pull request that adds a business rule without a test for that rule doesn't meet Definition of Done (Blueprint §14.3) — full stop, regardless of how obviously correct the code looks.

**Prevents.** The gap between "it compiled" and "it works," which is exactly where the silent failures this whole product exists to prevent (PRD §4) tend to live in software, not just in pastoral care processes.

---

## 7. Backward Compatibility

**Statement.** The API is versioned at the path level (`/v1/...`) from the very first endpoint (Blueprint §14.7), even before a second version is conceivable. Database migrations follow expand-contract (Ch.5 §11.5): add the new shape, migrate consumers, remove the old shape in a later release — never a single destructive step. Event schemas evolve additively; a breaking change gets a new `schemaVersion`, not a silent redefinition (Blueprint §10.3).

**In practice.** "We can just change the field" is a question, not an answer: who else reads that field, and have they migrated yet? Mobile clients in particular (per the OTA strategy, Blueprint §11.8) may lag behind the latest API release in the field — compatibility isn't optional because "everyone will just update."

**Prevents.** A production incident where an internal refactor becomes an external outage because something not obviously "public" turned out to be depended on anyway.

---

## 8. Leave the Code Better Than You Found It

**Statement.** Every commit that implements a PRD requirement cites its ID in the commit message and, at the enforcement point, in a code comment (Blueprint §14.4) — so the engineer reading it in three years doesn't need to have been in this conversation to know *why* a rule exists. Documentation, tests, and the code they describe change together, in the same pull request, not as a follow-up ticket that never gets picked up.

**In practice.** If a change makes an existing README, ADR, or this document itself stale, updating it is part of the change, not a separate task. Small, unrelated improvements noticed along the way (a misleading name, a missing test, a stale comment) are welcome inside a focused pull request, as long as they don't obscure the actual diff being reviewed.

**Prevents.** The specific, slow decay where a codebase's documentation and its actual behavior quietly drift apart until nobody trusts either — which is the opposite of what a document like this one is for.

---

## How this document is enforced, not just stated

| Principle | Enforcement mechanism |
|---|---|
| Ministry First | Pull request template / review checklist references a PRD/Blueprint section |
| Domain Language is Sacred | Code review; naming conventions match the PRD glossary (PRD §25) |
| Architecture Before Convenience | `@nx/enforce-module-boundaries` in `eslint.config.mjs`, checked in CI |
| Simplicity Over Cleverness | Code review; explicit `project.json` over inferred-only config (Sprint 0 Milestone 2 precedent) |
| Security by Default | RBAC executable specification (Blueprint §9.5); denial audit logging (§9.6) |
| Test Everything | `nx affected --target=test` on every pre-push (`.husky/pre-push`) and in CI |
| Backward Compatibility | API versioning and migration conventions reviewed explicitly for any schema/contract change |
| Leave the Code Better Than You Found It | Definition of Done (Blueprint §14.3); commit-message traceability convention (`commitlint.config.js`) |

This table is itself subject to principle 8: if an enforcement mechanism listed here stops being true, fix the mechanism or fix this document — don't leave it quietly wrong.
