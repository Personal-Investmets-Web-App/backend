import { GetUserFromDbError } from 'src/user/infra/user.errors';

export enum AUTH_ERRORS {
  USER_HAS_NO_PASSWORD_ERROR = 'USER_HAS_NO_PASSWORD_ERROR',
  USER_PASSWORD_IS_INVALID_ERROR = 'USER_PASSWORD_IS_INVALID_ERROR',
  ISSUE_TOKEN_ERROR = 'ISSUE_TOKEN_ERROR',
  EXPIRED_REFRESH_TOKEN_ERROR = 'EXPIRED_REFRESH_TOKEN_ERROR',
}

export type ValidateUserWithPasswordError =
  | GetUserFromDbError
  | UserHasNoPasswordError
  | UserPasswordIsInvalidError;

export type UserHasNoPasswordError = {
  type: AUTH_ERRORS.USER_HAS_NO_PASSWORD_ERROR;
  error: Error;
};

export type UserPasswordIsInvalidError = {
  type: AUTH_ERRORS.USER_PASSWORD_IS_INVALID_ERROR;
  error: Error;
};

export type IssueTokenError = {
  type: AUTH_ERRORS.ISSUE_TOKEN_ERROR;
  error: Error;
};

export type ExpiredRefreshTokenError = {
  type: AUTH_ERRORS.EXPIRED_REFRESH_TOKEN_ERROR;
  error: Error;
};
