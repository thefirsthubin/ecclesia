#!/bin/sh
# Cloud Runtime Infrastructure milestone (Milestone 10) §5. Identical
# purpose/reasoning to apps/api/entrypoint.sh - see that file's own
# comment.
set -e

export DATABASE_URL="postgresql://${DB_MASTER_USER}:${DB_MASTER_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"
export APP_DATABASE_URL="postgresql://${DB_APP_USER}:${DB_APP_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"

exec "$@"
