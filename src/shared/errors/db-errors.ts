export enum DB_ERRORS {
  DB_ERROR = 'DB_ERROR',
}

export type DbError = { type: DB_ERRORS.DB_ERROR; error: Error };
