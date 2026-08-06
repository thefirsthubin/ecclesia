import { Injectable } from '@nestjs/common';
import type { Alert, AlertStatus, PulseScoreScopeType } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface CreateAlertRecord {
  branchId: string;
  scopeType: PulseScoreScopeType;
  scopeId: string;
  alertType: string;
  message?: string;
}

export interface ResolveAlertRecord {
  status: AlertStatus;
  resolvedByPersonId: string;
  resolvedAt: Date;
}

/** Prisma-backed persistence for `insights.alerts` (FR-INS-03/05). */
@Injectable()
export class AlertRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateAlertRecord): Promise<Alert> {
    return this.prisma.alert.create({ data: input });
  }

  findById(id: string): Promise<Alert | null> {
    return this.prisma.alert.findUnique({ where: { id } });
  }

  /**
   * Whether an `OPEN` alert of this type already exists for this scope -
   * avoids re-raising a duplicate alert every time
   * `PulseScoreService`'s compute-on-read recomputation finds the same
   * still-ongoing decline. No scheduler/dedup-window infrastructure
   * exists in this codebase to do this any other way - see
   * `INSIGHTS_DESIGN_NOTES.md`.
   */
  async hasOpenAlert(scopeType: PulseScoreScopeType, scopeId: string, alertType: string): Promise<boolean> {
    const existing = await this.prisma.alert.findFirst({
      where: { scopeType, scopeId, alertType, status: 'OPEN' },
    });
    return existing !== null;
  }

  /** Every alert for a scope, most recent first - the per-dashboard
   * "alert inbox" slice (branch/bacenta/cluster dashboards each embed
   * this for their own scope; see `INSIGHTS_DESIGN_NOTES.md` for why
   * there is no separate cross-cutting multi-scope inbox endpoint). */
  listByScope(scopeType: PulseScoreScopeType, scopeId: string): Promise<Alert[]> {
    return this.prisma.alert.findMany({ where: { scopeType, scopeId }, orderBy: { triggeredAt: 'desc' } });
  }

  resolve(id: string, input: ResolveAlertRecord): Promise<Alert> {
    return this.prisma.alert.update({
      where: { id },
      data: { status: input.status, resolvedByPersonId: input.resolvedByPersonId, resolvedAt: input.resolvedAt },
    });
  }
}
