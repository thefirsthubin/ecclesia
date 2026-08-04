import { useId, type ReactNode } from 'react';
import { useTheme } from '../ThemeProvider';
import { Icon } from '../Icon';

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** Which item ids are currently expanded - controlled, same pattern as `Tabs`' `activeTabId`. */
  expandedIds: string[];
  onChange: (expandedIds: string[]) => void;
  /** `false` (default): expanding one item collapses any other open item (the common "FAQ" pattern). `true`: any number of items can be open at once (appropriate for, e.g., several independent optional-detail sections on a record page). */
  allowMultiple?: boolean;
  testId?: string;
}

/**
 * Expand/collapse panels (Design System v1.0 Part 7.8) - the second of
 * the two components (alongside `Tabs`) `UI_DESIGN_NOTES.md` flagged as
 * needing real shared interaction-state logic. Each header is a real
 * `<button aria-expanded aria-controls>` (never a `<div onClick>`), each
 * panel a `role="region" aria-labelledby` landmark - so a screen-reader
 * user gets "collapsed"/"expanded" announced on toggle and can navigate
 * directly to an expanded region via the landmarks list, not just by
 * reading linearly.
 */
export function Accordion({ items, expandedIds, onChange, allowMultiple = false, testId }: AccordionProps) {
  const theme = useTheme();
  const idBase = useId();

  const toggle = (id: string) => {
    const isExpanded = expandedIds.includes(id);
    if (allowMultiple) {
      onChange(isExpanded ? expandedIds.filter((existing) => existing !== id) : [...expandedIds, id]);
    } else {
      onChange(isExpanded ? [] : [id]);
    }
  };

  return (
    <div data-testid={testId} style={{ display: 'flex', flexDirection: 'column' }}>
      {items.map((item, index) => {
        const isExpanded = expandedIds.includes(item.id);
        const headerId = `${idBase}-header-${item.id}`;
        const panelId = `${idBase}-panel-${item.id}`;
        return (
          <div key={item.id} style={{ borderBottom: index === items.length - 1 ? 'none' : `1px solid ${theme.colors.border.subtle}` }}>
            <h3 style={{ margin: 0 }}>
              <button
                type="button"
                id={headerId}
                aria-expanded={isExpanded}
                aria-controls={panelId}
                disabled={item.disabled}
                onClick={() => toggle(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: `${theme.spacing[3]}px 0`,
                  border: 'none',
                  background: 'none',
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                  opacity: item.disabled ? theme.opacity.disabled : 1,
                  fontFamily: theme.fontFamily.base,
                  fontSize: theme.typography.body.fontSize,
                  fontWeight: 600,
                  color: theme.colors.text.primary,
                  textAlign: 'left',
                }}
              >
                {item.title}
                <span
                  aria-hidden
                  style={{
                    display: 'inline-flex',
                    transform: isExpanded ? 'rotate(180deg)' : 'none',
                    transition: `transform ${theme.motion.duration.fast}ms`,
                  }}
                >
                  <Icon name="chevronDown" size="sm" />
                </span>
              </button>
            </h3>
            {isExpanded && (
              <div id={panelId} role="region" aria-labelledby={headerId} style={{ paddingBottom: theme.spacing[3], color: theme.colors.text.primary }}>
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
