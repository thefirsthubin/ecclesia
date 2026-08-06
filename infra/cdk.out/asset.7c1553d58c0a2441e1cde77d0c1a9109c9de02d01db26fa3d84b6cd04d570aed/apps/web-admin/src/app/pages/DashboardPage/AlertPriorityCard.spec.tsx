import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';
import type { AlertResponseDto } from '@ecclesia/contracts';

import { AlertPriorityCard } from './AlertPriorityCard';

const alert: AlertResponseDto = {
  id: 'alert-1',
  branchId: 'branch-1',
  scopeType: 'GROUP',
  scopeId: 'group-1',
  alertType: 'PULSE_DECLINE',
  message: 'Bacenta 12 Church Pulse has declined',
  status: 'OPEN',
  resolvedByPersonId: null,
  resolvedAt: null,
  triggeredAt: new Date().toISOString(),
};

describe('AlertPriorityCard', () => {
  it('shows a positive empty state when there are no open alerts', () => {
    render(
      <ThemeProvider>
        <AlertPriorityCard status="success" alerts={[]} accessToken="token" onResolved={jest.fn()} onRetry={jest.fn()} />
      </ThemeProvider>,
    );
    expect(screen.getByText('No open alerts')).toBeInTheDocument();
  });

  it('lists only OPEN alerts and resolves one via PATCH /insights/alerts/:id/resolve', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ...alert, status: 'ACTED' }) });
    const onResolved = jest.fn();

    render(
      <ThemeProvider>
        <AlertPriorityCard status="success" alerts={[alert]} accessToken="token" onResolved={onResolved} onRetry={jest.fn()} />
      </ThemeProvider>,
    );

    expect(screen.getByText('Bacenta 12 Church Pulse has declined')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Resolve alert: PULSE_DECLINE' }));

    await waitFor(() => expect(onResolved).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/v1/insights/alerts/alert-1/resolve',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('renders a "Read only" badge instead of a Resolve button when readOnly is set (Insights Web Admin sprint)', () => {
    render(
      <ThemeProvider>
        <AlertPriorityCard status="success" alerts={[alert]} accessToken="token" onResolved={jest.fn()} onRetry={jest.fn()} readOnly />
      </ThemeProvider>,
    );

    expect(screen.getByText('Bacenta 12 Church Pulse has declined')).toBeInTheDocument();
    expect(screen.getByText('Read only')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resolve alert: PULSE_DECLINE' })).not.toBeInTheDocument();
  });

  it('shows an ErrorState with retry when the alerts fetch failed', () => {
    const onRetry = jest.fn();
    render(
      <ThemeProvider>
        <AlertPriorityCard status="error" alerts={[]} accessToken="token" onResolved={jest.fn()} onRetry={onRetry} />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
