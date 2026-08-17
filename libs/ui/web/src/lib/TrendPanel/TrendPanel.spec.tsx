import { render, screen } from '@testing-library/react';
import { TrendPanel } from './TrendPanel';

describe('TrendPanel', () => {
  it('shows a skeleton while loading, not the children', () => {
    render(
      <TrendPanel title="Attendance Trend" status="loading">
        <div>Chart content</div>
      </TrendPanel>,
    );
    expect(screen.getByRole('heading', { name: 'Attendance Trend' })).toBeInTheDocument();
    expect(screen.queryByText('Chart content')).not.toBeInTheDocument();
  });

  it('shows a retryable error state instead of the children on error', () => {
    const onRetry = jest.fn();
    render(
      <TrendPanel title="Giving Trend" status="error" onRetry={onRetry} errorTitle="Couldn't load giving trend">
        <div>Chart content</div>
      </TrendPanel>,
    );
    expect(screen.getByText("Couldn't load giving trend")).toBeInTheDocument();
    expect(screen.queryByText('Chart content')).not.toBeInTheDocument();
  });

  it('renders the real children on success', () => {
    render(
      <TrendPanel title="Bacenta Health" status="success">
        <div>Chart content</div>
      </TrendPanel>,
    );
    expect(screen.getByText('Chart content')).toBeInTheDocument();
  });
});
