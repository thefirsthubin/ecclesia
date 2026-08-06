# AppShell / real bottom tab bar (Mobile) — Design Notes

Sprint: `[Stewardship gaps sprint]` follow-on, immediately after the
Follow-up Queue screen. Closes the gap that screen's own design notes
(§9, §5 above it) flagged: `libs/ui/native`'s `BottomNav` component
existed but was never wired into `apps/mobile`, so this app still
navigated only via the Dashboard's own quick actions/cards rather than
the persistent tab bar Design System §3.2 actually specifies (Dashboard ·
Attendance · Follow-ups · Offering · Profile).

## 1. What this sprint builds

A real, persistent bottom tab bar for the whole authenticated app, plus
the one screen that bar's fifth tab needed and didn't yet have: Profile.

## 2. `switchTab` — a second navigation primitive alongside `navigate`/`goBack`, not a replacement

`Navigator.tsx`'s existing stack (`navigate`/`goBack`, push/pop
semantics) was built for a "Tab → Detail" push case Design System §3.2
itself names as a legitimate future need, and nothing here removes it.
What a tab bar needs is different: pressing "Offering" while three deep
in some future Attendance sub-flow should land on a *clean* Offering
screen, not push atop whatever stack was left behind, and pressing
"Dashboard" afterward shouldn't pop through that abandoned stack either.

`switchTab(screen)` resets the whole stack to a single entry:

```ts
const switchTab = useCallback((screen: ScreenName) => {
  setStack([{ screen, params: {} }]);
}, []);
```

`useSwitchTab()` is the paired hook, exported the same way
`useNavigate`/`useGoBack` already were. `ScreenName` gained `'profile'`.
Covered by a new `Navigator.spec.tsx` test asserting `canGoBack` becomes
`false` and `goBack()` becomes a no-op immediately after a `switchTab`
call — the property that actually matters (no stale back-history left
behind), not just that the visible screen changed.

## 3. One `SafeAreaView`, at `AppShell`, not one per screen

RN core `SafeAreaView` (`'react-native'`, not
`react-native-safe-area-context` — this workspace has no dependency on
the latter) reads OS-level insets unconditionally regardless of
nesting, so two nested instances double-pad rather than the inner one
deferring to the outer. `BottomNav` itself applies no inset handling at
all, so *something* has to own it for the tab bar not to sit under the
home-indicator area on iOS.

Resolution: exactly one `SafeAreaView` lives in the new `AppShell`,
wrapping both the active screen's content and `BottomNav` together.
Every screen that previously wrapped itself in its own `SafeAreaView`
(Dashboard, Attendance Capture, Offering Recording, Follow-up Queue) had
that instance removed and replaced with a plain `View` — otherwise each
would still double-pad against `AppShell`'s own insets. This was decided
before writing any code, not discovered by trial and error.

```tsx
export function AppShell({ children }: { children: ReactNode }) {
  const { screen } = useCurrentScreen();
  const switchTab = useSwitchTab();
  const items: BottomNavItem[] = TABS.map((tab) => ({ ...tab, active: screen === tab.key }));
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface.default }}>
      <View style={{ flex: 1 }}>{children}</View>
      <BottomNav items={items} onPress={(key) => switchTab(key as ScreenName)} testId="shepherd-bottom-nav" />
    </SafeAreaView>
  );
}
```

`App.tsx`'s `RootNavigator` now renders `<AppShell><CurrentScreen /></AppShell>`
only once authenticated — `LoginScreen`/`SessionRestoringScreen` are
unaffected, they render outside `AppShell` entirely (no tab bar on
unauthenticated screens, which is correct: there's nothing to tab
between yet).

## 4. Two new icons, verified against both lucide packages before adding

`ICON_REGISTRY` (`libs/ui/core`) needed `coins` (Offering tab) and
`clipboardList` (Follow-ups tab), neither of which existed yet. Checked
both `lucide-react` and `lucide-react-native` actually export `Coins`/
`ClipboardList` under those exact names before adding either entry
(`node -e "require(...)"` for the web package; a `grep` against the RN
package's bundled `.mjs` for the native one, since requiring it directly
via plain Node fails on its `import typeof` syntax) — this project has
been burned before by adding an icon-registry entry on the assumption a
name existed without checking.

## 5. Every pre-existing screen's post-action navigation now targets a tab, not a stack pop

Because `AppShell` makes every one of the five screens a real top-level
tab destination rather than a pushed sub-screen with a parent to return
to, three call sites that used to call `goBack()`/`navigate()` after a
successful action now call `switchTab('dashboard')` instead:

