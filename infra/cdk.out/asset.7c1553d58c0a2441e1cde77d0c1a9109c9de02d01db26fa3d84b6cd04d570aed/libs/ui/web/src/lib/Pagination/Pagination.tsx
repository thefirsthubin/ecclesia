import { useTheme } from '../ThemeProvider';
import { Icon } from '../Icon';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  testId?: string;
}

type PageToken = number | 'ellipsis';

/**
 * Builds the page-number list with `Design System`-appropriate truncation:
 * always show the first and last page, the current page and its immediate
 * neighbors, and collapse everything else into a single `'ellipsis'` token
 * per gap - so a 200-page list never renders 200 buttons.
 *
 * An ellipsis is only ever used to hide **two or more** pages - hiding a
 * single page behind "…" (e.g. `totalPages=5`, `currentPage=2` would
 * otherwise collapse page 4 alone) is worse than just showing it, so the
 * window snaps outward by one in that case instead of inserting an
 * ellipsis for a single hidden page.
 */
function buildPageTokens(currentPage: number, totalPages: number): PageToken[] {
  const tokens: PageToken[] = [];
  const addPage = (page: number) => tokens.push(page);
  let windowStart = Math.max(2, currentPage - 1);
  let windowEnd = Math.min(totalPages - 1, currentPage + 1);

  if (windowStart <= 3) {
    windowStart = 2;
  }
  if (windowEnd >= totalPages - 2) {
    windowEnd = totalPages - 1;
  }

  addPage(1);
  if (windowStart > 2) {
    tokens.push('ellipsis');
  }
  for (let page = windowStart; page <= windowEnd; page += 1) {
    addPage(page);
  }
  if (windowEnd < totalPages - 1) {
    tokens.push('ellipsis');
  }
  if (totalPages > 1) {
    addPage(totalPages);
  }
  return tokens;
}

/**
 * Page navigation for a paginated list/table (Design System v1.0 Part
 * 7.8). A `<nav aria-label="Pagination">` landmark; the current page is a
 * non-interactive `aria-current="page"` element, not a disabled button
 * (disabled buttons are removed from the tab order and announce
 * differently than "current page" - this is the correct semantic, not
 * just a visual choice).
 */
export function Pagination({ currentPage, totalPages, onPageChange, testId }: PaginationProps) {
  const theme = useTheme();
  if (totalPages <= 1) {
    return null;
  }
  const tokens = buildPageTokens(currentPage, totalPages);

  const buttonStyle = (active: boolean) => ({
    minWidth: theme.touchTarget.minWeb,
    height: theme.touchTarget.minWeb,
    padding: `0 ${theme.spacing[2]}px`,
    border: 'none',
    borderRadius: theme.radius.sm,
    backgroundColor: active ? theme.colors.brand.default : 'transparent',
    color: active ? theme.colors.text.inverse : theme.colors.text.primary,
    fontFamily: theme.fontFamily.base,
    fontSize: theme.typography.body.fontSize,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
  });

  return (
    <nav aria-label="Pagination" data-testid={testId}>
      <ul style={{ listStyle: 'none', display: 'flex', alignItems: 'center', gap: theme.spacing[1], margin: 0, padding: 0 }}>
        <li>
          <button
            type="button"
            aria-label="Previous page"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            style={{ ...buttonStyle(false), opacity: currentPage === 1 ? theme.opacity.disabled : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
          >
            <Icon name="chevronLeft" size="sm" />
          </button>
        </li>
        {tokens.map((token, index) =>
          token === 'ellipsis' ? (
            <li key={`ellipsis-${index}`} aria-hidden style={{ padding: `0 ${theme.spacing[1]}px`, color: theme.colors.text.secondary }}>
              …
            </li>
          ) : (
            <li key={token}>
              {token === currentPage ? (
                <span aria-current="page" style={buttonStyle(true)}>
                  {token}
                </span>
              ) : (
                <button type="button" onClick={() => onPageChange(token)} style={buttonStyle(false)}>
                  {token}
                </button>
              )}
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            aria-label="Next page"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            style={{
              ...buttonStyle(false),
              opacity: currentPage === totalPages ? theme.opacity.disabled : 1,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            <Icon name="chevronRight" size="sm" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
