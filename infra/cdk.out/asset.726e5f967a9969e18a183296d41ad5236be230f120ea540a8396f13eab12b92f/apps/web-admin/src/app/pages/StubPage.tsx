import { EmptyState } from '@ecclesia/ui-web';

export interface StubPageProps {
  title: string;
}

/**
 * STEP 2: "Not every page must be implemented yet. Stub pages are
 * acceptable if clearly identified." This is that explicit identification
 * — an `EmptyState`, not a blank screen or a fake data table.
 */
export function StubPage({ title }: StubPageProps) {
  return (
    <EmptyState
      icon="clock"
      title={`${title} — coming soon`}
      description="This surface hasn't been built yet in this sprint. It's reachable from the sidebar so the application shell's navigation is complete, but its content is still a stub."
    />
  );
}
