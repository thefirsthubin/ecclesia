import { PrismaClient } from '@prisma/client';
import type { PinoLogger } from 'nestjs-pino';

import { PrismaService } from './prisma.service';

function buildLogger(): PinoLogger {
  return { info: jest.fn() } as unknown as PinoLogger;
}

describe('PrismaService', () => {
  it('connects and logs on module init', async () => {
    const connectSpy = jest.spyOn(PrismaClient.prototype, '$connect').mockResolvedValue(undefined);
    const logger = buildLogger();
    const service = new PrismaService(logger);

    await service.onModuleInit();

    expect(connectSpy).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith('Prisma connected to the database');

    connectSpy.mockRestore();
  });

  it('disconnects and logs on module destroy', async () => {
    const disconnectSpy = jest.spyOn(PrismaClient.prototype, '$disconnect').mockResolvedValue(undefined);
    const logger = buildLogger();
    const service = new PrismaService(logger);

    await service.onModuleDestroy();

    expect(disconnectSpy).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith('Prisma disconnected from the database');

    disconnectSpy.mockRestore();
  });
});
