import { UserRepository } from '../../domain/user.repositories';
import { DatabaseService } from 'src/database/app/database.service';
import { Injectable, Logger } from '@nestjs/common';
import { errAsync, okAsync, Result, ResultAsync } from 'neverthrow';
import {
  RefreshToken,
  UniqueUserColumn,
  User,
} from '../../domain/user.entities';
import {
  CreateRefreshTokenDto,
  CreateUserDto,
  UpdateUserDto,
} from '../../domain/user.dtos';
import {
  CreateRefreshTokenInDbError,
  CreateUserInDbError,
  DeleteAllRefreshTokensFromDbError,
  DeleteAllRefreshTokensByUserFromDbError,
  DeleteUserInDbError,
  GetRefreshTokenFromDbError,
  GetUserFromDbError,
  UpdateUserInDbError,
  DeleteRefreshTokenByUserIdFromDbError,
  DeleteExpiredRefreshTokensFromDbError,
} from '../user.errors';
import { and, eq, lt } from 'drizzle-orm';
import { DB_ERRORS, DbError } from 'src/shared/infra/errors/db-errors';
import {
  AlreadyExistsError,
  CreationError,
  CRUD_ERRORS,
  NotFoundError,
  UpdateError,
  DeletionError,
} from 'src/shared/infra/errors/crud-erros';

@Injectable()
export class UserRepositoryDatabase implements UserRepository {
  private readonly logger = new Logger(UserRepositoryDatabase.name);
  constructor(private readonly orm: DatabaseService) {}

  async create(
    createUserDto: CreateUserDto,
  ): Promise<Result<User, CreateUserInDbError>> {
    // Check if user already exists
    const user = await this.findByUniqueColumn({
      name: 'email',
      value: createUserDto.email,
    });
    if (user.isOk()) {
      this.logger.error('createUserInDb', 'User already exists');
      const alreadyExistsError: AlreadyExistsError = {
        type: CRUD_ERRORS.ALREADY_EXISTS,
        error: new Error('User already exists'),
      };
      return errAsync(alreadyExistsError);
    }

    // Create user in db
    const result = await ResultAsync.fromPromise(
      this.orm.db
        .insert(this.orm.schema.userTable)
        .values(createUserDto)
        .returning(),
      (e) => {
        return e instanceof Error ? e : new Error(String(e));
      },
    );

    // Handle db errors
    if (result.isErr()) {
      this.logger.error('createUserInDb', result.error);
      const error: DbError = {
        type: DB_ERRORS.DB_ERROR,
        error: new Error(String(result.error)),
      };
      return errAsync(error);
    }

    // Handle user creation errors
    if (result.value.length === 0) {
      this.logger.error('createUserInDb', 'No user returned from db');
      const creationError: CreationError = {
        type: CRUD_ERRORS.CREATION_ERROR,
        error: new Error('No user returned from db'),
      };
      return errAsync(creationError);
    }

    // Return created user
    const [createdUser] = result.value;
    return okAsync(createdUser);
  }

  async findByUniqueColumn(
    column: UniqueUserColumn,
  ): Promise<Result<User, GetUserFromDbError>> {
    const result = await ResultAsync.fromPromise(
      this.orm.db
        .select()
        .from(this.orm.schema.userTable)
        .where(eq(this.orm.schema.userTable[column.name], column.value)),
      (e) => {
        return e instanceof Error ? e : new Error(String(e));
      },
    );

    // Handle db errors
    if (result.isErr()) {
      this.logger.error('getUserFromDbByEmail', result.error);
      const dbError: DbError = {
        type: DB_ERRORS.DB_ERROR,
        error: new Error(String(result.error)),
      };
      return errAsync(dbError);
    }

    // If no user is found, return error
    if (result.value.length === 0) {
      this.logger.error('getUserFromDbByEmail', 'User not found in db');
      const notFoundError: NotFoundError = {
        type: CRUD_ERRORS.NOT_FOUND,
        error: new Error('User not found in db'),
      };
      return errAsync(notFoundError);
    }

    // Return found user
    const [user] = result.value;
    return okAsync(user);
  }

