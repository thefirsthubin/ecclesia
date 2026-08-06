import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, HttpStatus } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { Request, Response } from 'express';

interface ErrorBody {
  statusCode: number;
  path: string;
  timestamp: string;
  message: string | string[];
  [key: string]: unknown;
}

/**
 * Workspace-wide exception filter (Sprint 1.2). Every response the API
 * ever sends for an error - a validation failure, an `RbacGuard` denial
 * (Blueprint §9.4), an unexpected bug - passes through here, so the
 * response shape is one thing, not "whatever the throwing code happened
 * to return."
 *
 * Registered as an `APP_FILTER` provider (see `platform.module.ts`)
 * rather than `app.useGlobalFilters()` in `main.ts`, so Nest's DI
 * container can inject the request-scoped pino logger into it - a
 * manually constructed filter in `main.ts` would not get that.
 *
 * engineering-principles.md §5 (Security by Default) states "denials are
 * logged as rigorously as approvals" - every 4xx here logs at `warn`
 * (this includes the 403s `RbacGuard`/`RecordLevelPolicyGuard` will throw
 * once wired to a controller), and every 5xx logs at `error` with the
 * full exception for diagnosis. Nothing that reaches this filter is
 * dropped silently.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(@InjectPinoLogger(AllExceptionsFilter.name) private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = AllExceptionsFilter.resolveMessage(exception, status);

    const body: ErrorBody = {
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      message,
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error({ err: exception, path: request.url }, 'Unhandled exception');
    } else {
      this.logger.warn({ statusCode: status, path: request.url }, 'Request denied');
    }

    response.status(status).json(body);
  }

  private static resolveMessage(exception: unknown, status: number): string | string[] {
    if (exception instanceof HttpException) {
      const httpResponse = exception.getResponse();
      if (typeof httpResponse === 'string') {
        return httpResponse;
      }
      if (
        typeof httpResponse === 'object' &&
        httpResponse !== null &&
        'message' in httpResponse &&
        (typeof (httpResponse as { message: unknown }).message === 'string' ||
          Array.isArray((httpResponse as { message: unknown }).message))
      ) {
        return (httpResponse as { message: string | string[] }).message;
      }
      return exception.message;
    }
    // Never leak an unknown internal error's message to the client - only
    // the generic reason phrase for the status code.
    return status === HttpStatus.INTERNAL_SERVER_ERROR ? 'Internal server error' : 'Unexpected error';
  }
}
