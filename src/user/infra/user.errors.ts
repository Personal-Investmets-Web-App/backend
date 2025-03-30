import {
  AlreadyExistsError,
  CreationError,
  DeletionError,
  NotFoundError,
  UpdateError,
} from 'src/shared/infra/errors/crud-erros';
import { DbError } from 'src/shared/infra/errors/db-errors';
import { HashError } from 'src/shared/utils/cripto';

export type CreateUserInDbError = AlreadyExistsError | DbError | CreationError;

export type GetUserFromDbError = DbError | NotFoundError;

export type UpdateUserInDbError = DbError | NotFoundError | UpdateError;

export type DeleteUserInDbError = DbError | NotFoundError | DeletionError;

export type CreateUserError = CreateUserInDbError | HashError;
