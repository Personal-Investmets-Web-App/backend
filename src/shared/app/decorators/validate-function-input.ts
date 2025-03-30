import { ZodSchema } from 'zod';

/**
 * Decorator factory that validates function parameters against a Zod schema
 * @param schema The Zod schema to validate against
 * @param paramIndex The index of the parameter to validate (defaults to 0)
 */
export function ValidateFuncInput(schema: ZodSchema, paramIndex: number = 0) {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      // Validate the parameter against the schema
      const result = schema.safeParse(args[paramIndex]);

      if (!result.success) {
        throw new Error(`Validation error: ${result.error.message}`);
      }

      // Replace the original parameter with the parsed value
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      args[paramIndex] = result.data;

      // Call the original method with validated arguments
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
