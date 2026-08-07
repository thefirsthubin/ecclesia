# Cloud Runtime Infrastructure milestone (Milestone 10) §4. Container image
# for apps/api, built via `ecs.ContainerImage.fromAsset()`
# (`infra/lib/constructs/fargate-service.construct.ts`).
#
# Build context is the REPO ROOT, not this directory - see
# `infra/lib/stacks/api-service-stack.ts`'s own comment on why
# (`imageAssetDirectory`/`dockerfile` there). An Nx monorepo build needs
# `pnpm-lock.yaml`, `nx.json`, `tsconfig.base.json`, every `libs/*` this
# app imports by path mapping, and `db/schema.prisma` all reachable from
# the build context - none of which exist inside `apps/api/` alone.
# `.dockerignore` at the repo root keeps that context to what a build
# actually needs (excludes `node_modules`, `.git`, `dist`, `coverage`).
#
# `node:20-bookworm-slim` (Debian, not Alpine) in **both** stages - not a
# style preference. `db/schema.prisma`'s `generator client` block declares
# no `binaryTargets` (protected file - "Existing Prisma Schema" is `DO NOT
# MODIFY`), so Prisma generates only the `native` engine binary matching
# whatever OS/libc ran `prisma generate`. Running that step inside this
# same Debian-based builder stage, and copying its output into a
# Debian-based runtime stage, means the "native" binary Prisma picked is
# already correct for the container that runs it - zero schema changes
# required. Alpine's musl libc is a well-known, frequently-hit Prisma
# incompatibility specifically because its binary target differs from
# Debian/Ubuntu's glibc - sidestepped entirely by not using it, rather than
# worked around after the fact.
#
# `[Disclosed limitation]` This Dockerfile has not been built in this
# sandbox - no Docker daemon is available here (`docker --version` fails).
# See `INFRA_RUNTIME.md`'s verification section for exactly what this
# means and what a real `docker build`/`cdk deploy` run needs to confirm.

FROM node:20-bookworm-slim AS builder

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /workspace
COPY . .

RUN pnpm install --frozen-lockfile
RUN npx prisma generate --schema=db/schema.prisma
RUN npx nx build api --configuration=production

FROM node:20-bookworm-slim AS runtime

# Prisma's query engine binary needs OpenSSL at runtime on Debian-based
# images - not present by default in the -slim variant.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# `generatePackageJson: true` (apps/api/webpack.config.js) produces a
# package.json in the build output listing only the external dependencies
# this app's build actually needs - `npm install` below resolves those
# fresh, standard for this Nx "deployable Node app" output shape.
COPY --from=builder /workspace/dist/apps/api/ ./
RUN npm install --omit=dev

# Overlays the REAL, schema-generated Prisma client/engine (produced
# against db/schema.prisma in the builder stage above) on top of the
# generic @prisma/client `npm install` just fetched from the registry -
# see this file's own top comment on why both stages share the same base
# image for this to be valid.
COPY --from=builder /workspace/node_modules/.prisma ./node_modules/.prisma

# `[Added for real deploy operability]` RDS lives in isolated subnets
# (`network.construct.ts`) - unreachable from a laptop, and this image
# doesn't self-migrate on boot (entrypoint.sh only composes env vars and
# execs the given command). The real way to run `prisma migrate deploy`
# is a one-off `aws ecs run-task` against this same task definition/image,
# from inside the VPC, with the container command overridden - see
# `infra/DEPLOYMENT.md`'s migration step. That requires two things this
# image didn't otherwise ship: the Prisma CLI itself (`prisma` is a
# devDependency, stripped by `npm install --omit=dev` above - `--no-save`
# keeps it out of package.json, pinned to match `@prisma/client`'s own
# version so CLI and generated client agree) and the actual migration SQL
# files (`db/migrations/` - the webpack build only emits the generated
# client, not the raw migrations Prisma's CLI needs to read).
RUN npm install --no-save prisma@^5.20.0
COPY db/schema.prisma ./db/schema.prisma
COPY db/migrations ./db/migrations

COPY apps/api/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

ENV NODE_ENV=production
EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "main.js"]
