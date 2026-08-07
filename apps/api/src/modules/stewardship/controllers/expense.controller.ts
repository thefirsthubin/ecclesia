import { BadRequestException, Body, Controller, Get, Param, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RbacGuard, RecordLevelPolicyGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { attachExpenseReceiptSchema, rejectExpenseSchema, requestExpenseSchema } from '@ecclesia/contracts';
import type { AttachExpenseReceiptInput, RejectExpenseInput, RequestExpenseInput } from '@ecclesia/contracts';
import type { Response } from 'express';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import { StorageService } from '../../../platform/storage/storage.service';
import {
  ExpenseCreateResourceContextGuard,
  ExpenseListResourceContextGuard,
  ExpenseResourceContextGuard,
} from '../guards/expense-resource-context.guard';
import { ExpenseService } from '../services/expense.service';

/** `[Remaining Engineering Sprint, Milestone 11]` Same allow-list
 * `StorageService.MIME_TO_EXTENSION` recognizes - a receipt is either a
 * photo of a paper receipt or a PDF, never anything else. */
const RECEIPT_UPLOAD_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
/** 10 MB - generous for a phone photo of a receipt, small enough that this
 * process's local disk (`StorageService`'s own doc comment on why it's
 * local, not S3, for now) can't be filled by a handful of uploads. */
const RECEIPT_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

interface UploadedFileLike {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

/** PRD §17.3's "Expense: request/approve" rows, FR-STW-09, BR-STW-07/08. */
@Controller('expenses')
export class ExpenseController {
  constructor(
    private readonly expenseService: ExpenseService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @RequirePermission('stewardship.expense.request')
  @UseGuards(ExpenseCreateResourceContextGuard, RbacGuard)
  request(@CurrentActor() actor: ActorContext, @Body(new ZodValidationPipe(requestExpenseSchema)) body: RequestExpenseInput) {
    return this.expenseService.request(actor, body);
  }

  /** `GET /expenses` (Stewardship Web Admin sprint's Expense approval
   * queue - see `ExpenseService.list`'s own doc comment). Declared before
   * `:id`, the same convention every other module's list + getById pair
   * already follows. Mirrors `FinancialTransactionController.listByBranch`'s
   * unvalidated `state` query param exactly - no `ZodValidationPipe`
   * schema for it there either, so none is introduced here for
   * consistency. */
  @Get()
  @RequirePermission('stewardship.expense.read')
  @UseGuards(ExpenseListResourceContextGuard, RbacGuard)
  list(@CurrentActor() actor: ActorContext, @Query('state') state?: string) {
    return this.expenseService.list(actor, state);
  }

  @Get(':id')
  @RequirePermission('stewardship.expense.read')
  @UseGuards(ExpenseResourceContextGuard, RbacGuard)
  getById(@Param('id') id: string) {
    return this.expenseService.getById(id);
  }

  /** FR-STW-09: approver must not be the requester -
   * `DIFFERENT_ACTOR_THAN_RECORDER`, reused (see `ExpenseResourceContextGuard`'s
   * doc comment); the first consumer of `RecordLevelPolicyGuard` outside
   * the Financial Transaction sub-flow. */
  @Post(':id/approve')
  @RequirePermission('stewardship.expense.approve')
  @UseGuards(ExpenseResourceContextGuard, RbacGuard, RecordLevelPolicyGuard)
  approve(@CurrentActor() actor: ActorContext, @Param('id') id: string) {
    return this.expenseService.approve(actor, id);
  }

  @Post(':id/reject')
  @RequirePermission('stewardship.expense.approve')
  @UseGuards(ExpenseResourceContextGuard, RbacGuard, RecordLevelPolicyGuard)
  reject(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(rejectExpenseSchema)) body: RejectExpenseInput,
  ) {
    return this.expenseService.reject(actor, id, body);
  }

  @Post(':id/pay')
  @RequirePermission('stewardship.expense.pay')
  @UseGuards(ExpenseResourceContextGuard, RbacGuard)
  pay(@CurrentActor() actor: ActorContext, @Param('id') id: string) {
    return this.expenseService.pay(actor, id);
  }

  @Post(':id/receipt')
  @RequirePermission('stewardship.expense.receipt')
  @UseGuards(ExpenseResourceContextGuard, RbacGuard)
  attachReceipt(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(attachExpenseReceiptSchema)) body: AttachExpenseReceiptInput,
  ) {
    return this.expenseService.attachReceipt(actor, id, body);
  }

  /**
   * `[Remaining Engineering Sprint, Milestone 11]` The Receipt Upload
   * workflow's actual "upload a file" step - `attachReceipt` above (kept
   * unchanged) still only records an already-uploaded key. Same guard/
   * permission as `attachReceipt` (this *is* that action, just with the
   * upload folded into the one request rather than a separate
   * upload-then-attach round trip the Web Admin client would otherwise
   * have to sequence itself). `FileInterceptor('file', ...)` matches the
   * `FormData` field name the frontend's `ReceiptUploadPanel` sends.
   */
  @Post(':id/receipt/upload')
  @RequirePermission('stewardship.expense.receipt')
  @UseGuards(ExpenseResourceContextGuard, RbacGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: RECEIPT_UPLOAD_MAX_BYTES } }))
  async uploadReceipt(@CurrentActor() actor: ActorContext, @Param('id') id: string, @UploadedFile() file?: UploadedFileLike) {
    if (!file) {
      throw new BadRequestException('A receipt file is required');
    }
    if (!RECEIPT_UPLOAD_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`Unsupported file type '${file.mimetype}' - only JPEG, PNG, WebP, or PDF receipts are accepted`);
    }
    const { storageKey } = await this.storageService.save(file.buffer, file.mimetype);
    return this.expenseService.attachReceipt(actor, id, { receiptStorageKey: storageKey });
  }

  /**
   * `[Remaining Engineering Sprint, Milestone 11]` Preview Receipt -
   * streams a previously uploaded receipt back. Gated by the same
   * `.read` permission/guard every other `getById`-shaped read on this
   * controller uses, since a receipt is just an attachment of the Expense
   * record the caller can already read.
   */
  @Get(':id/receipt')
  @RequirePermission('stewardship.expense.read')
  @UseGuards(ExpenseResourceContextGuard, RbacGuard)
  async getReceipt(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const expense = await this.expenseService.getById(id);
    if (!expense.receiptStorageKey) {
      throw new BadRequestException('This Expense has no receipt attached yet');
    }
    const { buffer, mimeType } = await this.storageService.read(expense.receiptStorageKey);
    res.set({ 'Content-Type': mimeType, 'Cache-Control': 'private, max-age=0, no-store' });
    return buffer;
  }
}
