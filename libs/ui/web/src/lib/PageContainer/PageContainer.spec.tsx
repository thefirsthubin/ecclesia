import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../ThemeProvider';
import { PageContainer } from './PageContainer';

describe('PageContainer', () => {
  it('renders its children', () => {
    render(
      <ThemeProvider>
        <PageContainer>
          <div>Page content</div>
        </PageContainer>
      </ThemeProvider>,
    );
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('centers via auto margins against its max-width, defaulting to a sensible workspace width', () => {
    render(
      <ThemeProvider>
        <PageContainer testId="container">
          <div>Content</div>
        </PageContainer>
      </ThemeProvider>,
    );
    expect(screen.getByTestId('container')).toHaveStyle({ marginLeft: 'auto', marginRight: 'auto', maxWidth: '1120px' });
  });

  it('honors an explicit maxWidth for pages with a different content density', () => {
    render(
      <ThemeProvider>
        <PageContainer testId="container" maxWidth={640}>
          <div>Content</div>
        </PageContainer>
      </ThemeProvider>,
    );
    expect(screen.getByTestId('container')).toHaveStyle({ maxWidth: '640px' });
  });

  it('gives every page the same horizontal centering regardless of its own maxWidth', () => {
    render(
      <ThemeProvider>
        <PageContainer testId="wide" maxWidth={1440}>
          <div>Content</div>
        </PageContainer>
      </ThemeProvider>,
    );
    expect(screen.getByTestId('wide')).toHaveStyle({ marginLeft: 'auto', marginRight: 'auto' });
  });
});
