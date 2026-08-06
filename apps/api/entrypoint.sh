#!/bin/sh
# Cloud Runtime Infrastructure milestone (Milestone 10) §4.
#
# Composes DATABASE_URL/APP_DATABASE_URL from the individual pieces
# infra/lib/stacks/api-service-stack.ts injects (plain env vars for
# host/port/dbname/usernames, ECS `secrets` for the two passwords) - see
# that stack's own top doc comment for why this composition can't happen
# inside the ECS task definition itself (its `secrets` field maps one
# Secrets Manager JSON key to one whole env var, it cannot template
# multiple sources into one composed value).
#
# `sslmode=require` matches database-stack.ts's own parameter group
# (`rds.force_ssl=1`, Milestone 10 §2's "SSL required") - a connection
# string without it would be rejected by the database at the engine level.
set -e

export DATABASE_URL="postgresql://${DB_MASTER_USER}:${DB_MASTER_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"
export APP_DATABASE_URL="postgresql://${DB_APP_USER}:${DB_APP_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"

exec "$@"
