import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import * as path from 'node:path';

import type { EnvConfig } from '../config/env.schema';

/**
 * `[Remaining Engineering Sprint, Milestone 11]` Minimal file-storage
 * adapter behind an injectable service, closing the Stewardship Receipt
 * Upload gap `attachExpenseReceiptSchema`'s own doc comment named:
 * "this milestone does not implement the file upload itself... only
 * recording the storage key of an already-uploaded receipt."
 * `ExpenseController`'s new `POST /expenses/:id/receipt/upload` is the
 * first (and, today, only) consumer.
 *
 * `[Design Decision, disclosed]` Backed by the local filesystem, not
 * AWS S3 - deliberately, per this sprint's own brief ("Out of scope: AWS
 * Deployment... implement [storage] using the project's existing
 * architectural conventions... Do NOT introduce unnecessary
 * dependencies"). This codebase has no AWS SDK dependency anywhere in
 * `apps/api` yet (only `apps/api`'s `EventBridgePublisherService` talks
 * to AWS, via `@aws-sdk/client-eventbridge`) and no S3 bucket exists in
 * `infra/` today - adding one would be exactly the "AWS Deployment" work
 * this sprint is scoped away from. `RECEIPT_STORAGE_DIR` (default
 * `./uploads/receipts`, `env.schema.ts`) is a normal, git-ignored working
 * directory under the API process, the same class of local state
 * `db/migrations` or a dev SQLite file would be - fine for local/dev use,
 * exactly as `ECCLESIA_ROADMAP.md`'s "not yet deployed" Cloud Runtime
 * status already describes this whole application's current reality.
 *
 * **Known limitation, disclosed rather than hidden**: once the Cloud
 * Runtime Infrastructure (`apps/api` on ECS Fargate) is actually deployed,
 * a Fargate task's filesystem is ephemeral and not shared across task
 * instances - a receipt uploaded to one task's disk would not be visible
 * to a request served by a different task, and would be lost on
 * redeploy/restart. This is a real, disclosed pre-condition for
 * production readiness, the same way `AlertPriorityCard`'s "forward to
 * Assistant Pastor" gap or the `apps/worker` "system actor" gap are
 * disclosed rather than silently left for someone to discover later. The
 * fix (swap `StorageService`'s body for an S3-backed implementation) is a
 * one-file change precisely because every consumer only depends on this
 * class's two public methods, never on "it's a local file" as an
 * assumption.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly baseDir: string;

  constructor(configService: ConfigService<EnvConfig, true>) {
    this.baseDir = path.resolve(process.cwd(), configService.get('RECEIPT_STORAGE_DIR', { infer: true }));
  }

  /**
   * Persists `buffer` under a freshly generated, collision-proof storage
   * key (never derived from the caller-supplied file name, which is
   * untrusted input - no path traversal is possible since the key alone
   * determines the on-disk path). Returns the key
   * `attachExpenseReceiptSchema`'s `receiptStorageKey` expects.
   */
  async save(buffer: Buffer, mimeType: string): Promise<{ storageKey: string; sizeBytes: number }> {
    await mkdir(this.baseDir, { recursive: true });
    const extension = extensionForMimeType(mimeType);
    const storageKey = `${randomUUID()}${extension}`;
    await writeFile(path.join(this.baseDir, storageKey), buffer);
    this.logger.debug(`Stored receipt upload as '${storageKey}' (${buffer.length} bytes)`);
    return { storageKey, sizeBytes: buffer.length };
  }

  /** Reads a previously `save()`d file back, for the Preview Receipt flow (`GET /expenses/:id/receipt`). */
  async read(storageKey: string): Promise<{ buffer: Buffer; mimeType: string }> {
    assertSafeStorageKey(storageKey);
    try {
      const buffer = await readFile(path.join(this.baseDir, storageKey));
      return { buffer, mimeType: mimeTypeForExtension(path.extname(storageKey)) };
    } catch {
      throw new NotFoundException(`No stored file found for key '${storageKey}'`);
    }
  }

  /**
   * Deletes a previously `save()`d file - the Replace Receipt flow's
   * cleanup step (the old file is removed once the new one has been
   * attached), and Remove Receipt's own action. Best-effort: a missing
   * file is not an error here (the caller may be cleaning up a key that
   * was never actually written, or was already removed).
   */
  async remove(storageKey: string): Promise<void> {
    assertSafeStorageKey(storageKey);
    try {
      await unlink(path.join(this.baseDir, storageKey));
    } catch {
      // Already gone - nothing further to do.
    }
  }
}

/** Guards against a `receiptStorageKey` containing a path separator or
 * traversal sequence reaching outside `baseDir` - defense in depth, even
 * though every key this service itself ever produces is a bare
 * `randomUUID() + extension` with no such characters. */
function assertSafeStorageKey(storageKey: string): void {
  if (storageKey.includes('/') || storageKey.includes('\\') || storageKey.includes('..')) {
    throw new NotFoundException(`Invalid storage key '${storageKey}'`);
  }
}

/** Small, deliberately narrow allow-list - the same set
 * `RECEIPT_UPLOAD_ALLOWED_MIME_TYPES` (`ExpenseController`) validates an
 * incoming upload against, so every key this service ever produces has an
 * extension this map also recognizes on the way back out. */
const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};
const EXTENSION_TO_MIME: Record<string, string> = Object.fromEntries(
  Object.entries(MIME_TO_EXTENSION).map(([mime, extension]) => [extension, mime]),
);

function extensionForMimeType(mimeType: string): string {
  return MIME_TO_EXTENSION[mimeType] ?? '.bin';
}

function mimeTypeForExtension(extension: string): string {
  return EXTENSION_TO_MIME[extension] ?? 'application/octet-stream';
}
