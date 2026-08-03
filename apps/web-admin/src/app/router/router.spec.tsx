import { render, screen, fireEvent } from '@testing-library/react';

import { Link, Route, RouterProvider, Routes, useNavigate, useParams } from './router';

function Page({ label }: { label: string }) {
  return <h1>{label}</h1>;
}

function TestApp() {
  return (
    <RouterProvider>
      <Routes>
        <Route path="/" element={<Page label="Home" />} />
        <Route path="/dashboard" element={<Page label="Dashboard" />} />
      </Routes>
    </RouterProvider>
  );
}

beforeEach(() => {
  window.history.pushState({}, '', '/');
});

describe('router', () => {
  it('renders the route matching the current path', () => {
    render(<TestApp />);
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument();
  });

  it('renders nothing when no route matches the current path', () => {
    window.history.pushState({}, '', '/nowhere');
    render(<TestApp />);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('Link navigates client-side on a plain click without a full page load', () => {
    function AppWithLink() {
      return (
        <RouterProvider>
          <Link to="/dashboard">Go to dashboard</Link>
          <Routes>
            <Route path="/" element={<Page label="Home" />} />
            <Route path="/dashboard" element={<Page label="Dashboard" />} />
          </Routes>
        </RouterProvider>
      );
    }

    render(<AppWithLink />);
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'Go to dashboard' }));

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/dashboard');
  });

  it('does not intercept modifier-clicks (lets the browser handle them)', () => {
    function AppWithLink() {
      return (
        <RouterProvider>
          <Link to="/dashboard">Go to dashboard</Link>
          <Routes>
            <Route path="/" element={<Page label="Home" />} />
            <Route path="/dashboard" element={<Page label="Dashboard" />} />
          </Routes>
        </RouterProvider>
      );
    }

    render(<AppWithLink />);
    fireEvent.click(screen.getByRole('link', { name: 'Go to dashboard' }), { metaKey: true });

    // Navigation was not intercepted - still on Home.
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument();
  });

  it('useNavigate updates the current path', () => {
    function Navigator() {
      const navigate = useNavigate();
      return <button onClick={() => navigate('/dashboard')}>Go</button>;
    }

    function AppWithNavigator() {
      return (
        <RouterProvider>
          <Navigator />
          <Routes>
            <Route path="/" element={<Page label="Home" />} />
            <Route path="/dashboard" element={<Page label="Dashboard" />} />
          </Routes>
        </RouterProvider>
      );
    }

    render(<AppWithNavigator />);
    fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  // People Web Admin sprint - `/people/:id` was the first route needing a
  // dynamic segment. See `PEOPLE_PAGE_DESIGN_NOTES.md` §5.
  describe(':param segments', () => {
    function PersonPage() {
      const { id } = useParams<{ id: string }>();
      return <h1>Person {id}</h1>;
    }

    function AppWithParamRoute() {
      return (
        <RouterProvider>
          <Routes>
            <Route path="/people" element={<Page label="People" />} />
            <Route path="/people/:id" element={<PersonPage />} />
          </Routes>
        </RouterProvider>
      );
    }

    it('matches a dynamic segment and exposes it via useParams', () => {
      window.history.pushState({}, '', '/people/abc-123');
      render(<AppWithParamRoute />);
      expect(screen.getByRole('heading', { name: 'Person abc-123' })).toBeInTheDocument();
    });

    it('decodes URI-encoded param values', () => {
      window.history.pushState({}, '', `/people/${encodeURIComponent('abc def')}`);
      render(<AppWithParamRoute />);
      expect(screen.getByRole('heading', { name: 'Person abc def' })).toBeInTheDocument();
    });

    it('still matches the flat route ahead of the param route when segment counts differ', () => {
      window.history.pushState({}, '', '/people');
      render(<AppWithParamRoute />);
      expect(screen.getByRole('heading', { name: 'People' })).toBeInTheDocument();
    });

    it('does not match a param route against a path with the wrong number of segments', () => {
      window.history.pushState({}, '', '/people/abc-123/extra');
      render(<AppWithParamRoute />);
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('useParams returns an empty object outside a matched param route', () => {
      function ParamsProbe() {
        const params = useParams();
        return <p>{Object.keys(params).length === 0 ? 'no params' : 'has params'}</p>;
      }

      function AppWithoutParams() {
        return (
          <RouterProvider>
            <Routes>
              <Route path="/" element={<ParamsProbe />} />
            </Routes>
          </RouterProvider>
        );
      }

      window.history.pushState({}, '', '/');
      render(<AppWithoutParams />);
      expect(screen.getByText('no params')).toBeInTheDocument();
    });
  });
});
