import type { ReactElement, ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * A minimal, dependency-free client-side router.
 *
 * [Design Decision] No routing library (`react-router-dom` or similar) is
 * installed anywhere in this workspace, and this sandbox has no
 * package-registry network access to add one (confirmed during the
 * Sprint Review task - `npm install`/`pip install` both 403). This
 * history-API router originally covered only flat, param-free routes
 * (`APPLICATION_SHELL_DESIGN_NOTES.md` §2) - the People Web Admin sprint
 * needed a Person detail route (`/people/:id`), the exact "future need"
 * that doc flagged as the point to reconsider. Extended minimally rather
 * than replaced: one dynamic `:segment` per path, no nesting, no
 * wildcards, no optional segments - still not a general-purpose router.
 */

interface RouterContextValue {
  path: string;
  navigate: (to: string, options?: { replace?: boolean }) => void;
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

function getCurrentPath(): string {
  return typeof window === 'undefined' ? '/' : window.location.pathname;
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(getCurrentPath);

  useEffect(() => {
    const onPopState = () => setPath(getCurrentPath());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      window.history.replaceState({}, '', to);
    } else {
      window.history.pushState({}, '', to);
    }
    setPath(to);
  }, []);

  const value = useMemo(() => ({ path, navigate }), [path, navigate]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

function useRouterContext(): RouterContextValue {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter/useNavigate/Link must be used within a RouterProvider');
  }
  return context;
}

export function useLocation(): { path: string } {
  const { path } = useRouterContext();
  return { path };
}

export function useNavigate(): (to: string, options?: { replace?: boolean }) => void {
  const { navigate } = useRouterContext();
  return navigate;
}

export interface RouteProps {
  path: string;
  element: ReactElement;
}

/** Declarative marker only - `Routes` reads `path`/`element` off its children's props and never renders a `Route` directly. */
export function Route(_props: RouteProps): ReactElement | null {
  return null;
}

/**
 * Matches a route pattern like `/people/:id` against an actual path like
 * `/people/abc-123`, segment by segment - no partial-segment params
 * (`/people-:id`), no wildcards, no optional segments. Returns `null` on
 * no match, or the extracted param map (possibly empty) on a match.
 */
function matchPath(pattern: string, path: string): Record<string, string> | null {
  const patternSegments = pattern.split('/').filter(Boolean);
  const pathSegments = path.split('/').filter(Boolean);
  if (patternSegments.length !== pathSegments.length) {
    return null;
  }

  const params: Record<string, string> = {};
  for (let i = 0; i < patternSegments.length; i += 1) {
    const patternSegment = patternSegments[i];
    const pathSegment = pathSegments[i];
    if (patternSegment.startsWith(':')) {
      params[patternSegment.slice(1)] = decodeURIComponent(pathSegment);
    } else if (patternSegment !== pathSegment) {
      return null;
    }
  }
  return params;
}

const ParamsContext = createContext<Record<string, string>>({});

/** The dynamic segments (e.g. `:id`) of whichever `<Route>` matched the current path. */
export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  return useContext(ParamsContext) as T;
}

export function Routes({ children }: { children: ReactElement<RouteProps> | ReactElement<RouteProps>[] }) {
  const { path } = useLocation();
  const routes = Array.isArray(children) ? children : [children];

  for (const route of routes) {
    const params = matchPath(route.props.path, path);
    if (params) {
      return <ParamsContext.Provider value={params}>{route.props.element}</ParamsContext.Provider>;
    }
  }
  return null;
}

export interface LinkProps {
  to: string;
  children: ReactNode;
  className?: string;
  'aria-current'?: 'page' | undefined;
  onClick?: () => void;
}

export function Link({ to, children, className, 'aria-current': ariaCurrent, onClick }: LinkProps) {
  const navigate = useNavigate();
  return (
    <a
      href={to}
      className={className}
      aria-current={ariaCurrent}
      onClick={(event) => {
        // Plain left-click, no modifier keys held: intercept for client-side
        // navigation. Modifier-clicks (open in new tab, etc.) fall through
        // to the browser's default `<a>` behaviour untouched.
        if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
          event.preventDefault();
          navigate(to);
          onClick?.();
        }
      }}
    >
      {children}
    </a>
  );
}