  async updateByUniqueColumn(
    column: UniqueUserColumn,
    updateUserDto: UpdateUserDto,
  ): Promise<Result<User, UpdateUserInDbError>> {
    // Check if user exists
    const user = await this.findByUniqueColumn(column);
    if (user.isErr()) {
      if (user.error.type === CRUD_ERRORS.NOT_FOUND) {
        this.logger.error('updateUser', 'User to update not found in db');
        return errAsync(user.error);
      }
      this.logger.error('updateUser', user.error);
      return errAsync(user.error);
    }

    // If user exists, update user in db
    const result = await ResultAsync.fromPromise(
      this.orm.db
        .update(this.orm.schema.userTable)
        .set(updateUserDto)
        .where(eq(this.orm.schema.userTable[column.name], column.value))
        .returning(),
      (e) => {
        return e instanceof Error ? e : new Error(String(e));
      },
    );

    // Handle db errors
    if (result.isErr()) {
      this.logger.error('updateUserInDbById', result.error);
      const dbError: DbError = {
        type: DB_ERRORS.DB_ERROR,
        error: new Error(String(result.error)),
      };
      return errAsync(dbError);
    }

    // If no user is returned from db, return error
    if (result.value.length === 0) {
      this.logger.error('updateUserInDbById', 'No user returned from db');
      const updateError: UpdateError = {
        type: CRUD_ERRORS.UPDATE_ERROR,
        error: new Error('No user returned from db'),
      };
      return errAsync(updateError);
    }

    // Return updated user
    const [updatedUser] = result.value;
    return okAsync(updatedUser);
  }

  async deleteByUniqueColumn(
    column: UniqueUserColumn,
  ): Promise<Result<User, DeleteUserInDbError>> {
    // Check if user exists
    const user = await this.findByUniqueColumn(column);
    if (user.isErr()) {
      if (user.error.type === CRUD_ERRORS.NOT_FOUND) {
        this.logger.error('deleteUser', 'User to delete not found in db');
        return errAsync(user.error);
      }
      this.logger.error('deleteUser', user.error);
      return errAsync(user.error);
    }

    // If user exists, delete user in db
    const result = await ResultAsync.fromPromise(
      this.orm.db
        .delete(this.orm.schema.userTable)
        .where(eq(this.orm.schema.userTable[column.name], column.value))
        .returning(),
      (e) => {
        return e instanceof Error ? e : new Error(String(e));
      },
    );

    // Handle db errors
    if (result.isErr()) {
      this.logger.error('deleteUser', result.error);
      const dbError: DbError = {
        type: DB_ERRORS.DB_ERROR,
        error: new Error(String(result.error)),
      };
      return errAsync(dbError);
    }

    // If no user is returned from db, return error
    if (result.value.length === 0) {
      this.logger.error('deleteUser', 'No user returned from db');
      const deletionError: DeletionError = {
        type: CRUD_ERRORS.DELETION_ERROR,
        error: new Error('No user returned from db'),
      };
      return errAsync(deletionError);
    }

    // Return deleted user
    const [deletedUser] = result.value;
    return okAsync(deletedUser);
  }

  async findAll(): Promise<Result<User[], DbError>> {
    const result = await ResultAsync.fromPromise(
      this.orm.db.select().from(this.orm.schema.userTable),
      (e) => {
        return e instanceof Error ? e : new Error(String(e));
      },
    );

    // Handle db errors
    if (result.isErr()) {
      this.logger.error('findAll', result.error);
      const dbError: DbError = {
        type: DB_ERRORS.DB_ERROR,
        error: new Error(String(result.error)),
      };
      return errAsync(dbError);
    }

    // Return all users
    return okAsync(result.value);
  }

  async createRefreshToken(
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

  async findRefreshTokensByUserId(
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

  async deleteRefreshTokenByUserId(
    userId: number,
    hashedToken: string,
  ): Promise<Result<void, DeleteRefreshTokenByUserIdFromDbError>> {
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

    return okAsync(undefined);
  }

  async deleteAllRefreshTokenByUserId(
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

  async deleteAllRefreshTokens(): Promise<
    Result<void, DeleteAllRefreshTokensFromDbError>
  > {
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

  async deleteExpiredRefreshTokens(): Promise<
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
