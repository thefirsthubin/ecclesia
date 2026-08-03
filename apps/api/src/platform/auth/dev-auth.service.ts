import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';

import { PrismaRootService } from '../database/prisma-root.service';
import type { DevUserSeed } from './dev-users';
import { DEV_USER_SEEDS } from './dev-users';
import type { TokenVerifierService, VerifiedTokenPayload } from './token-verifier.interface';

/**
 * Development Authentication sprint - STEP 3's "Development Identity
 * Provider." Only ever constructed when `AUTH_MODE=development`
 * (`auth.module.ts` conditionally registers this provider at all - see
 * that file's own comment); this class does not itself re-check the mode.
 *
 * Issues and verifies a **development access token** - a small,
 * self-signed, non-Cognito artifact standing in for the real thing.
 * Deliberately not a real JWT (no `jsonwebtoken`/`jose` dependency added -
 * the sprint brief says "no external dependencies," and Node's own
 * `node:crypto` HMAC already gives genuine signature verification and
 * expiry, the two properties that actually matter here): `<base64url
 * payload>.<base64url HMAC-SHA256 signature>`, where the payload is
 * `{ sub, iat, exp }`. `sub` is always one of `DEV_USER_SEEDS`' `id`
 * values, which - by construction (`db/seed-dev-users.ts`) - is also that
 * seeded user's real `platform.users.cognito_sub`. That single fact is
 * what makes this a genuine `TokenVerifierService`, not a shortcut:
 * `verifyAccessToken()` returns exactly the shape `CognitoVerifierService`
 * does (`{ sub }`), and `AuthGuard` feeds that `sub` into the *same*
 * `ActorContextResolverService.resolve()` call it always has - the
 * Person/RoleAssignment/RBAC lookup is completely unaware a development
 * token, not a Cognito one, produced the identity it's resolving (STEP 7:
 * "No shortcuts. The only difference is the identity source.").
 *
 * `DEV_TOKEN_SECRET` is a fixed, non-configurable, non-secret constant -
 * not read from an environment variable. There is nothing to protect: this
 * service is structurally unreachable in production
 * (`assertAuthModeIsSafe()`/`auth.module.ts` never construct it there),
 * and even a forged token can never grant more than the RBAC system
 * already permits the specific seeded persona it names - the same
 * authorization pipeline (`ActorContextResolverService`, `RbacGuard`,
 * every permission-matrix row) still runs in full. A stronger secret would
 * protect against nothing a weaker one doesn't already equally not need
 * to protect against.
 */
const DEV_TOKEN_SECRET = 'ecclesia-development-mode-token-signing-key-not-a-secret';
const DEV_TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours - a full local dev session, no refresh flow needed (STEP 6 has no MFA/refresh either).

interface DevTokenPayload {
  sub: string;
  iat: number;
  exp: number;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(payload: DevTokenPayload): string {
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac('sha256', DEV_TOKEN_SECRET).update(body).digest('base64url');
  return `${body}.${signature}`;
}

@Injectable()
export class DevAuthService implements TokenVerifierService {
  // `[Row-Level Security sprint]` `PrismaRootService`, not `PrismaService` -
  // both methods below look a user up by `cognitoSub` before any
  // `ActorContext`/`branchId` exists to scope by, the same bootstrap case
  // `ActorContextResolverService` is in. See `PrismaRootService`'s own doc
  // comment for the full reasoning.
  constructor(private readonly prisma: PrismaRootService) {}

  /** `GET /auth/dev/users` (`DevAuthController`) - only lists a seeded
   * persona if its `platform.users` row actually exists yet, so a
   * developer who hasn't run `pnpm db:seed:dev` sees an empty list (and a
   * clear message client-side) rather than a picker full of users that
   * will 401 on login. */
  async listAvailableUsers(): Promise<DevUserSeed[]> {
    const seededSubs = await this.prisma.user.findMany({
      where: { cognitoSub: { in: DEV_USER_SEEDS.map((seed) => seed.id) } },
      select: { cognitoSub: true },
    });
    const seededSet = new Set(seededSubs.map((row) => row.cognitoSub));
    return DEV_USER_SEEDS.filter((seed) => seededSet.has(seed.id));
  }

  /** `POST /auth/dev/login` (`DevAuthController`). Validates `devUserId`
   * against the fixed roster (never mints a token for an arbitrary
   * client-supplied string) *and* confirms the row is actually seeded,
   * for the same clear-error-over-confusing-401 reason `listAvailableUsers`
   * checks it too. */
  async issueTokenFor(devUserId: string): Promise<{ accessToken: string; expiresIn: number }> {
    const seed = DEV_USER_SEEDS.find((candidate) => candidate.id === devUserId);
    if (!seed) {
      throw new NotFoundException(`Unknown development user id "${devUserId}"`);
    }
    const user = await this.prisma.user.findUnique({ where: { cognitoSub: seed.id } });
    if (!user) {
      throw new NotFoundException(
        `Development user "${seed.label}" is not seeded yet - run "pnpm db:seed:dev" and try again.`,
      );
    }

    const now = Date.now();
    const payload: DevTokenPayload = { sub: seed.id, iat: now, exp: now + DEV_TOKEN_TTL_MS };
    return { accessToken: sign(payload), expiresIn: DEV_TOKEN_TTL_MS / 1000 };
  }

  /** `TokenVerifierService.verifyAccessToken` - the `AuthGuard`-facing
   * half. Verifies the HMAC signature (constant-time comparison, same
   * "don't leak timing information" hygiene any signature check should
   * have) and expiry, then returns `{ sub }` - identical in shape to
   * `CognitoVerifierService.verifyAccessToken()`'s return value, per this
   * interface's own doc comment. */
  async verifyAccessToken(token: string): Promise<VerifiedTokenPayload> {
    const [body, signature] = token.split('.');
    if (!body || !signature) {
      throw new UnauthorizedException('Malformed development token');
    }

    const expectedSignature = createHmac('sha256', DEV_TOKEN_SECRET).update(body).digest('base64url');
    const provided = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      throw new UnauthorizedException('Invalid development token signature');
    }

    let payload: DevTokenPayload;
    try {
      payload = JSON.parse(base64UrlDecode(body)) as DevTokenPayload;
    } catch {
      throw new UnauthorizedException('Malformed development token payload');
    }

    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) {
      throw new UnauthorizedException('Development token has expired');
    }
    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
      throw new UnauthorizedException('Malformed development token payload');
    }

    return { sub: payload.sub };
  }
}
