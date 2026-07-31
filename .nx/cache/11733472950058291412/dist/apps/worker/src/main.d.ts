/**
 * Entry point for the Ecclesia Worker service (Blueprint Ch.1 §3, Ch.4).
 *
 * Owns, once implemented: Church Pulse recomputation, notification
 * fan-out, and scheduled sweeps (silent-drift, follow-up SLA,
 * attendance-completeness), consuming the EventBridge/SQS Engagement
 * Signal bus described in Blueprint Ch.4.
 *
 * This Sprint 0 milestone intentionally contains no job logic, no queue
 * consumers, and no business rules - only enough to prove the app is a
 * real, buildable, runnable Nx project. `bootstrap` is exported (rather
 * than run as an unconditional top-level side effect) specifically so it
 * is unit-testable; it only executes automatically when this file is the
 * process entry point.
 */
export declare function bootstrap(): void;
//# sourceMappingURL=main.d.ts.map