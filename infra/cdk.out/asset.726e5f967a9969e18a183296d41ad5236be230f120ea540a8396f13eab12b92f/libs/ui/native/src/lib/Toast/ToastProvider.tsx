import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, View, Text as RNText } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { Icon } from '../Icon';
import type { StatusKey } from '@ecclesia/ui-core';

export interface ToastOptions {
  status?: StatusKey;
  message: string;
  description?: string;
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
 * React Native equivalent of `ui-web`'s `ToastProvider`/`useToast`. RN has
 * no DOM-portal concept, so instead of portaling to a document root, this
 * provider renders the toast stack as an absolutely-positioned `View`
 * layered over its own `children` - the same expectation as `ui-web`'s
 * version, mount once near the app root. `pointerEvents="box-none"` on the
 * covering layer lets touches pass through to whatever's underneath
 * except where an actual toast card is rendered, so a toast never blocks
 * interaction with the rest of the screen the way `Modal`'s scrim
 * deliberately does.
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
      <View style={{ flex: 1 }}>{children}</View>
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', bottom: theme.spacing[6], left: theme.spacing[4], right: theme.spacing[4], gap: theme.spacing[2] }}
      >
        {toasts.map((toast) => {
          const statusTokens = theme.colors.status[toast.status];
          return (
            <View
              key={toast.id}
              testID={`toast-${toast.id}`}
              accessible
              accessibilityRole="alert"
              accessibilityLiveRegion={toast.status === 'danger' ? 'assertive' : 'polite'}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: theme.spacing[2],
                padding: theme.spacing[3],
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: statusTokens.border,
                backgroundColor: statusTokens.background,
              }}
            >
              <Icon name={STATUS_ICON[toast.status]} size="sm" color={statusTokens.foreground} />
              <View style={{ flex: 1, gap: theme.spacing[1] }}>
                <RNText style={{ fontFamily: theme.fontFamily.base, fontSize: theme.typography.body.fontSize, fontWeight: '600', color: statusTokens.foreground }}>
                  {toast.message}
                </RNText>
                {toast.description && (
                  <RNText style={{ fontFamily: theme.fontFamily.base, fontSize: theme.typography.caption.fontSize, color: statusTokens.foreground }}>
                    {toast.description}
                  </RNText>
                )}
              </View>
              <Pressable onPress={() => dismiss(toast.id)} accessibilityRole="button" accessibilityLabel="Dismiss notification" hitSlop={8}>
                <Icon name="close" size="sm" color={statusTokens.foreground} />
              </Pressable>
            </View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
