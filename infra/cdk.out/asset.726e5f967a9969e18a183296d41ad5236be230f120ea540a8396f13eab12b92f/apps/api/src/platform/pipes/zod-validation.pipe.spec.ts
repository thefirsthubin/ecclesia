import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().int().nonnegative(),
  });

  it('returns the parsed value unchanged when it satisfies the schema', () => {
    const pipe = new ZodValidationPipe(schema);
    const input = { name: 'Ama', age: 34 };
    expect(pipe.transform(input)).toEqual(input);
  });

  it('strips unknown keys, since Zod objects are stripped by default', () => {
    const pipe = new ZodValidationPipe(schema);
    const result = pipe.transform({ name: 'Ama', age: 34, unexpected: 'field' });
    expect(result).toEqual({ name: 'Ama', age: 34 });
  });

  it('throws BadRequestException with per-field issues when validation fails', () => {
    const pipe = new ZodValidationPipe(schema);
    try {
      pipe.transform({ name: '', age: -1 });
      throw new Error('expected transform to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as {
        message: string;
        issues: Array<{ path: string; message: string }>;
      };
      expect(response.message).toBe('Validation failed');
      expect(response.issues.map((issue) => issue.path)).toEqual(expect.arrayContaining(['name', 'age']));
    }
  });
});
