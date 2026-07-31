import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service';

/**
 * Placeholder root controller. This is intentionally the only route in
 * the application - it exists to prove the HTTP layer, DI container, and
 * build pipeline work end to end. Bounded-context controllers (e.g.
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
