import type { ReactElement } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, ToastProvider } from '@ecclesia/ui-web';
import type { ExpenseResponseDto } from '@ecclesia/contracts';

import { ReceiptUploadPanel } from './ReceiptUploadPanel';
import { fetchExpenseReceiptObjectUrl, uploadExpenseReceipt } from './useStewardshipData';

jest.mock('./useStewardshipData', () => ({
  uploadExpenseReceipt: jest.fn(),
  fetchExpenseReceiptObjectUrl: jest.fn(),
}));

const mockUploadExpenseReceipt = uploadExpenseReceipt as jest.Mock;
const mockFetchExpenseReceiptObjectUrl = fetchExpenseReceiptObjectUrl as jest.Mock;

function renderWithProviders(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <ToastProvider>{ui}</ToastProvider>
    </ThemeProvider>,
  );
}

function buildExpense(overrides: Partial<ExpenseResponseDto> = {}): ExpenseResponseDto {
  return {
    id: 'exp-1',
    branchId: 'branch-1',
    transactionId: 'txn-1',
    requestedByPersonId: 'person-1',
    description: 'Sound system repair',
    category: null,
    receiptStorageKey: null,
    approvedByPersonId: null,
    approvedAt: null,
    amountMinor: '20000',
    currency: 'GHS',
    currentState: 'PAID',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

/**
 * `[Remaining Engineering Sprint, Milestone 11]` Manually traced against
 * `ReceiptUploadPanel.tsx` rather than executed - `jest` cannot run in
 * this sandbox (`@swc/core`'s installed native binding is for a different
 * platform), the same persistent limitation every other spec in this
 * codebase discloses. `uploadExpenseReceipt`/`fetchExpenseReceiptObjectUrl`
 * are mocked so no real `XMLHttpRequest`/`fetch` call is attempted.
 */
describe('ReceiptUploadPanel', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing for an Expense state before PAID', () => {
    const { container } = renderWithProviders(
      <ReceiptUploadPanel expense={buildExpense({ currentState: 'REQUESTED' })} accessToken="token" onUploaded={jest.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('PAID with no receipt yet shows the Upload receipt affordance', () => {
    renderWithProviders(<ReceiptUploadPanel expense={buildExpense()} accessToken="token" onUploaded={jest.fn()} />);
    // `getByRole` rather than `getByText`: the Upload receipt `Button`
    // wraps an `Icon` + text with no other sibling in this state, so its
    // immediate wrapper `div` would have the exact same normalized
    // `textContent` and also satisfy a plain `getByText` query - matching
    // the accessible button role by name avoids that ambiguity. The name
    // comes from `accessibilityLabel` (`aria-label` overrides the visible
    // text as the accessible name once set), matching the component's own
    // `accessibilityLabel="Upload a receipt for this expense"`.
    expect(screen.getByRole('button', { name: 'Upload a receipt for this expense' })).toBeInTheDocument();
  });

  it('RECEIPT_RETAINED shows only the attached badge + Preview action, no upload input', () => {
    renderWithProviders(
      <ReceiptUploadPanel expense={buildExpense({ currentState: 'RECEIPT_RETAINED', receiptStorageKey: 'key.pdf' })} accessToken="token" onUploaded={jest.fn()} />,
    );
    expect(screen.getByText('Receipt attached')).toBeInTheDocument();
    expect(screen.getByText('Preview receipt')).toBeInTheDocument();
    expect(screen.queryByText('Upload receipt')).not.toBeInTheDocument();
  });

  it('staging an unsupported file type shows a validation error and does not call uploadExpenseReceipt', () => {
    renderWithProviders(<ReceiptUploadPanel expense={buildExpense()} accessToken="token" onUploaded={jest.fn()} />);
    const input = screen.getByTestId('receipt-file-input-exp-1') as HTMLInputElement;
    const badFile = new File(['x'], 'receipt.txt', { type: 'text/plain' });

    fireEvent.change(input, { target: { files: [badFile] } });

    expect(screen.getByText('Only JPEG, PNG, WebP, or PDF receipts are accepted.')).toBeInTheDocument();
    expect(mockUploadExpenseReceipt).not.toHaveBeenCalled();
  });

  it('staging a valid file, then Remove, clears the staged file back to the plain Upload button', () => {
    renderWithProviders(<ReceiptUploadPanel expense={buildExpense()} accessToken="token" onUploaded={jest.fn()} />);
    const input = screen.getByTestId('receipt-file-input-exp-1') as HTMLInputElement;
    const goodFile = new File(['x'], 'receipt.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [goodFile] } });
    expect(screen.getByText('receipt.pdf')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Remove selected receipt file' }));
    expect(screen.queryByText('receipt.pdf')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload a receipt for this expense' })).toBeInTheDocument();
  });

  it('submitting a staged file calls uploadExpenseReceipt and, on success, calls onUploaded', async () => {
    mockUploadExpenseReceipt.mockResolvedValue(buildExpense({ currentState: 'RECEIPT_RETAINED', receiptStorageKey: 'new-key.pdf' }));
    const onUploaded = jest.fn();
    renderWithProviders(<ReceiptUploadPanel expense={buildExpense()} accessToken="token" onUploaded={onUploaded} />);
    const input = screen.getByTestId('receipt-file-input-exp-1') as HTMLInputElement;
    const goodFile = new File(['x'], 'receipt.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [goodFile] } });
    fireEvent.click(screen.getByTestId('receipt-submit-exp-1'));

    await waitFor(() => expect(onUploaded).toHaveBeenCalled());
    expect(mockUploadExpenseReceipt).toHaveBeenCalledWith('token', 'exp-1', goodFile, expect.any(Function));
  });

  it('Preview receipt opens the object URL fetchExpenseReceiptObjectUrl resolves', async () => {
    mockFetchExpenseReceiptObjectUrl.mockResolvedValue('blob:mock-url');
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    renderWithProviders(
      <ReceiptUploadPanel expense={buildExpense({ currentState: 'RECEIPT_RETAINED', receiptStorageKey: 'key.pdf' })} accessToken="token" onUploaded={jest.fn()} />,
    );

    fireEvent.click(screen.getByText('Preview receipt'));

    await waitFor(() => expect(openSpy).toHaveBeenCalledWith('blob:mock-url', '_blank', 'noopener,noreferrer'));
    openSpy.mockRestore();
  });
});
