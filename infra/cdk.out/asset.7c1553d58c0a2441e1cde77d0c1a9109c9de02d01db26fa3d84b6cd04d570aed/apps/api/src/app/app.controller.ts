import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service';

/**
 * Placeholder root controller (`GET /v1`, versioned per Blueprint §14.7
 * since Sprint 1.2 - see `main.ts`'s `enableVersioning`). Still exists
 * only to prove the HTTP layer, DI container, and build pipeline work end
 * to end; `PlatformModule`'s `/health` is the real infrastructure check
 * now (Sprint 1.2). Bounded-context controllers (e.g.
 * `stewardship/financial-transaction.controller.ts`, per Blueprint §6.4)
 * are added in later milestones as their owning modules are built.
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getStatus(): { service: string; status: string } {
    return this.appService.getStatus();
  }
}
