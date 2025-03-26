import { Injectable, Logger } from '@nestjs/common';
import { DrizzleService } from 'src/drizzle/drizzle.service';
import {
  User,
  UserInsertDto,
  UserInsertSchema,
  UserUpdateDto,
  UserUpdateSchema,
} from './users.models';
import { Result, ResultAsync, errAsync, okAsync } from 'neverthrow';
import { eq } from 'drizzle-orm';
import {
  CreationError,
  NotFoundError,
  UpdateError,
  DeletionError,
  AlreadyExistsError,
} from 'src/shared/errors/crud-erros';
import { hashPassword } from 'src/shared/utils/cripto';
import { ValidateFuncInput } from 'src/shared/decorators/validate-function-input';
import { DbError } from 'src/drizzle/drizzle.errors';
import {
  CreateUserInDbError,
  DeleteUserInDbError,
  GetUserFromDbError,
  UpdateUserInDbError,
} from './users.errors';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(private readonly orm: DrizzleService) {}

  @ValidateFuncInput(UserInsertSchema)
  async createUserInDb(
    userInsertDto: UserInsertDto,
  ): Promise<Result<User, CreateUserInDbError>> {
    // Check if user already exists
    const user = await this.getUserFromDbByEmail(userInsertDto.email);
    if (user.isOk()) {
      this.logger.error('createUserInDb', 'User already exists');
      const alreadyExistsError: AlreadyExistsError = {
        type: 'ALREADY_EXISTS',
        error: new Error('User already exists'),
      };
      return errAsync(alreadyExistsError);
    }

    // Hash password if provided
    if (userInsertDto.password) {
      const hashedPassword = await hashPassword(userInsertDto.password);
      userInsertDto.password = hashedPassword;
    }

    // Create user in db
    const result = await ResultAsync.fromPromise(
      this.orm.db
        .insert(this.orm.schema.usersTable)
        .values(userInsertDto)
        .returning(),
      (e) => {
        return e instanceof Error ? e : new Error(String(e));
      },
    );

    // Handle db errors
    if (result.isErr()) {
      this.logger.error('createUserInDb', result.error);
      const error: DbError = {
        type: 'DB_ERROR',
        error: new Error(String(result.error)),
      };
      return errAsync(error);
    }

    // Handle user creation errors
    if (result.value.length === 0) {
      this.logger.error('createUserInDb', 'No user returned from db');
      const creationError: CreationError = {
        type: 'CREATION_ERROR',
        error: new Error('No user returned from db'),
      };
      return errAsync(creationError);
    }

    // Return created user
    const [createdUser] = result.value;
    return okAsync(createdUser);
  }

  async getUserFromDbByEmail(
    email: string,
  ): Promise<Result<User, GetUserFromDbError>> {
    // Get user by email
    const result = await ResultAsync.fromPromise(
      this.orm.db
        .select()
        .from(this.orm.schema.usersTable)
        .where(eq(this.orm.schema.usersTable.email, email)),
      (e) => {
        return e instanceof Error ? e : new Error(String(e));
      },
    );

    // Handle db errors
    if (result.isErr()) {
      this.logger.error('getUserFromDbByEmail', result.error);
      const dbError: DbError = {
        type: 'DB_ERROR',
        error: new Error(String(result.error)),
      };
      return errAsync(dbError);
    }

    // If no user is found, return error
    if (result.value.length === 0) {
      this.logger.error('getUserFromDbByEmail', 'User not found in db');
      const notFoundError: NotFoundError = {
        type: 'NOT_FOUND',
        error: new Error('User not found in db'),
      };
      return errAsync(notFoundError);
    }

    // Return found user
    const [user] = result.value;
    return okAsync(user);
  }

  async getUserFromDbById(
    id: number,
  ): Promise<Result<User, GetUserFromDbError>> {
    // Get user by id
    const result = await ResultAsync.fromPromise(
      this.orm.db
        .select()
        .from(this.orm.schema.usersTable)
        .where(eq(this.orm.schema.usersTable.id, id)),
      (e) => {
        return e instanceof Error ? e : new Error(String(e));
      },
    );

    // Handle db errors
    if (result.isErr()) {
      this.logger.error('getUserFromDbById', result.error);
      const dbError: DbError = {
        type: 'DB_ERROR',
        error: new Error(String(result.error)),
      };
      return errAsync(dbError);
    }

    // If no user is found, return error
    if (result.value.length === 0) {
      this.logger.error('User not found in db');
      const notFoundError: NotFoundError = {
        type: 'NOT_FOUND',
        error: new Error('User not found in db'),
      };
      return errAsync(notFoundError);
    }

    // Return found user
    const [user] = result.value;
    return okAsync(user);
  }

  @ValidateFuncInput(UserUpdateSchema, 1)
  async updateUserInDbById(
    id: number,
    userUpdateDto: UserUpdateDto,
  ): Promise<Result<User, UpdateUserInDbError>> {
    // Check if user exists
    const user = await this.getUserFromDbById(id);
    if (user.isErr()) {
      if (user.error.type === 'NOT_FOUND') {
        this.logger.error(
          'updateUserInDbById',
          'User to update not found in db',
        );
        return errAsync(user.error);
      }
      this.logger.error('updateUserInDbById', user.error);
      return errAsync(user.error);
    }

    // If user exists, update user in db
    const result = await ResultAsync.fromPromise(
      this.orm.db
        .update(this.orm.schema.usersTable)
        .set(userUpdateDto)
        .where(eq(this.orm.schema.usersTable.id, id))
        .returning(),
      (e) => {
        return e instanceof Error ? e : new Error(String(e));
      },
    );

    // Handle db errors
    if (result.isErr()) {
      this.logger.error('updateUserInDbById', result.error);
      const dbError: DbError = {
        type: 'DB_ERROR',
        error: new Error(String(result.error)),
      };
      return errAsync(dbError);
    }

    // If no user is returned from db, return error
    if (result.value.length === 0) {
      this.logger.error('updateUserInDbById', 'No user returned from db');
      const updateError: UpdateError = {
        type: 'UPDATE_ERROR',
        error: new Error('No user returned from db'),
      };
      return errAsync(updateError);
    }

    // Return updated user
    const [updatedUser] = result.value;
    return okAsync(updatedUser);
  }

  async deleteUserInDbById(
    id: number,
  ): Promise<Result<User, DeleteUserInDbError>> {
    // Check if user exists
    const user = await this.getUserFromDbById(id);
    if (user.isErr()) {
      if (user.error.type === 'NOT_FOUND') {
        this.logger.error(
          'deleteUserInDbById',
          'User to delete not found in db',
        );
        return errAsync(user.error);
      }
      this.logger.error('deleteUserInDbById', user.error);
      return errAsync(user.error);
    }

    // If user exists, delete user in db
    const result = await ResultAsync.fromPromise(
      this.orm.db
        .delete(this.orm.schema.usersTable)
        .where(eq(this.orm.schema.usersTable.id, id))
        .returning(),
      (e) => {
        return e instanceof Error ? e : new Error(String(e));
      },
    );

    // Handle db errors
    if (result.isErr()) {
      this.logger.error('deleteUserInDbById', result.error);
      const dbError: DbError = {
        type: 'DB_ERROR',
        error: new Error(String(result.error)),
      };
      return errAsync(dbError);
    }

    // If no user is returned from db, return error
    if (result.value.length === 0) {
      this.logger.error('deleteUserInDbById', 'No user returned from db');
      const deletionError: DeletionError = {
        type: 'DELETION_ERROR',
        error: new Error('No user returned from db'),
      };
      return errAsync(deletionError);
    }

    // Return deleted user
    const [deletedUser] = result.value;
    return okAsync(deletedUser);
  }

  @ValidateFuncInput(UserUpdateSchema, 1)
  async updateUserInDbByEmail(
    email: string,
    userUpdateDto: UserUpdateDto,
  ): Promise<Result<User, UpdateUserInDbError>> {
    // Check if user exists
    const user = await this.getUserFromDbByEmail(email);
    if (user.isErr()) {
      if (user.error.type === 'NOT_FOUND') {
        this.logger.error(
          'updateUserInDbByEmail',
          'User to update not found in db',
        );
        return errAsync(user.error);
      }
      this.logger.error('updateUserInDbByEmail', user.error);
      return errAsync(user.error);
    }

    // If user exists, update user in db
    const result = await ResultAsync.fromPromise(
      this.orm.db
        .update(this.orm.schema.usersTable)
        .set(userUpdateDto)
        .where(eq(this.orm.schema.usersTable.email, email))
        .returning(),
      (e) => {
        return e instanceof Error ? e : new Error(String(e));
      },
    );

    // Handle db errors
    if (result.isErr()) {
      this.logger.error('updateUserInDbByEmail', result.error);
      const dbError: DbError = {
        type: 'DB_ERROR',
        error: new Error(String(result.error)),
      };
      return errAsync(dbError);
    }

    // If no user is returned from db, return error
    if (result.value.length === 0) {
      this.logger.error('updateUserInDbByEmail', 'No user returned from db');
      const updateError: UpdateError = {
        type: 'UPDATE_ERROR',
        error: new Error('No user returned from db'),
      };
      return errAsync(updateError);
    }

    // Return updated user
    const [updatedUser] = result.value;
    return okAsync(updatedUser);
  }

  async deleteUserInDbByEmail(
    email: string,
  ): Promise<Result<User, DeleteUserInDbError>> {
    // Check if user exists
    const user = await this.getUserFromDbByEmail(email);
    if (user.isErr()) {
      if (user.error.type === 'NOT_FOUND') {
        this.logger.error(
          'deleteUserInDbByEmail',
          'User to delete not found in db',
        );
        return errAsync(user.error);
      }
      this.logger.error('deleteUserInDbByEmail', user.error);
      return errAsync(user.error);
    }

    // If user exists, delete user in db
    const result = await ResultAsync.fromPromise(
      this.orm.db
        .delete(this.orm.schema.usersTable)
        .where(eq(this.orm.schema.usersTable.email, email))
        .returning(),
      (e) => {
        return e instanceof Error ? e : new Error(String(e));
      },
    );

    // Handle db errors
    if (result.isErr()) {
      this.logger.error('deleteUserInDbByEmail', result.error);
      const dbError: DbError = {
        type: 'DB_ERROR',
        error: new Error(String(result.error)),
      };
      return errAsync(dbError);
    }

    // If no user is returned from db, return error
    if (result.value.length === 0) {
      this.logger.error('deleteUserInDbByEmail', 'No user returned from db');
      const deletionError: DeletionError = {
        type: 'DELETION_ERROR',
        error: new Error('No user returned from db'),
      };
      return errAsync(deletionError);
    }

    // Return deleted user
    const [deletedUser] = result.value;
    return okAsync(deletedUser);
  }

  async getAllUsersFromDb(): Promise<Result<User[], DbError>> {
    // Get all users from db
    const result = await ResultAsync.fromPromise(
      this.orm.db.select().from(this.orm.schema.usersTable),
      (e) => {
        return e instanceof Error ? e : new Error(String(e));
      },
    );

    // Handle db errors
    if (result.isErr()) {
      this.logger.error('getAllUsersFromDb', result.error);
      const dbError: DbError = {
        type: 'DB_ERROR',
        error: new Error(String(result.error)),
      };
      return errAsync(dbError);
    }

    // Return all users
    return okAsync(result.value);
  }
}
