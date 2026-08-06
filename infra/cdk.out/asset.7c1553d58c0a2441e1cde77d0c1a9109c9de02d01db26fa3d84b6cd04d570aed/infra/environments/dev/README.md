# infra/environments/dev

AWS CDK stack parameters for the `dev` environment (Blueprint §11.2:
"Individual developer / feature-branch integration testing... Synthetic
seed data only... Automatic on push to any feature branch").

**Status: populated in the Production Infrastructure Foundation
milestone.** The actual configuration lives in `config.ts` (a typed
`EnvironmentConfig`, `../../lib/common/types.ts`), not in this README -
see `../../ENVIRONMENTS.md` for the full guide to what every field means
and how to change one.
