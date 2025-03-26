import {
  AlreadyExistsError,
  CreationError,
  DeletionError,
  NotFoundError,
  UpdateError,
} from 'src/shared/errors/crud-erros';
import { DbError } from 'src/drizzle/drizzle.errors';

export type CreateUserInDbError = AlreadyExistsError | DbError | CreationError;

export type GetUserFromDbError = DbError | NotFoundError;

export type UpdateUserInDbError = DbError | NotFoundError | UpdateError;

export type DeleteUserInDbError = DbError | NotFoundError | DeletionError;
