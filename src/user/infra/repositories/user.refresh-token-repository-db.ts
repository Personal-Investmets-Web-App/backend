import { Injectable, Logger } from '@nestjs/common';
import { errAsync, okAsync, Result, ResultAsync } from 'neverthrow';
import { DatabaseService } from 'src/database/app/database.service';
import { CreateRefreshTokenDto } from 'src/user/domain/user.dtos';
import { RefreshToken } from 'src/user/domain/user.entities';
import { and, eq, lt } from 'drizzle-orm';
import { RefreshTokenRepository } from 'src/user/domain/user.repositories';
import {
  CreateRefreshTokenInDbError,
  DeleteAllRefreshTokensByUserFromDbError,
  DeleteAllRefreshTokensFromDbError,
  DeleteExpiredRefreshTokensFromDbError,
  DeleteRefreshTokenByUserIdFromDbError,
  GetRefreshTokenFromDbError,
} from '../user.errors';
import { DB_ERRORS, DbError } from 'src/shared/infra/errors/db-errors';
import {
  CreationError,
  CRUD_ERRORS,
  DeletionError,
  NotFoundError,
} from 'src/shared/infra/errors/crud-erros';

@Injectable()
export class UserRefreshTokenRepositoryDatabase
  implements RefreshTokenRepository
{
  private readonly logger = new Logger(UserRefreshTokenRepositoryDatabase.name);
  constructor(private readonly orm: DatabaseService) {}

  async create(
    createRefreshTokenDto: CreateRefreshTokenDto,
  ): Promise<Result<RefreshToken, CreateRefreshTokenInDbError>> {
    const result = await ResultAsync.fromPromise(
      this.orm.db
        .insert(this.orm.schema.refreshTokenTable)
        .values(createRefreshTokenDto)
        .returning(),
      (e) => {
        return e instanceof Error ? e : new Error(String(e));
      },
    );

    // Handle db errors
    if (result.isErr()) {
      this.logger.error('createRefreshToken', result.error);
      const dbError: DbError = {
        type: DB_ERRORS.DB_ERROR,
        error: new Error(String(result.error)),
      };
      return errAsync(dbError);
    }

    // If no refresh token is returned from db, return error
    if (result.value.length === 0) {
      this.logger.error(
        'createRefreshToken',
        'No refresh token returned from db',
      );
      const creationError: CreationError = {
        type: CRUD_ERRORS.CREATION_ERROR,
        error: new Error('No refresh token returned from db'),
      };
      return errAsync(creationError);
    }

    // Return created refresh token
    const [createdRefreshToken] = result.value;
    return okAsync(createdRefreshToken);
  }

  async findByUserId(
    userId: number,
  ): Promise<Result<RefreshToken[], GetRefreshTokenFromDbError>> {
    const result = await ResultAsync.fromPromise(
      this.orm.db
        .select()
        .from(this.orm.schema.refreshTokenTable)
        .where(eq(this.orm.schema.refreshTokenTable.userId, userId)),
      (e) => {
        return e instanceof Error ? e : new Error(String(e));
      },
    );

    // Handle db errors
    if (result.isErr()) {
      this.logger.error('findRefreshTokenByUserId', result.error);
      const dbError: DbError = {
        type: DB_ERRORS.DB_ERROR,
        error: new Error(String(result.error)),
      };
      return errAsync(dbError);
    }

    // If no refresh token is returned from db, return error
    if (result.value.length === 0) {
      this.logger.error(
        'findRefreshTokenByUserId',
        'No refresh token returned from db',
      );
      const notFoundError: NotFoundError = {
        type: CRUD_ERRORS.NOT_FOUND,
        error: new Error('No refresh token returned from db'),
      };
      return errAsync(notFoundError);
    }

    // Return found refresh token
    return okAsync(result.value);
  }

  async deleteByUserIdAndHashedToken(
    userId: number,
    hashedToken: string,
  ): Promise<Result<RefreshToken, DeleteRefreshTokenByUserIdFromDbError>> {
    const result = await ResultAsync.fromPromise(
      this.orm.db
        .delete(this.orm.schema.refreshTokenTable)
        .where(
          and(
            eq(this.orm.schema.refreshTokenTable.userId, userId),
            eq(this.orm.schema.refreshTokenTable.hashedToken, hashedToken),
          ),
        )
        .returning(),
      (e) => {
        return e instanceof Error ? e : new Error(String(e));
      },
    );

    // Handle db errors
    if (result.isErr()) {
      this.logger.error('deleteRefreshTokenByUserId', result.error);
      const dbError: DbError = {
        type: DB_ERRORS.DB_ERROR,
        error: new Error(String(result.error)),
      };
      return errAsync(dbError);
    }

    // If no refresh token is returned from db, return error
    if (result.value.length === 0) {
      this.logger.error(
        'deleteRefreshTokenByUserId',
        'No refresh token returned from db',
      );
      const deletionError: DeletionError = {
        type: CRUD_ERRORS.DELETION_ERROR,
        error: new Error('No refresh token returned from db'),
      };
      return errAsync(deletionError);
    }

    // Return deleted refresh token
    const [deletedRefreshToken] = result.value;
    return okAsync(deletedRefreshToken);
  }

  async deleteAllByUserId(
    userId: number,
  ): Promise<Result<void, DeleteAllRefreshTokensByUserFromDbError>> {
    const result = await ResultAsync.fromPromise(
      this.orm.db
        .delete(this.orm.schema.refreshTokenTable)
        .where(eq(this.orm.schema.refreshTokenTable.userId, userId))
        .returning(),
      (e) => {
        return e instanceof Error ? e : new Error(String(e));
      },
    );

    // Handle db errors
    if (result.isErr()) {
      this.logger.error('deleteRefreshTokenByUserId', result.error);
      const dbError: DbError = {
        type: DB_ERRORS.DB_ERROR,
        error: new Error(String(result.error)),
      };
      return errAsync(dbError);
    }

    // If no refresh token is returned from db, return error
    if (result.value.length === 0) {
      this.logger.error(
        'deleteRefreshTokenByUserId',
        'No refresh token returned from db',
      );
      const deletionError: DeletionError = {
        type: CRUD_ERRORS.DELETION_ERROR,
        error: new Error('No refresh token returned from db'),
      };
      return errAsync(deletionError);
    }

    return okAsync(undefined);
  }

  async deleteAll(): Promise<Result<void, DeleteAllRefreshTokensFromDbError>> {
    const result = await ResultAsync.fromPromise(
      this.orm.db.delete(this.orm.schema.refreshTokenTable).returning(),
      (e) => {
        return e instanceof Error ? e : new Error(String(e));
      },
    );

    // Handle db errors
    if (result.isErr()) {
      this.logger.error('deleteAllRefreshTokens', result.error);
      const dbError: DbError = {
        type: DB_ERRORS.DB_ERROR,
        error: new Error(String(result.error)),
      };
      return errAsync(dbError);
    }

    // Return deleted refresh tokens
    return okAsync(undefined);
  }

  async deleteExpired(): Promise<
    Result<void, DeleteExpiredRefreshTokensFromDbError>
  > {
    const result = await ResultAsync.fromPromise(
      this.orm.db
        .delete(this.orm.schema.refreshTokenTable)
        .where(lt(this.orm.schema.refreshTokenTable.expiresAt, new Date()))
        .returning(),
      (e) => {
        return e instanceof Error ? e : new Error(String(e));
      },
    );

    // Handle db errors
    if (result.isErr()) {
      this.logger.error('deleteExpiredRefreshTokens', result.error);
      const dbError: DbError = {
        type: DB_ERRORS.DB_ERROR,
        error: new Error(String(result.error)),
      };
      return errAsync(dbError);
    }

    return okAsync(undefined);
  }
}
