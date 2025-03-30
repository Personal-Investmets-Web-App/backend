export enum CRUD_ERRORS {
  NOT_FOUND = 'NOT_FOUND',
  CREATION_ERROR = 'CREATION_ERROR',
  UPDATE_ERROR = 'UPDATE_ERROR',
  DELETION_ERROR = 'DELETION_ERROR',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
}
export type NotFoundError = { type: CRUD_ERRORS.NOT_FOUND; error: Error };
export type CreationError = { type: CRUD_ERRORS.CREATION_ERROR; error: Error };
export type UpdateError = { type: CRUD_ERRORS.UPDATE_ERROR; error: Error };
export type DeletionError = { type: CRUD_ERRORS.DELETION_ERROR; error: Error };
export type AlreadyExistsError = {
  type: CRUD_ERRORS.ALREADY_EXISTS;
  error: Error;
};
