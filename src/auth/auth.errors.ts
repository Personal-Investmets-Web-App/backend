import { GetUserFromDbError } from 'src/users/users.errors';

export type ValidateUserWithPasswordError =
  | GetUserFromDbError
  | UserHasNoPasswordError
  | UserPasswordIsInvalidError;

export type UserHasNoPasswordError = {
  type: 'USER_HAS_NO_PASSWORD_ERROR';
  error: Error;
};

export type UserPasswordIsInvalidError = {
  type: 'USER_PASSWORD_IS_INVALID_ERROR';
  error: Error;
};
