import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../ThemeProvider';
import { NotificationBell } from './NotificationBell';

describe('NotificationBell', () => {
  it('shows the unread count in its accessible label', () => {
    render(
      <ThemeProvider>
        <NotificationBell count={3}>alerts</NotificationBell>
      </ThemeProvider>,
    );
    expect(screen.getByRole('button', { name: 'Notifications, 3 unread' })).toBeInTheDocument();
  });

  it('opens a dialog with the provided content on click, closed by default', () => {
    render(
      <ThemeProvider>
        <NotificationBell count={1}>
          <p>Church Pulse declined</p>
        </NotificationBell>
      </ThemeProvider>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('dialog', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByText('Church Pulse declined')).toBeInTheDocument();
  });

  it('shows an empty-state message when there are no notifications', () => {
    render(
      <ThemeProvider>
        <NotificationBell count={0}>content</NotificationBell>
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('No new notifications.')).toBeInTheDocument();
  });
});
