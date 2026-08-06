import type { SQSClient } from '@aws-sdk/client-sqs';
import { DeleteMessageCommand, ReceiveMessageCommand } from '@aws-sdk/client-sqs';
import type { PinoLogger } from 'nestjs-pino';
import { engagementSignalEnvelopeSchema } from '@ecclesia/contracts';
import type { EngagementSignalEnvelope } from '@ecclesia/contracts';

import type { ProcessedEventRepository } from './processed-event.repository';
import type { PrismaService } from '../database/prisma.service';

/**
 * Base class for the three SQS consumers named in Blueprint §10.2
 * (`insights-consumer`, `notification-consumer`, `audit-consumer`). This
 * vertical slice implements one concrete subclass, `InsightsConsumer` -
 * see `apps/worker/WORKER_DESIGN_NOTES.md` for why the other two are
 * disclosed follow-up work, not built here.
 *
 * Long-polls the queue (`WaitTimeSeconds: 20`, the AWS-recommended max, to
 * minimize empty-receive cost - not a Blueprint citation, an ordinary SQS
 * operational default), then for each message:
 *
 * 1. Parses and validates the body against `engagementSignalEnvelopeSchema`
 *    (`@ecclesia/contracts`). A message that fails validation is logged
 *    and deleted (not retried) - malformed input at this boundary is a
 *    producer bug, not a transient failure worth redelivering.
 * 2. Calls `ProcessedEventRepository.tryRecord` (Blueprint §10.5's
 *    idempotency check). If this `eventId` was already processed by this
 *    consumer, the message is deleted with no further action - "a no-op
 *    on replay," per that section.
 * 3. Otherwise calls the subclass's `handle()` with the parsed envelope.
 *    On success, the message is deleted. On failure, the message is
 *    **not** deleted - it becomes visible again after the queue's
 *    visibility timeout and is retried on a future poll, the ordinary SQS
 *    at-least-once redelivery behavior. No dead-letter queue is
 *    configured or modeled in this codebase; a message that fails
 *    indefinitely will simply keep retrying until whatever
 *    infrastructure-level DLQ policy the real provisioned queue has (not
 *    built in this milestone) intervenes.
 *
 * `[Row-Level Security sprint]` Now takes a `PrismaService` too. Every
 * `EngagementSignalEnvelope` this class ever processes always carries a
 * `branchId` (`@ecclesia/contracts`'s own schema) - `processMessage()`
 * wraps the idempotency check and the subclass's `handle()` call in one
 * `prisma.runInBranchScope(envelope.branchId, ...)`, so every repository
 * query anywhere in `handle()`'s call stack (however deep) transparently
 * runs inside that one branch-scoped transaction. See
 * `db/ROW_LEVEL_SECURITY_DESIGN_NOTES.md` §4.
 */
export abstract class SqsConsumerBase {
  protected constructor(
    private readonly sqsClient: SQSClient,
    private readonly queueUrl: string,
    private readonly consumerName: string,
    private readonly processedEventRepository: ProcessedEventRepository,
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService,
  ) {}

  /** Subclass-specific handling of one validated, not-yet-processed envelope. */
  protected abstract handle(envelope: EngagementSignalEnvelope): Promise<void>;

  /**
   * One long-poll receive-and-process cycle. Returns the number of
   * messages received (0 on an empty poll) - the unit the test suite
   * exercises directly, since `run()` itself is an unbounded loop not
   * meaningfully unit-testable.
   */
  async pollOnce(): Promise<number> {
    const result = await this.sqsClient.send(
      new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20,
      }),
    );

    const messages = result.Messages ?? [];
    for (const message of messages) {
      await this.processMessage(message.Body, message.ReceiptHandle);
    }
    return messages.length;
  }

  private async processMessage(body: string | undefined, receiptHandle: string | undefined): Promise<void> {
    if (!receiptHandle) {
      this.logger.warn('SQS message had no ReceiptHandle - skipping');
      return;
    }

    const parsed = engagementSignalEnvelopeSchema.safeParse(body ? JSON.parse(body) : undefined);
    if (!parsed.success) {
      this.logger.error({ error: parsed.error.message }, 'Malformed Engagement Signal envelope - deleting without processing');
      await this.deleteMessage(receiptHandle);
      return;
    }
    const envelope = parsed.data;

    // `[Row-Level Security sprint]` The idempotency check and `handle()`
    // both run inside one `runInBranchScope` transaction, scoped to this
    // envelope's own `branchId` - every model-delegate query either of
    // them makes (directly or through a repository several calls deep)
    // transparently resolves to that transaction's connection. A thrown
    // error anywhere inside - including from `tryRecord` itself, not just
    // `handle()` - is now caught here and treated as "leave for
    // redelivery," a small, disclosed behavior change from before this
    // sprint (previously only `handle()`'s own errors were caught this
    // way; a `tryRecord` failure would have propagated uncaught out of
    // `processMessage()` entirely).
    try {
      const isNew = await this.prisma.runInBranchScope(envelope.branchId, async () => {
        const recorded = await this.processedEventRepository.tryRecord(this.consumerName, envelope.eventId, envelope.branchId);
        if (!recorded) {
          return false;
        }
        await this.handle(envelope);
        return true;
      });

      if (!isNew) {
        this.logger.info({ eventId: envelope.eventId }, 'Duplicate delivery - already processed, no-op');
      }
      await this.deleteMessage(receiptHandle);
    } catch (error) {
      // Deliberately not deleted - see class doc comment on SQS's own
      // visibility-timeout redelivery being the retry mechanism here.
      this.logger.error({ eventId: envelope.eventId, error }, 'Failed to process Engagement Signal - leaving for redelivery');
    }
  }

  private async deleteMessage(receiptHandle: string): Promise<void> {
    await this.sqsClient.send(new DeleteMessageCommand({ QueueUrl: this.queueUrl, ReceiptHandle: receiptHandle }));
  }

  /**
   * Runs `pollOnce()` in a loop until `signal` is aborted (Blueprint
   * ADR-007: apps/worker is a long-running ECS Fargate container, not a
   * Lambda invoked once per message - this loop is that container's main
   * work loop for one consumer command). `main.ts`'s dispatcher is what
   * actually constructs the `AbortSignal` from a process signal (SIGTERM).
   */
  async run(signal: AbortSignal): Promise<void> {
    while (!signal.aborted) {
      await this.pollOnce();
    }
  }
}