- Attendance Capture's save-success handler.
- Offering Recording's "Done" button (`"Record another"` deliberately
  stays in place — it resets the form and stays on this tab, it does not
  switch tabs; covered by a spec assertion that `switchTab` was *not*
  called for that button specifically).
- Dashboard's own `onTakeAttendance`/`onRecordOffering`/`onViewFollowUps`
  handlers, which already called `navigate` for this purpose — swapped
  to `switchTab` for the same "no back-history to a peer tab" reasoning.

Follow-up Queue's Complete/Escalate actions needed no such change — both
just refetch the list in place, they never navigated anywhere.

Every screen's own "Back" button chrome was removed outright (Attendance
Capture, Offering Recording, Follow-up Queue all had one; Dashboard never
did) — a top-level tab has no "back" to go to, and `goBack()` would have
been a silent no-op in every one of these screens regardless, since each
is always reached with a freshly-reset, single-entry stack.

## 6. Profile — the fifth tab, genuinely new content

Design System §3.2 names Profile as the fifth tab but nothing in this
app had built it yet. New screen, minimal by design:

- Name + role — reuses `usePersonName` from `ShepherdDashboard`'s own
  hooks unmodified (no duplicate fetch), plus a `ROLE_LABELS` map
  (duplicated from `apps/web-admin/.../nav-items.ts`'s own `roleLabel()`,
  not shared — consistent with `api-client.ts`'s own precedent of small
  per-app glue not being worth extracting into a shared lib here).
- Bacenta name — the one genuinely new data need, `useGroupName()`
  (`GET /groups/:id`). `BACENTA_LEADER` holds `people.group.read` at
  `OWN_GROUP` scope (`permission-matrix.ts`, checked before writing this
  hook) — a Shepherd can always read their own Bacenta's own record.
- **Sign Out** — `AuthContext`'s `logout()` has existed since the Mobile
  Application Shell sprint but was never wired to any UI until now.

Renders `null` if reached while unauthenticated (defensive; `AppShell`
itself is never mounted in that state, so this is unreachable in
practice, not a real code path).

## 7. What was actually built

**Navigation** (`Navigator.tsx`/`.spec.tsx`): `'profile'` added to
`ScreenName`; `switchTab`/`useSwitchTab` added alongside the unchanged
`navigate`/`goBack`/`useNavigate`/`useGoBack`.

**`AppShell.tsx`/`.spec.tsx`** (new) — the single `SafeAreaView` +
`BottomNav` wrapper, five tabs (`dashboard`/`attendance-capture`/
`follow-up-queue`/`offering-recording`/`profile`), active-tab
highlighting driven by `useCurrentScreen()`.

**`screens/Profile/`** (new) — `ProfileScreen.tsx`, `hooks/useGroupName.ts`,
spec, barrel.

**`App.tsx`/`.spec.tsx`** — `RootNavigator` now wraps the authenticated
`CurrentScreen` in `AppShell`; `CurrentScreen` gained a `'profile'` case.

**Modified**: `ShepherdDashboardScreen.tsx`, `AttendanceCaptureScreen.tsx`,
`OfferingRecordingScreen.tsx`, `FollowUpQueueScreen.tsx` (and their
specs) — `SafeAreaView`→`View`, Back-button chrome removed, `goBack`/
`navigate`→`switchTab` where applicable. `libs/ui/core/icon-registry.ts`
— `coins`, `clipboardList` added.

**No new `libs/ui/native` primitives needed** — `BottomNav` already
existed from the Navigation/Data/Layout UI-library tier; this sprint is
entirely wiring plus one new screen.

## 8. Deferred / explicitly out of scope

- No badge/count indicator on the Follow-ups tab (e.g. open-task count)
  — `BottomNavItem` has no such prop today; a reasonable follow-up, not
  attempted here.
- No tab-bar-level deep-linking/URL-scheme handling — out of scope for
  this app generally so far, not specific to this sprint.
- Profile has no edit affordance — read-only display plus Sign Out only,
  matching how minimal Design System §3.2 itself describes this tab.

## 9. Known sandbox limitation

Same disclosed constraint as the immediately-prior Follow-up Queue
sprint: `jest` cannot execute in this sandbox at all (`@swc/core` native
binding failure, unrelated to this sprint's own changes). `tsc --noEmit`
against `apps/mobile`'s own tsconfigs was attempted using the same
log-file-redirect pattern that succeeded for the earlier Offering
Recording round; see the README's "Current status" entry for this
sprint for the actual outcome of that attempt. Every type here was
written to mirror the already-established, already-verified-clean
`switchTab`/`AppShell` patterns above and reviewed by hand, but this
sprint's changes genuinely need the user's own `npx tsc --noEmit`/
`pnpm build`, in addition to `pnpm lint && pnpm test`, before being
trusted.
