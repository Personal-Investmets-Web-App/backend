import { ZodSchema } from 'zod';

/**
 * Decorator factory that validates the return value of a Controller method against a Zod schema.
 *
 * MUST BE RIGHT AT THE TOP OF THE CONTROLLER METHOD.
 * @param schema The Zod schema to validate the return value against
 */
export function SerializeOutput(schema: ZodSchema) {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      // Call the original method to get the return value
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = originalMethod.apply(this, args);

      // Handle promises (async functions)
      if (result instanceof Promise) {
        // For async functions, return a new promise
        return result.then((value) => {
          // Validate the resolved value
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const parsed = schema.parse(value);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return parsed; // Return the parsed value
        });
      } else {
        // For synchronous functions, validate immediately
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const parsed = schema.parse(result);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return parsed; // Return the parsed value
      }
    };

    return descriptor;
  };
}
