import * as bcrypt from 'bcrypt';
import * as argon2 from 'argon2';
import { ResultAsync, errAsync, okAsync } from 'neverthrow';

export const saltRounds = 10;

export enum CRIPTO_ERRORS {
  HASH_ERROR = 'HASH_ERROR',
  COMPARE_ERROR = 'COMPARE_ERROR',
  HASH_LONG_STRING_ERROR = 'HASH_LONG_STRING_ERROR',
  VERIFY_LONG_STRING_ERROR = 'VERIFY_LONG_STRING_ERROR',
}

export type HashError = {
  type: CRIPTO_ERRORS.HASH_ERROR;
  error: Error;
};

export type CompareError = {
  type: CRIPTO_ERRORS.COMPARE_ERROR;
  error: Error;
};

export type HashLongStringError = {
  type: CRIPTO_ERRORS.HASH_LONG_STRING_ERROR;
  error: Error;
};

export type VerifyLongStringError = {
  type: CRIPTO_ERRORS.VERIFY_LONG_STRING_ERROR;
  error: Error;
};

export const hashPassword = async (password: string) => {
  const result = await ResultAsync.fromPromise(
    bcrypt.hash(password, saltRounds),
    (e) => {
      return e instanceof Error ? e : new Error(String(e));
    },
  );

  if (result.isErr()) {
    const hashError: HashError = {
      type: CRIPTO_ERRORS.HASH_ERROR,
      error: result.error,
    };
    return errAsync(hashError);
  }

  return okAsync(result.value);
};

export const comparePassword = async (password: string, hash: string) => {
  const result = await ResultAsync.fromPromise(
    bcrypt.compare(password, hash),
    (e) => {
      return e instanceof Error ? e : new Error(String(e));
    },
  );

  if (result.isErr()) {
    const compareError: CompareError = {
      type: CRIPTO_ERRORS.COMPARE_ERROR,
      error: result.error,
    };
    return errAsync(compareError);
  }

  return okAsync(result.value);
};

export const hashLongString = async (longString: string) => {
  const result = await ResultAsync.fromPromise(argon2.hash(longString), (e) => {
    return e instanceof Error ? e : new Error(String(e));
  });

  if (result.isErr()) {
    const hashLongStringError: HashLongStringError = {
      type: CRIPTO_ERRORS.HASH_LONG_STRING_ERROR,
      error: result.error,
    };
    return errAsync(hashLongStringError);
  }

  return okAsync(result.value);
};

export const verifyLongString = async (longString: string, hash: string) => {
  const result = await ResultAsync.fromPromise(
    argon2.verify(hash, longString),
    (e) => {
      return e instanceof Error ? e : new Error(String(e));
    },
  );

  if (result.isErr()) {
    const verifyLongStringError: VerifyLongStringError = {
      type: CRIPTO_ERRORS.VERIFY_LONG_STRING_ERROR,
      error: result.error,
    };
    return errAsync(verifyLongStringError);
  }

  return okAsync(result.value);
};
