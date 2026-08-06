import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SQSClient } from '@aws-sdk/client-sqs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { EngagementSignalEnvelope } from '@ecclesia/contracts';

import type { EnvConfig } from '../../platform/config/env.schema';
import { PrismaService } from '../../platform/database/prisma.service';
import { ProcessedEventRepository } from '../../platform/events/processed-event.repository';
import { SQS_CLIENT } from '../../platform/events/sqs-client.provider';
import { SqsConsumerBase } from '../../platform/events/sqs-consumer.base';

/**
 * The `notification-consumer` SQS consumer (Blueprint §10.2). **This is
 * deliberately an idempotency-check-and-log stub, not a real send
 * mechanism** - see `WORKER_DESIGN_NOTES.md`'s "What this milestone
 * deliberately does not build" section (originally written for the first
 * vertical slice, restated here since it now applies to this consumer
 * directly): the PRD never commits to a notification delivery channel
 * anywhere. Every "alert"/"notification" requirement (FR-INS-03/05,
 * FR-STW-08/OQ-07, Pastoral Care §16.2, Ministry §16.3) uses only generic
 * language like "a visible alert"; the only named channel (WhatsApp) is an
 * explicitly parked Horizon 3+ idea contingent on "a defined integration
 * and consent model" that doesn't exist anywhere in this codebase.
 *
 * `handle()` therefore does the one thing that *is* well-defined
 * regardless of eventual channel - consume the message, let
 * `SqsConsumerBase` perform the idempotency check (so a channel added
 * later inherits "already notified, don't resend" for free), and log a
 * structured record of what *would* have been sent. This is not a
 * placeholder to silently forget - it's the honest shape of "notification
 * delivery is a genuinely undecided open question," not an oversight to
 * quietly work around with an invented channel.
 */
@Injectable()
export class NotificationConsumer extends SqsConsumerBase {
  static readonly CONSUMER_NAME = 'notification-consumer';

  constructor(
    @Inject(SQS_CLIENT) sqsClient: SQSClient,
    configService: ConfigService<EnvConfig, true>,
    processedEventRepository: ProcessedEventRepository,
    @InjectPinoLogger(NotificationConsumer.name) private readonly notificationLogger: PinoLogger,
    prisma: PrismaService,
  ) {
    super(
      sqsClient,
      configService.get('SQS_NOTIFICATION_QUEUE_URL', { infer: true }),
      NotificationConsumer.CONSUMER_NAME,
      processedEventRepository,
      notificationLogger,
      prisma,
    );
  }

  protected async handle(envelope: EngagementSignalEnvelope): Promise<void> {
    this.notificationLogger.info(
      {
        eventId: envelope.eventId,
        eventType: envelope.eventType,
        branchId: envelope.branchId,
        subjectPersonId: envelope.subjectPersonId,
        subjectGroupId: envelope.subjectGroupId,
      },
      'Notification-worthy Engagement Signal received - no delivery channel is configured yet (see WORKER_DESIGN_NOTES.md); logged, not sent',
    );
    return Promise.resolve();
  }
}
