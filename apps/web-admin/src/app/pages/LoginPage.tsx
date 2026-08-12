import { useEffect, useState, type FormEvent } from 'react';
import { Button, Card, Heading, Input, Text, useTheme } from '@ecclesia/ui-web';
import type { RoleDto } from '@ecclesia/contracts';

import { useAuth } from '../auth/AuthContext';
import { useNavigate } from '../router/router';
import { consumeIntendedPath } from '../router/ProtectedRoute';
import { roleLabel } from '../shell/nav-items';

/**
 * STEP 4's login screen. Blueprint §8.2: Web Admin's primary personas
 * (Treasurer, Assistant Pastor, Resident Pastor, Admin) authenticate with
 * email + password, with TOTP MFA **mandatory** — so this is always a
 * two-step form: password first, then (per `AuthContext`'s `mfa_required`
 * state) a 6-digit authenticator code. See
 * `APPLICATION_SHELL_DESIGN_NOTES.md` §1 for why this — not the Shepherd's
 * phone+OTP method — is the method this screen implements.
 *
 * Development Authentication sprint, STEP 6: when `useAuth().mode ===
 * 'development'`, this same component renders a role picker (a radio list
 * of `devUsers` plus a single "Sign in" button, no password field) instead
 * of the Cognito form below — the two branches are mutually exclusive at
 * render time. `mode` can only ever be `'development'` when the backend's
 * own `AUTH_MODE` is `'development'` (`GET /auth/mode`, resolved once at
 * boot in `AuthContext`'s restore effect) — there is no client-side
 * toggle, flag, or query parameter that can force this branch. This is
 * what satisfies STEP 6's "this UI must never appear in production": the
 * picker is structurally gated on the same server-side fact
 * (`assertAuthModeIsSafe`) that makes `DevAuthController`'s routes not
 * exist at all in production, not on anything the client controls.
 */
export function LoginPage() {
  const theme = useTheme();
  const { state, mode, devUsers, login, submitMfaCode, loginAsDevUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedDevUserId, setSelectedDevUserId] = useState<string | undefined>(undefined);

  // Role-aware redirect (STEP 4): once authenticated, land on whatever
  // protected path the user originally tried to reach (or `/dashboard`),
  // per `ProtectedRoute.consumeIntendedPath()`.
  useEffect(() => {
    if (state.status === 'authenticated') {
      navigate(consumeIntendedPath(), { replace: true });
    }
  }, [state.status, navigate]);

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    await login(email, password);
    setSubmitting(false);
  };

  const handleMfaSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    await submitMfaCode(code);
    setSubmitting(false);
  };

  const handleDevSignIn = async () => {
    if (!selectedDevUserId) return;
    setSubmitting(true);
    await loginAsDevUser(selectedDevUserId);
    setSubmitting(false);
  };

  const errorMessage = state.status === 'unauthenticated' ? state.error : state.status === 'mfa_required' ? state.error : undefined;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: theme.spacing[4] }}>
      <Card padding={8}>
        <div style={{ width: 360, display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
          <Heading level={1}>Ecclesia</Heading>
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            {mode === 'development' ? 'Development sign-in — select a seeded user.' : 'Sign in to the Admin Console.'}
          </Text>

          {errorMessage && (
            <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
              <span role="alert">{errorMessage}</span>
            </Text>
          )}

          {mode === 'development' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              {devUsers.length === 0 ? (
                <Text variant="bodySmall" color={theme.colors.text.secondary}>
                  No development users are seeded yet. Run <code>pnpm db:seed:dev</code> and reload this page.
                </Text>
              ) : (
                <div role="radiogroup" aria-label="Development user" style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
                  {devUsers.map((user) => (
                    <label
                      key={user.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing[2],
                        padding: theme.spacing[2],
                        border: `1px solid ${theme.colors.border.default}`,
                        borderRadius: theme.radius.md,
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="devUser"
                        value={user.id}
                        checked={selectedDevUserId === user.id}
                        onChange={() => setSelectedDevUserId(user.id)}
                      />
                      <span>
                        <Text as="span" variant="body">
                          {/* `[Product terminology fix]` `user.label` is
                              `DevAuthController.listUsers()`'s own seeded
                              persona label (`dev-users.ts`), which still
                              says "Assistant Pastor" - it predates the
                              approved Final UX Design Specification §18
                              terminology decision and was never routed
                              through it. `roleLabel()` (`shell/nav-items.ts`)
                              is the one already-approved mapping every
                              other screen in this app uses for this exact
                              purpose (e.g. `AppShell`'s `UserMenu`) - reused
                              here instead of a second, competing label
                              source. Falls back to the raw seed label only
                              if a future dev role isn't in `ROLE_LABELS`
                              yet, so this can never render blank. */}
                          {roleLabel(user.role as RoleDto) || user.label}
                        </Text>{' '}
                        <Text as="span" variant="bodySmall" color={theme.colors.text.secondary}>
                          ({user.role})
                        </Text>
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <Button
                type="button"
                loading={submitting || state.status === 'restoring'}
                disabled={!selectedDevUserId}
                onClick={() => void handleDevSignIn()}
              >
                Sign in
              </Button>
            </div>
          ) : state.status === 'mfa_required' ? (
            <form onSubmit={(event) => void handleMfaSubmit(event)} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              <Text variant="bodySmall" color={theme.colors.text.secondary}>
                Enter the 6-digit code from your authenticator app.
              </Text>
              <Input
                label="Authentication code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                required
              />
              <Button type="submit" loading={submitting} disabled={code.length === 0}>
                Verify
              </Button>
            </form>
          ) : (
            <form onSubmit={(event) => void handlePasswordSubmit(event)} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              <Input
                label="Email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <Button type="submit" loading={submitting || state.status === 'restoring'} disabled={email.length === 0 || password.length === 0}>
                Sign in
              </Button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
