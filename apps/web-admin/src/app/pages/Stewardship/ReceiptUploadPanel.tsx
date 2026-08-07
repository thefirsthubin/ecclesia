import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Icon, Text, useTheme, useToast } from '@ecclesia/ui-web';
import type { ExpenseResponseDto } from '@ecclesia/contracts';

import { fetchExpenseReceiptObjectUrl, uploadExpenseReceipt } from './useStewardshipData';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface ReceiptUploadPanelProps {
  expense: ExpenseResponseDto;
  accessToken: string;
  /** Re-fetches the Expense queue once the receipt is attached, the same
   * `refetch` callback every other action row on `StewardshipPage` already
   * takes. */
  onUploaded: () => void;
}

/**
 * `[Remaining Engineering Sprint, Milestone 11]` Objective 3, Receipt
 * Upload. Renders one of three states per Expense, matching
 * `ExpenseController`/`ExpenseService`'s real state machine rather than
 * inventing a richer one:
 *
 * 1. **Not yet payable** (`currentState` isn't `PAID`) - nothing to attach
 *    yet (`attachReceipt`'s own doc comment: `PAID -> RECEIPT_RETAINED`).
 *    Renders nothing (the Expense row's existing state badge already
 *    communicates this).
 * 2. **`PAID`, no receipt yet** - the compose flow: pick/replace/remove a
 *    file *before* submitting (all client-side, no backend call - this is
 *    where "Replace Receipt"/"Remove Receipt" actually apply, since
 *    `RECEIPT_RETAINED` is a **terminal** state per BR-STW-08 and this
 *    sprint's brief is explicit that it does not rewrite Stewardship's
 *    state machine), then Upload with a real progress bar
 *    (`apiUpload`/`XMLHttpRequest`), then error/success feedback.
 * 3. **`RECEIPT_RETAINED`** - a receipt is already attached and the
 *    transition is terminal; only Preview Receipt remains meaningful.
 *
 * See `STEWARDSHIP_PAGE_DESIGN_NOTES.md`'s Milestone 11 addendum for the
 * full disclosure of why "replace after attach" isn't a real backend
 * capability.
 */
export function ReceiptUploadPanel({ expense, accessToken, onUploaded }: ReceiptUploadPanelProps) {
  const theme = useTheme();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [stagedPreviewUrl, setStagedPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | undefined>(undefined);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | undefined>(undefined);
  const [uploadSucceeded, setUploadSucceeded] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    return () => {
      if (stagedPreviewUrl) URL.revokeObjectURL(stagedPreviewUrl);
    };
  }, [stagedPreviewUrl]);

  if (expense.currentState !== 'PAID' && expense.currentState !== 'RECEIPT_RETAINED') {
    return null;
  }

  const validateAndStage = (file: File) => {
    setUploadError(undefined);
    setUploadSucceeded(false);
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setValidationError('Only JPEG, PNG, WebP, or PDF receipts are accepted.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setValidationError('That file is larger than the 10 MB limit.');
      return;
    }
    setValidationError(undefined);
    if (stagedPreviewUrl) URL.revokeObjectURL(stagedPreviewUrl);
    setStagedFile(file);
    setStagedPreviewUrl(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
  };

  const removeStagedFile = () => {
    if (stagedPreviewUrl) URL.revokeObjectURL(stagedPreviewUrl);
    setStagedFile(null);
    setStagedPreviewUrl(null);
    setValidationError(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submitUpload = async () => {
    if (!stagedFile) return;
    setUploadProgress(0);
    setUploadError(undefined);
    try {
      await uploadExpenseReceipt(accessToken, expense.id, stagedFile, setUploadProgress);
      setUploadSucceeded(true);
      toast.show({ status: 'success', message: 'Receipt attached', description: `Uploaded for "${expense.description}".` });
      removeStagedFile();
      onUploaded();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Something went wrong uploading this receipt.');
      toast.show({ status: 'danger', message: "Couldn't upload receipt", description: 'Please try again.' });
    } finally {
      setUploadProgress(null);
    }
  };

  const previewAttachedReceipt = async () => {
    setPreviewing(true);
    try {
      const objectUrl = await fetchExpenseReceiptObjectUrl(accessToken, expense.id);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      // The opened tab holds its own reference; this object URL is revoked
      // on the next preview/unmount rather than immediately, so the tab
      // that just opened it can still load the resource.
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      toast.show({
        status: 'danger',
        message: "Couldn't load receipt",
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setPreviewing(false);
    }
  };

  if (expense.currentState === 'RECEIPT_RETAINED') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }} data-testid={`receipt-panel-${expense.id}`}>
        <Badge status="success">Receipt attached</Badge>
        <Button variant="tertiary" size="sm" loading={previewing} onClick={() => void previewAttachedReceipt()} accessibilityLabel="Preview receipt">
          <Icon name="eye" size="sm" color="currentColor" /> Preview receipt
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }} data-testid={`receipt-panel-${expense.id}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_MIME_TYPES.join(',')}
        style={{ display: 'none' }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) validateAndStage(file);
        }}
        data-testid={`receipt-file-input-${expense.id}`}
      />

      {!stagedFile && (
        <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} accessibilityLabel="Upload a receipt for this expense">
          <Icon name="upload" size="sm" color="currentColor" /> Upload receipt
        </Button>
      )}

      {validationError && (
        <Text variant="caption" color={theme.colors.status.danger.strong}>
          {validationError}
        </Text>
      )}

      {stagedFile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2], padding: theme.spacing[3], borderRadius: theme.radius.md, backgroundColor: theme.colors.surface.raised }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>
            {stagedPreviewUrl ? (
              <img src={stagedPreviewUrl} alt="Receipt preview" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: theme.radius.sm }} />
            ) : (
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: theme.radius.sm,
                  backgroundColor: theme.colors.brand.subtle,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="clipboardList" size="md" color={theme.colors.brand.default} />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1], flex: 1, minWidth: 0 }}>
              <Text variant="bodySmall" as="span">
                {stagedFile.name}
              </Text>
              <Text variant="caption" color={theme.colors.text.secondary}>
                {formatBytes(stagedFile.size)}
              </Text>
            </div>
          </div>

          {uploadProgress !== null && (
            <div style={{ height: 6, borderRadius: theme.radius.full, backgroundColor: theme.colors.border.subtle, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${uploadProgress}%`, borderRadius: theme.radius.full, backgroundColor: theme.colors.brand.default }} />
            </div>
          )}

          {uploadError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[1] }}>
              <Icon name="alertCircle" size="sm" color={theme.colors.status.danger.strong} />
              <Text variant="caption" color={theme.colors.status.danger.strong}>
                {uploadError}
              </Text>
            </div>
          )}

          {uploadSucceeded && (
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[1] }}>
              <Icon name="checkCircle" size="sm" color={theme.colors.status.success.strong} />
              <Text variant="caption" color={theme.colors.status.success.strong}>
                Receipt attached.
              </Text>
            </div>
          )}

          <div style={{ display: 'flex', gap: theme.spacing[2] }}>
            <Button
              variant="primary"
              size="sm"
              loading={uploadProgress !== null}
              onClick={() => void submitUpload()}
              testId={`receipt-submit-${expense.id}`}
            >
              Attach receipt
            </Button>
            <Button variant="tertiary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadProgress !== null}>
              Replace
            </Button>
            <Button variant="tertiary" size="sm" onClick={removeStagedFile} disabled={uploadProgress !== null} accessibilityLabel="Remove selected receipt file">
              <Icon name="trash" size="sm" color="currentColor" /> Remove
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
