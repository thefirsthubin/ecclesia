import { SQSClient } from '@aws-sdk/client-sqs';
import type { ConfigService } from '@nestjs/config';

import type { EnvConfig } from '../config/env.schema';

/** DI token for the shared `SQSClient` instance - see `events.module.ts`. */
export const SQS_CLIENT = Symbol('SQS_CLIENT');

/**
 * One `SQSClient` per process, shared across every consumer (mirrors
 * `EventBridgePublisherService` constructing its own `EventBridgeClient`
 * internally - the SQS client is provided at module level instead,
 * because unlike the publisher, more than one consumer in this codebase
 * will eventually need it, per Blueprint §10.2's three named queues).
 */
export function sqsClientFactory(configService: ConfigService<EnvConfig, true>): SQSClient {
  return new SQSClient({ region: configService.get('AWS_REGION', { infer: true }) });
}
