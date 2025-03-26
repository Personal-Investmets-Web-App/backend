export type NotFoundError = { type: 'NOT_FOUND'; error: Error };
export type CreationError = { type: 'CREATION_ERROR'; error: Error };
export type UpdateError = { type: 'UPDATE_ERROR'; error: Error };
export type DeletionError = { type: 'DELETION_ERROR'; error: Error };
export type AlreadyExistsError = { type: 'ALREADY_EXISTS'; error: Error };
