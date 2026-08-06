import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../ThemeProvider';
import { Icon } from '../Icon';
import type { StatusKey } from '@ecclesia/ui-core';

export interface ToastOptions {
  status?: StatusKey;
  message: string;
  description?: string;
  /** Milliseconds before auto-dismissal. `0` disables auto-dismiss (caller must dismiss, or the person closes it manually) - used sparingly, e.g. a toast with its own undo action. Defaults to 5000. */
  duration?: number;
}

interface ToastItem extends Required<Pick<ToastOptions, 'status' | 'message' | 'duration'>> {
  id: string;
  description?: string;
}

interface ToastContextValue {
  show: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const STATUS_ICON: Record<StatusKey, 'checkCircle' | 'alertTriangle' | 'xCircle' | 'infoCircle'> = {
  success: 'checkCircle',
  warning: 'alertTriangle',
  danger: 'xCircle',
  info: 'infoCircle',
  neutral: 'infoCircle',
};

/**
 * Transient status messaging (Design System v1.0 Part 7.8's Toast/Snackbar
 * concept). Unlike `Modal` (one caller, one `isOpen` flag tied to a
 * specific action), a toast can be triggered from anywhere in the tree -
 * a save handler deep in a form, a background sync completing - so this
 * is a context provider + `useToast()` hook, not a purely
 * caller-controlled presentational component. Mount once near the app
 * root (same expectation as `ThemeProvider`).
 *
 * Portals to `document.body` at `zIndex.toast` (the token reserved for
 * exactly this, previously unused), stacking newest-on-top in the
 * bottom-right corner. Each toast is `role="status"` +
 * `aria-live="polite"` (`"assertive"` for `danger`, since an error toast
 * is worth interrupting screen-reader output for) so assistive tech
 * announces it without the person needing to navigate to find it.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const duration = options.duration ?? 5000;
      const toast: ToastItem = { id, status: options.status ?? 'neutral', message: options.message, description: options.description, duration };
      setToasts((current) => [...current, toast]);
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        );
      }
      return id;
    },
    [dismiss],
  );

  const value = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          style={{
            position: 'fixed',
            bottom: theme.spacing[4],
            right: theme.spacing[4],
            zIndex: theme.zIndex.toast,
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing[2],
            width: 360,
            maxWidth: '90vw',
          }}
        >
          {toasts.map((toast) => {
            const statusTokens = theme.colors.status[toast.status];
            return (
              <div
                key={toast.id}
                role="status"
                aria-live={toast.status === 'danger' ? 'assertive' : 'polite'}
                data-testid={`toast-${toast.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: theme.spacing[2],
                  padding: theme.spacing[3],
                  borderRadius: theme.radius.md,
                  border: `1px solid ${statusTokens.border}`,
                  backgroundColor: statusTokens.background,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.16)',
                }}
              >
                <Icon name={STATUS_ICON[toast.status]} size="sm" color={statusTokens.foreground} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
                  <span
                    style={{
                      fontFamily: theme.fontFamily.base,
                      fontSize: theme.typography.body.fontSize,
                      fontWeight: 600,
                      color: statusTokens.foreground,
                    }}
                  >
                    {toast.message}
                  </span>
                  {toast.description && (
                    <span style={{ fontFamily: theme.fontFamily.base, fontSize: theme.typography.caption.fontSize, color: statusTokens.foreground }}>
                      {toast.description}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={() => dismiss(toast.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: statusTokens.foreground,
                    lineHeight: 0,
                  }}
                >
                  <Icon name="close" size="sm" color={statusTokens.foreground} />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

/** Throws outside a `ToastProvider` - unlike `useTheme` (which silently falls back to light mode via a context default), there is no sane default toast queue to fall back to, so this fails loudly instead. */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
