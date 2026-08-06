import type { ArgumentsHost } from '@nestjs/common';
import { BadRequestException, ForbiddenException, HttpStatus } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';

import { AllExceptionsFilter } from './all-exceptions.filter';

function buildHost(request: { url: string }): { host: ArgumentsHost; response: { status: jest.Mock; json: jest.Mock } } {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;
  return { host, response };
}

function buildLogger(): PinoLogger {
  return { warn: jest.fn(), error: jest.fn() } as unknown as PinoLogger;
}

describe('AllExceptionsFilter', () => {
  it('formats a known HttpException using its own status and message', () => {
    const logger = buildLogger();
    const filter = new AllExceptionsFilter(logger);
    const { host, response } = buildHost({ url: '/v1/stewardship/transactions/1/verify' });

    filter.catch(new ForbiddenException('Actor lacks permission for this action'), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.FORBIDDEN,
        path: '/v1/stewardship/transactions/1/verify',
        message: 'Actor lacks permission for this action',
      }),
    );
  });

  it('preserves per-field validation issues from BadRequestException', () => {
    const logger = buildLogger();
    const filter = new AllExceptionsFilter(logger);
    const { host, response } = buildHost({ url: '/v1/people' });

    filter.catch(new BadRequestException({ message: ['name is required'], issues: [] }), host);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: HttpStatus.BAD_REQUEST, message: ['name is required'] }),
    );
  });

  it('logs 4xx denials at warn, not error, per engineering-principles.md §5', () => {
    const logger = buildLogger();
    const filter = new AllExceptionsFilter(logger);
    const { host } = buildHost({ url: '/v1/health' });

    filter.catch(new ForbiddenException(), host);

    expect(logger.warn).toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('does not leak an unknown internal error message to the client, but does log it at error', () => {
    const logger = buildLogger();
    const filter = new AllExceptionsFilter(logger);
    const { host, response } = buildHost({ url: '/v1/anything' });
    const bug = new Error('database credentials: hunter2');

    filter.catch(bug, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal server error' }),
    );
    expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ err: bug }), 'Unhandled exception');
  });
});
