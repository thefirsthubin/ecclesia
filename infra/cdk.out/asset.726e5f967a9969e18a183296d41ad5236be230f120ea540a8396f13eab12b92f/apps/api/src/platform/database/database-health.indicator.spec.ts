import { HealthCheckError } from '@nestjs/terminus';

import { DatabaseHealthIndicator } from './database-health.indicator';
import type { PrismaService } from './prisma.service';

describe('DatabaseHealthIndicator', () => {
  it('reports up when the database responds to SELECT 1', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) } as unknown as PrismaService;
    const indicator = new DatabaseHealthIndicator(prisma);

    const result = await indicator.isHealthy('database');

    expect(result).toEqual({ database: { status: 'up' } });
  });

  it('throws a HealthCheckError with the failure reason when the query fails', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockRejectedValue(new Error('connection refused')),
    } as unknown as PrismaService;
    const indicator = new DatabaseHealthIndicator(prisma);

    await expect(indicator.isHealthy('database')).rejects.toThrow(HealthCheckError);
    await expect(indicator.isHealthy('database')).rejects.toMatchObject({
      causes: { database: { status: 'down', message: 'connection refused' } },
    });
  });

  it('falls back to a generic message when the thrown value is not an Error', async () => {
    const prisma = { $queryRaw: jest.fn().mockRejectedValue('not an Error instance') } as unknown as PrismaService;
    const indicator = new DatabaseHealthIndicator(prisma);

    await expect(indicator.isHealthy('database')).rejects.toMatchObject({
      causes: { database: { status: 'down', message: 'Unknown database error' } },
    });
  });
});
