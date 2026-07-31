# apps/worker

The background Worker service (Blueprint Ch.1 §3): Church Pulse
recomputation, notification fan-out, and scheduled sweeps (silent-drift,
follow-up SLA, attendance-completeness). Consumes the EventBridge/SQS
Engagement Signal bus described in Blueprint Ch.4.

**Status:** registered as a real Nx project (Sprint 0 Milestone 2). No queue consumers or scheduled jobs yet, per this milestone's scope.
