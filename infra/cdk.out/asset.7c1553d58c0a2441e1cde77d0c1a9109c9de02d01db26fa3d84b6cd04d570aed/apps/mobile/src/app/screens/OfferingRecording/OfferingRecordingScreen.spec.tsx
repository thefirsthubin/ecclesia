import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@ecclesia/ui-native';

import { OfferingRecordingScreen } from './OfferingRecordingScreen';

jest.mock('../../lib/session', () => ({
  useSession: () => ({
    personId: 'shepherd-1',
    branchId: 'branch-1',
    bacentaGroupId: 'bacenta-1',
    authToken: 'token-1',
  }),
}));

const mockSwitchTab = jest.fn();
jest.mock('../../navigation/Navigator', () => ({
  ...jest.requireActual('../../navigation/Navigator'),
  useSwitchTab: () => mockSwitchTab,
}));

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({ ok, status: ok ? 200 : 500, json: () => Promise.resolve(body) } as Response);
}

const RECORDED = {
  id: 'ft-1',
  branchId: 'branch-1',
  type: 'OFFERING',
  sourceGroupId: 'bacenta-1',
  giverPersonId: null,
  channel: 'CASH',
  amountMinor: '5000',
  currency: 'GHS',
  currentState: 'RECORDED',
  recordedByPersonId: 'shepherd-1',
  createdAt: '2026-08-01T00:00:00.000Z',
};

describe('OfferingRecordingScreen', () => {
  afterEach(() => {
    jest.resetAllMocks();
    mockSwitchTab.mockReset();
  });

  it('defaults to Offering/Cash, submits a typed amount as sourceGroupId-attributed minor units, and shows a confirmation', async () => {
    const fetchMock = jest.fn(() => jsonResponse(RECORDED)) as unknown as typeof fetch;
    global.fetch = fetchMock;

    render(
      <ThemeProvider>
        <OfferingRecordingScreen />
      </ThemeProvider>,
    );

    // Submit starts disabled - no amount entered yet.
    expect(screen.getByTestId('offering-recording-submit').props.accessibilityState.disabled).toBe(true);

    fireEvent.changeText(screen.getByTestId('offering-recording-amount'), '50');
    expect(screen.getByTestId('offering-recording-submit').props.accessibilityState.disabled).toBe(false);

    fireEvent.press(screen.getByTestId('offering-recording-submit'));

    await waitFor(() => expect(screen.getByText('Offering recorded')).toBeTruthy());
    expect(screen.getByText('GHS 50.00 recorded for your Bacenta.')).toBeTruthy();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = (fetchMock as jest.Mock).mock.calls[0];
    expect(url).toContain('/financial-transactions');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({
      type: 'OFFERING',
      sourceGroupId: 'bacenta-1',
      channel: 'CASH',
      amountMinor: '5000',
    });
  });

  it('switching Type/Channel and submitting sends the selected values', async () => {
    const fetchMock = jest.fn(() => jsonResponse({ ...RECORDED, type: 'TITHE', channel: 'MOBILE_MONEY', amountMinor: '2500' })) as unknown as typeof fetch;
    global.fetch = fetchMock;

    render(
      <ThemeProvider>
        <OfferingRecordingScreen />
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByLabelText('Tithe'));
    fireEvent.press(screen.getByLabelText('Mobile Money'));
    fireEvent.changeText(screen.getByTestId('offering-recording-amount'), '25');
    fireEvent.press(screen.getByTestId('offering-recording-submit'));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, init] = (fetchMock as jest.Mock).mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({
      type: 'TITHE',
      sourceGroupId: 'bacenta-1',
      channel: 'MOBILE_MONEY',
      amountMinor: '2500',
    });
  });

  it('shows a validation error for an invalid amount instead of submitting', () => {
    render(
      <ThemeProvider>
        <OfferingRecordingScreen />
      </ThemeProvider>,
    );

    fireEvent.changeText(screen.getByTestId('offering-recording-amount'), '0');
    expect(screen.getByText('Enter a valid amount greater than 0')).toBeTruthy();
    expect(screen.getByTestId('offering-recording-submit').props.accessibilityState.disabled).toBe(true);
  });

  it('"Record another" resets the form back to the amount entry after a successful submission', async () => {
    global.fetch = jest.fn(() => jsonResponse(RECORDED)) as unknown as typeof fetch;

    render(
      <ThemeProvider>
        <OfferingRecordingScreen />
      </ThemeProvider>,
    );

    fireEvent.changeText(screen.getByTestId('offering-recording-amount'), '50');
    fireEvent.press(screen.getByTestId('offering-recording-submit'));
    await waitFor(() => expect(screen.getByText('Offering recorded')).toBeTruthy());

    fireEvent.press(screen.getByTestId('offering-recording-again'));
    expect(screen.getByTestId('offering-recording-amount')).toBeTruthy();
    expect(screen.queryByText('Offering recorded')).toBeNull();
    expect(mockSwitchTab).not.toHaveBeenCalled();
  });

  it('"Done" switches back to the Dashboard tab', async () => {
    global.fetch = jest.fn(() => jsonResponse(RECORDED)) as unknown as typeof fetch;

    render(
      <ThemeProvider>
        <OfferingRecordingScreen />
      </ThemeProvider>,
    );

    fireEvent.changeText(screen.getByTestId('offering-recording-amount'), '50');
    fireEvent.press(screen.getByTestId('offering-recording-submit'));
    await waitFor(() => expect(screen.getByText('Offering recorded')).toBeTruthy());

    fireEvent.press(screen.getByTestId('offering-recording-done'));
    expect(mockSwitchTab).toHaveBeenCalledWith('dashboard');
  });

  it('shows a submit error and keeps the form usable to retry when the request fails', async () => {
    global.fetch = jest.fn(() => jsonResponse(null, false)) as unknown as typeof fetch;

    render(
      <ThemeProvider>
        <OfferingRecordingScreen />
      </ThemeProvider>,
    );

    fireEvent.changeText(screen.getByTestId('offering-recording-amount'), '50');
    fireEvent.press(screen.getByTestId('offering-recording-submit'));

    await waitFor(() => expect(screen.getByText(/failed with status 500/i)).toBeTruthy());
    expect(screen.queryByText('Offering recorded')).toBeNull();
    // Not stuck in a loading state - the form is still usable to retry.
    expect(screen.getByTestId('offering-recording-submit').props.accessibilityState.busy).toBeFalsy();
  });
});
