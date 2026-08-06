import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';
import type { PulseScoreResponseDto } from '@ecclesia/contracts';

import { ChurchPulseCard } from './ChurchPulseCard';

const pulseScore: PulseScoreResponseDto = {
  id: 'p1',
  branchId: 'branch-1',
  scopeType: 'BRANCH',
  scopeId: 'branch-1',
  score: 74,
  computedAt: new Date().toISOString(),
};

describe('ChurchPulseCard', () => {
  it('defaults the heading to "whole Branch" when no scopeLabel is given', () => {
    render(
      <ThemeProvider>
        <ChurchPulseCard status="success" pulseScore={pulseScore} onRetry={jest.fn()} />
      </ThemeProvider>,
    );
    expect(screen.getByText('Church Pulse — whole Branch')).toBeInTheDocument();
  });

  it('uses a custom scopeLabel when given (Insights Web Admin sprint cluster drill-down)', () => {
    render(
      <ThemeProvider>
        <ChurchPulseCard status="success" pulseScore={pulseScore} onRetry={jest.fn()} scopeLabel="Bacenta 12" />
      </ThemeProvider>,
    );
    expect(screen.getByText('Church Pulse — Bacenta 12')).toBeInTheDocument();
  });

  it('shows a retryable error state', () => {
    const onRetry = jest.fn();
    render(
      <ThemeProvider>
        <ChurchPulseCard status="error" onRetry={onRetry} />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
