import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../platform/database/database.module';
import { EventsModule } from '../../platform/events/events.module';
import { RbacPlatformModule } from '../../platform/rbac/rbac-platform.module';
import { StorageModule } from '../../platform/storage/storage.module';
import { PeopleModule } from '../people/people.module';
import { BankDepositConfirmationController } from './controllers/bank-deposit-confirmation.controller';
import { ExpenseController } from './controllers/expense.controller';
import { FinancialTransactionController } from './controllers/financial-transaction.controller';
import { PledgeController } from './controllers/pledge.controller';
import { ProjectController } from './controllers/project.controller';
import {
  BankDepositConfirmationCreateResourceContextGuard,
  BankDepositConfirmationListResourceContextGuard,
} from './guards/bank-deposit-confirmation-resource-context.guard';
import {
  ExpenseCreateResourceContextGuard,
  ExpenseListResourceContextGuard,
  ExpenseResourceContextGuard,
} from './guards/expense-resource-context.guard';
import {
  FinancialTransactionCreateResourceContextGuard,
  FinancialTransactionListResourceContextGuard,
  FinancialTransactionResourceContextGuard,
} from './guards/financial-transaction-resource-context.guard';
import { PledgeCreateResourceContextGuard, PledgeResourceContextGuard } from './guards/pledge-resource-context.guard';
import { ProjectCreateResourceContextGuard, ProjectResourceContextGuard } from './guards/project-resource-context.guard';
import { BankDepositConfirmationRepository } from './repositories/bank-deposit-confirmation.repository';
import { ExpenseRepository } from './repositories/expense.repository';
import { FinancialTransactionRepository } from './repositories/financial-transaction.repository';
import { PledgeRepository } from './repositories/pledge.repository';
import { ProjectRepository } from './repositories/project.repository';
import { BankDepositConfirmationService } from './services/bank-deposit-confirmation.service';
import { ExpenseService } from './services/expense.service';
import { FinancialTransactionService } from './services/financial-transaction.service';
import { PledgeService } from './services/pledge.service';
import { ProjectService } from './services/project.service';

/**
 * StewardshipModule (PRD §13.5 / Blueprint §4.2 module inventory) - the
 * fourth bounded-context module. Internal layout mirrors
 * `PeopleModule`/`PastoralCareModule`/`GatheringsModule`'s own doc
 * comments.
 *
 * Imports `PeopleModule` as an ordinary import (no `forwardRef`) for
 * `GroupScopeService` (Bacenta-recorded Financial Transactions) and
 * `PersonScopeService` (Expense requester scope) - the same cross-module
 * consumption pattern Gatherings already established. Unlike Gatherings,
 * this module does not need anything from Pastoral Care.
 *
 * `[Remaining Engineering Sprint, Milestone 11]` Also imports
 * `StorageModule` now - `ExpenseController`'s new Receipt Upload endpoints
 * are this module's first consumer of `StorageService`.
 *
 * **Exports `FinancialTransactionService`** (Resident Pastor Dashboard -
 * real Giving data milestone) - the first time this module exports
 * anything. `BranchDashboardSummaryService` (`apps/api/src/modules/insights`)
 * needs `sumVerifiedAmountForBranch` for the Giving KPI/trend/growth-series,
 * the same "small, purpose-built public method" cross-module pattern
 * `PeopleModule`/`GatheringsModule`'s own exports already establish.
 */
@Module({
  imports: [DatabaseModule, RbacPlatformModule, EventsModule, PeopleModule, StorageModule],
  controllers: [FinancialTransactionController, ExpenseController, ProjectController, PledgeController, BankDepositConfirmationController],
  providers: [
    FinancialTransactionRepository,
    ExpenseRepository,
    ProjectRepository,
    PledgeRepository,
    BankDepositConfirmationRepository,
    FinancialTransactionService,
    ExpenseService,
    ProjectService,
    PledgeService,
    BankDepositConfirmationService,
    FinancialTransactionCreateResourceContextGuard,
    FinancialTransactionResourceContextGuard,
    FinancialTransactionListResourceContextGuard,
    ExpenseCreateResourceContextGuard,
    ExpenseResourceContextGuard,
    ExpenseListResourceContextGuard,
    ProjectCreateResourceContextGuard,
    ProjectResourceContextGuard,
    PledgeCreateResourceContextGuard,
    PledgeResourceContextGuard,
    BankDepositConfirmationCreateResourceContextGuard,
    BankDepositConfirmationListResourceContextGuard,
  ],
  exports: [FinancialTransactionService],
})
export class StewardshipModule {}
