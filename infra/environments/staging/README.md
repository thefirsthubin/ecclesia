# infra/environments/staging

AWS CDK stack parameters for the `staging` environment (Blueprint §11.2:
"Pre-production validation, including the RBAC executable spec... and
migration dry-runs... Anonymized/synthetic data resembling production
shape... Automatic on merge to `main`").

**Status: populated in the Production Infrastructure Foundation
milestone.** The actual configuration lives in `config.ts` (a typed
`EnvironmentConfig`, `../../lib/common/types.ts`), not in this README -
see `../../ENVIRONMENTS.md` for the full guide to what every field means
and how to change one.
