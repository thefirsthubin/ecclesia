import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import type { CognitoAccessTokenPayload } from 'aws-jwt-verify/jwt-model';

import type { EnvConfig } from '../config/env.schema';

/**
 * Verifies AWS Cognito-issued access tokens (Sprint 1.4, Blueprint §8.1
 * ADR-004 / §8.3). `apps/api` is a pure OIDC resource server per §8.1's
 * own words ("integrated ... via standard OIDC/JWT validation
 * middleware") - it never issues or refreshes tokens itself; Cognito does
 * that directly with the client. This service's only job is verifying a
 * token presented on an incoming request.
 *
 * `tokenUse: 'access'` (not `'id'`) because Blueprint §8.3's token table
 * is explicit that the *access token* is "presented on every API
 * request" - the ID token (identity claims for client-side display) is
 * never sent to the API.
 *
 * Uses `aws-jwt-verify` (AWS Labs' own lightweight verification library)
 * rather than the full AWS SDK - it does exactly one thing (fetch the
 * User Pool's JWKS, cache it, verify signature/expiry/issuer/audience)
 * with no other AWS credentials or SDK surface needed, matching the
 * "standard OIDC/JWT validation middleware" framing in §8.1 precisely.
 */
@Injectable()
export class CognitoVerifierService {
  private readonly verifier: ReturnType<typeof CognitoJwtVerifier.create>;

  constructor(configService: ConfigService<EnvConfig, true>) {
    const userPoolId = configService.get('COGNITO_USER_POOL_ID', { infer: true });
    const clientId = configService.get('COGNITO_CLIENT_ID', { infer: true });
    const region = configService.get('COGNITO_REGION', { infer: true });

    // Defensive cross-check, not something aws-jwt-verify itself needs:
    // CognitoJwtVerifier derives the JWKS region from the User Pool ID's
    // own `<region>_<poolId>` prefix (Cognito's ID format), so
    // COGNITO_REGION isn't consumed for verification - but a mismatch
    // between the two configured values is a real, catchable
    // misconfiguration worth failing fast on at boot rather than only
    // surfacing as confusing token-verification failures later.
    if (!userPoolId.startsWith(`${region}_`)) {
      throw new Error(
        `COGNITO_REGION ("${region}") does not match the region prefix of COGNITO_USER_POOL_ID ("${userPoolId}")`,
      );
    }

    this.verifier = CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: 'access',
      clientId,
    });
  }

  /**
   * Verifies signature, expiry, issuer, `token_use: 'access'`, and
   * `client_id` (Blueprint §8.3). Throws on any failure - callers (the
   * `AuthGuard`) translate that into a 401, never treat a verification
   * error as "no opinion."
   */
  async verifyAccessToken(token: string): Promise<CognitoAccessTokenPayload> {
    try {
      // Asserted, not inferred: passing `tokenUse: 'access'` at
      // construction guarantees this payload shape at runtime, but
      // exactly how TypeScript resolves aws-jwt-verify's overloaded
      // `.create()`/`.verify()` return types can vary by version - this
      // assertion reflects known runtime behavior, not a guess.
      return (await this.verifier.verify(token)) as CognitoAccessTokenPayload;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token verification failed';
      throw new UnauthorizedException(message);
    }
  }
}
