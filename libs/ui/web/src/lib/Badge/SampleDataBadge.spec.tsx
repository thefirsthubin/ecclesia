import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../ThemeProvider';
import { SampleDataBadge } from './SampleDataBadge';

describe('SampleDataBadge', () => {
  it('renders the standard "Sample data" label', () => {
    render(
      <ThemeProvider>
        <SampleDataBadge />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('sample-data-badge')).toHaveTextContent('Sample data');
  });

  it('accepts a custom testId for multiple badges on one screen', () => {
    render(
      <ThemeProvider>
        <SampleDataBadge testId="recent-activity-row-sample-badge" />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('recent-activity-row-sample-badge')).toBeInTheDocument();
  });
});
