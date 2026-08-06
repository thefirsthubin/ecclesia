# Cloud Runtime Infrastructure milestone (Milestone 10) §5. Container image
# for apps/worker - mirrors apps/api/Dockerfile exactly (same repo-root
# build context reasoning, same Debian-not-Alpine Prisma reasoning - see
# that file's own top comment, not re-litigated here).
#
# One image, three services (`infra/lib/stacks/worker-service-stack.ts`'s
# own doc comment on why): `command` is overridden per ECS service
# (`consume:insights`/`consume:notification`/`consume:audit`), not baked
# into this image - matches `apps/worker/src/command.ts`'s own
# container-per-command deployment shape.
#
# `[Disclosed limitation]` Same as apps/api/Dockerfile - not built in this
# sandbox (no Docker daemon available).

FROM node:20-bookworm-slim AS builder

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /workspace
COPY . .

RUN pnpm install --frozen-lockfile
RUN npx prisma generate --schema=db/schema.prisma
RUN npx nx build worker --configuration=production

FROM node:20-bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /workspace/dist/apps/worker/ ./
RUN npm install --omit=dev

COPY --from=builder /workspace/node_modules/.prisma ./node_modules/.prisma

COPY apps/worker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

ENV NODE_ENV=production

ENTRYPOINT ["./entrypoint.sh"]
# No default command argument - apps/worker/src/command.ts's
# parseCommand() throws "Unknown or missing worker command" without one,
# by design (fail fast rather than silently no-op). ECS's per-service
# `command` override (WorkerServiceStack) always supplies the real one.
CMD ["node", "main.js"]
