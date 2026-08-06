import { Injectable } from '@nestjs/common';

/**
 * Placeholder service proving dependency injection is wired correctly.
 * Real service logic is added per bounded-context module (people,
 * pastoral-care, ministry, gatherings, stewardship, insights, platform)
 * in the milestones that follow - not here.
 */
@Injectable()
export class AppService {
  getStatus(): { service: string; status: string } {
    return { service: 'ecclesia-api', status: 'scaffold' };
  }
}
