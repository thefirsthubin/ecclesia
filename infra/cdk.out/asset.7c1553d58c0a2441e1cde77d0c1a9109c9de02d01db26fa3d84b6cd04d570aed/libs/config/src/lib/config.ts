/**
 * Placeholder entry point for shared, typed configuration-loading utilities (Blueprint §6.2). Real content - per-Branch configuration access (gathering types, Church Pulse weights, the Poimen-gate flag from PRD §24 OQ-02, follow-up SLA defaults) - lands alongside the Prisma/database milestone.
 *
 * This module is scaffolding: it exists so the library registers as a
 * real, buildable, testable Nx project ahead of the milestone that adds
 * its actual contents. It intentionally contains no business logic, no
 * database models, and no authentication code, per Sprint 0 scope.
 */
export const CONFIG_LIB = 'config' as const;
