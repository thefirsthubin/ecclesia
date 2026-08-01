import { Test } from '@nestjs/testing';
import type { HealthCheckResult } from '@nestjs/terminus';
import { HealthCheckService, MemoryHealthIndicator, TerminusModule } from '@nestjs/terminus';

import { HealthController } from './health.controller';

describe('HealthController', () => {
  // Both memory indicators are mocked in every test below, deliberately -
  // Sprint 1.2 verification hit this for real: an unmocked
  // `MemoryHealthIndicator.checkRSS()` reported "Used rss exceeded the set
  // threshold" against a perfectly healthy Jest worker process (RSS in a
  // process with SWC/ts-jest/Nest/Terminus all loaded routinely runs
  // higher than a lean deployed API's threshold). A unit test asserting
  // this controller's own logic must not be at the mercy of the ambient
  // memory footprint of whatever machine or CI runner happens to execute
  // it - that is what makes a test flaky rather than deterministic.
  it('reports ok when both memory indicators pass', async () => {
    const checkHeap = jest.fn().mockResolvedValue({ memory_heap: { status: 'up' } });
    const checkRSS = jest.fn().mockResolvedValue({ memory_rss: { status: 'up' } });

    const moduleRef = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
    })
      .overrideProvider(MemoryHealthIndicator)
      .useValue({ checkHeap, checkRSS })
      .compile();

    const controller = moduleRef.get(HealthController);
    const result: HealthCheckResult = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.info).toHaveProperty('memory_heap');
    expect(result.info).toHaveProperty('memory_rss');
  });

  it('checks both heap and RSS thresholds via MemoryHealthIndicator', async () => {
    const checkHeap = jest.fn().mockResolvedValue({ memory_heap: { status: 'up' } });
    const checkRSS = jest.fn().mockResolvedValue({ memory_rss: { status: 'up' } });

    const moduleRef = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
    })
      .overrideProvider(MemoryHealthIndicator)
      .useValue({ checkHeap, checkRSS })
      .compile();

    const controller = moduleRef.get(HealthController);
    await controller.check();

    expect(checkHeap).toHaveBeenCalledWith('memory_heap', expect.any(Number));
    expect(checkRSS).toHaveBeenCalledWith('memory_rss', expect.any(Number));
  });

  it('surfaces a real, unmocked memory indicator failure as a ServiceUnavailableException', async () => {
    // The one test that deliberately exercises the real indicator, so the
    // "a genuinely unhealthy process fails the check" path is still
    // covered - pinned to an impossible-to-satisfy threshold (1 byte)
    // instead of a real-world one, so the assertion is about behavior,
    // not about how much memory this machine happens to be using.
    const moduleRef = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
    }).compile();

    const health = moduleRef.get(HealthCheckService);
    const memory = moduleRef.get(MemoryHealthIndicator);

    await expect(health.check([() => memory.checkRSS('memory_rss', 1)])).rejects.toThrow();
  });

  it('propagates a rejected HealthCheckService.check() rather than swallowing it', async () => {
    const failure = new Error('health check aggregation failed');
    const moduleRef = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
    })
      .overrideProvider(HealthCheckService)
      .useValue({ check: jest.fn().mockRejectedValue(failure) })
      .compile();

    const controller = moduleRef.get(HealthController);
    await expect(controller.check()).rejects.toThrow('health check aggregation failed');
  });
});
