/**
 * Development Authentication sprint. The abstraction `AuthGuard` depends
 * on instead of concretely importing `CognitoVerifierService` - STEP 3's
 * "return an identity object identical in shape to Cognito. Never expose
 * differences to the remainder of the application."
 *
 * Both `CognitoVerifierService` (production) and `DevAuthService`
 * (development) implement this. `AuthGuard`, `ActorContextResolverService`,
 * every RBAC guard, and every controller downstream never know which one
 * is wired up - they only ever see a `VerifiedTokenPayload`/`ActorContext`,
 * exactly as before this sprint. That is the whole point: swapping the
 * identity *source* must not require touching authorization at all.
 */

/**
 * The one field `AuthGuard` actually reads off a verified token today
 * (`payload.sub`, passed straight to `ActorContextResolverService.resolve()`).
 * `CognitoVerifierService.verifyAccessToken()` already returns a
 * `CognitoAccessTokenPayload`, a strict superset of this shape, so it
 * satisfies this interface with no change to its own return type.
 */
export interface VerifiedTokenPayload {
  sub: string;
}

/** DI token `AuthModule` binds to whichever implementation is active. */
export const TOKEN_VERIFIER = Symbol('TOKEN_VERIFIER');

export interface TokenVerifierService {
  /** Verifies `token`, returning its identity claims. Throws (mirrors
   * `CognitoVerifierService`'s own contract) on any verification failure -
   * an invalid/expired/forged token is never treated as "no opinion." */
  verifyAccessToken(token: string): Promise<VerifiedTokenPayload>;
}
