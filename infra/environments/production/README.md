# infra/environments/production

AWS CDK stack parameters for the `production` environment (Blueprint
§11.2: "Full congregation-wide operation... Real production data...
Manual promotion from `pilot`").

**Status: populated in the Production Infrastructure Foundation
milestone.** The actual configuration lives in `config.ts` (a typed
`EnvironmentConfig`, `../../lib/common/types.ts`), not in this README -
see `../../ENVIRONMENTS.md` for the full guide to what every field means
and how to change one.

**Known gap, disclosed:** this file previously described including "the
pilot-cohort configuration referenced in PRD §22.2." Blueprint §11.2's
`pilot` environment is a distinct environment from `production` (a
real-but-scoped subset of River of Life Cathedral's own Branch, running
the staged-rollout plan PRD §22.2 describes), not a configuration flag
inside `production`. This milestone's own brief named exactly three
environments (Development, Staging, Production) - `pilot` is not modeled
as a fourth `EnvironmentName` here. See
`../../INFRASTRUCTURE_DESIGN_NOTES.md` §7 for the full disclosure and how
small the gap is to close later.
