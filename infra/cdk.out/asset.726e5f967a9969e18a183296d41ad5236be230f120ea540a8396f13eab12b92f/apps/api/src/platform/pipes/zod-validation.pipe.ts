import type { PipeTransform } from '@nestjs/common';
import { BadRequestException, Injectable } from '@nestjs/common';
// Value import, not `import type` - `schema` is a constructor parameter
// property (`private readonly schema: ZodSchema`) on an `@Injectable()`
// class. With `emitDecoratorMetadata` on (tsconfig.base.json), TypeScript
// needs a real runtime reference here, the same reasoning that keeps
// `Reflector` a value import in `libs/rbac`'s guards.
import { ZodSchema } from 'zod';

/**
 * Per-route validation pipe for the Zod schemas defined in
 * `libs/contracts` (Blueprint §6.3). This is the Zod equivalent of Nest's
 * built-in `ValidationPipe` - deliberately not a drop-in replacement for
 * it, because that pipe is built around class-validator decorators, and
 * this codebase's DTO strategy is Zod schemas, not decorated classes (see
 * `libs/contracts/src/lib/contracts.ts`). Running both validation
 * libraries side by side would mean two competing sources of truth for
 * "what is a valid request" - engineering-principles.md §3, Architecture
 * Before Convenience.
 *
 * Usage, once a real contract schema exists (first real usage lands with
 * the People domain):
 *
 * ```ts
 * @Post()
 * create(@Body(new ZodValidationPipe(createPersonSchema)) body: CreatePersonInput) { ... }
 * ```
 *
 * There is no workspace-wide `app.useGlobalPipes(new ZodValidationPipe(...))`
 * registration, because a single global pipe cannot know which schema
 * applies to which route - each route supplies its own schema at the
 * `@Body()`/`@Query()`/`@Param()` call site instead, same as Nest's own
 * examples show for schema-based (as opposed to class-based) validation.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        issues: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    return result.data;
  }
}
