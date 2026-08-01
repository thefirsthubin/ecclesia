import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../platform/database/database.module';
import { RbacPlatformModule } from '../../platform/rbac/rbac-platform.module';
import { PeopleModule } from '../people/people.module';
import { ExpenseController } from './controllers/expense.controller';
import { FinancialTransactionController } from './controllers/financial-transaction.controller';
import { PledgeController } from './controllers/pledge.controller';
import { ProjectController } from './controllers/project.controller';
import { ExpenseCreateResourceContextGuard, ExpenseResourceContextGuard } from './guards/expense-resource-context.guard';
import {
  FinancialTransactionCreateResourceContextGuard,
  FinancialTransactionListResourceContextGuard,
  FinancialTransactionResourceContextGuard,
} from './guards/financial-transaction-resource-context.guard';
import { PledgeCreateResourceContextGuard, PledgeResourceContextGuard } from './guards/pledge-resource-context.guard';
import { ProjectCreateResourceContextGuard, ProjectResourceContextGuard } from './guards/project-resource-context.guard';
import { ExpenseRepository } from './repositories/expense.repository';
import { FinancialTransactionRepository } from './repositories/financial-transaction.repository';
import { PledgeRepository } from './repositories/pledge.repository';
import { ProjectRepository } from './repositories/project.repository';
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
 * Exports nothing yet - no other bounded-context module currently
 * consumes a Stewardship service, unlike People/Pastoral Care's mutual
 * dependency or Gatherings' consumption of both.
 */
@Module({
  imports: [DatabaseModule, RbacPlatformModule, PeopleModule],
  controllers: [FinancialTransactionController, ExpenseController, ProjectController, PledgeController],
  providers: [
    FinancialTransactionRepository,
    ExpenseRepository,
    ProjectRepository,
    PledgeRepository,
    FinancialTransactionService,
    ExpenseService,
    ProjectService,
    PledgeService,
    FinancialTransactionCreateResourceContextGuard,
    FinancialTransactionResourceContextGuard,
    FinancialTransactionListResourceContextGuard,
    ExpenseCreateResourceContextGuard,
    ExpenseResourceContextGuard,
    ProjectCreateResourceContextGuard,
    ProjectResourceContextGuard,
    PledgeCreateResourceContextGuard,
    PledgeResourceContextGuard,
  ],
})
export class StewardshipModule {}
