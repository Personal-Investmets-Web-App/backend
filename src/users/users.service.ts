import { Injectable, Logger } from '@nestjs/common';
import { DrizzleService } from 'src/drizzle/drizzle.service';
import { CreateUserDto, UpdateUserDto, User } from './users.models';
import { Result, ResultAsync, errAsync, okAsync } from 'neverthrow';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { bcryptConstants } from './utils/constants';
import {
  CreationError,
  NotFoundError,
  UpdateError,
  DeletionError,
  DBError,
  AlreadyExistsError,
} from 'src/utils/shared-errors';

export type CreateUserInDbError =
  | { type: 'ALREADY_EXISTS'; error: AlreadyExistsError }
  | { type: 'DB_ERROR'; error: DBError }
  | { type: 'CREATION_ERROR'; error: CreationError };

export type GetUserFromDbError =
  | { type: 'NOT_FOUND'; error: NotFoundError }
  | { type: 'DB_ERROR'; error: DBError };

export type UpdateUserInDbError =
  | { type: 'NOT_FOUND'; error: NotFoundError }
  | { type: 'DB_ERROR'; error: DBError }
  | { type: 'UPDATE_ERROR'; error: UpdateError };

export type DeleteUserInDbError =
  | { type: 'NOT_FOUND'; error: NotFoundError }
  | { type: 'DB_ERROR'; error: DBError }
  | { type: 'DELETION_ERROR'; error: DeletionError };

export type GetAllUsersFromDbError = { type: 'DB_ERROR'; error: DBError };

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(private readonly orm: DrizzleService) {}

  async createUserInDb(
    createUserDto: CreateUserDto,
  ): Promise<Result<User, CreateUserInDbError>> {
    // Check if user already exists
    const user = await this.getUserFromDbByEmail(createUserDto.email);
    if (user.isOk()) {
      return errAsync({
        type: 'ALREADY_EXISTS',
        error: new AlreadyExistsError('User already exists'),
      });
    }

    // Hash password if provided
    if (createUserDto.password) {
      const hashedPassword = await bcrypt.hash(
        createUserDto.password,
        bcryptConstants.saltRounds,
      );
      createUserDto.password = hashedPassword;
    }

    // Create user in db
    const result = await ResultAsync.fromPromise(
      this.orm.db
        .insert(this.orm.schema.usersTable)
        .values(createUserDto)
        .returning(),
      (e) => {
        this.logger.error('Error creating user in db', e);
        return e instanceof Error ? e : new Error(String(e));
      },
    );

    // Handle db errors
    if (result.isErr()) {
      return errAsync({
        type: 'DB_ERROR',
        error: new DBError(String(result.error)),
      });
    }

    // Handle user creation errors
    if (result.value.length === 0) {
      this.logger.error('No user returned from db');
      return errAsync({
        type: 'CREATION_ERROR',
        error: new CreationError('No user returned from db'),
      });
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
        this.logger.error('Error getting user by email', e);
        return e instanceof Error ? e : new Error(String(e));
      },
    );

    // Handle db errors
    if (result.isErr()) {
      return errAsync({
        type: 'DB_ERROR',
        error: new DBError(String(result.error)),
      });
    }

    // If no user is found, return error
    if (result.value.length === 0) {
      this.logger.error('User not found in db');
      return errAsync({
        type: 'NOT_FOUND',
        error: new NotFoundError('User not found in db'),
      });
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
        this.logger.error('Error getting user by id', e);
        return e instanceof Error ? e : new Error(String(e));
      },
    );

    // Handle db errors
    if (result.isErr()) {
      return errAsync({
        type: 'DB_ERROR',
        error: new DBError(String(result.error)),
      });
    }

    // If no user is found, return error
    if (result.value.length === 0) {
      this.logger.error('User not found in db');
      return errAsync({
        type: 'NOT_FOUND',
        error: new NotFoundError('User not found in db'),
      });
    }

    // Return found user
    const [user] = result.value;
    return okAsync(user);
  }

  async updateUserInDbById(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<Result<User, UpdateUserInDbError>> {
    // Check if user exists
    const user = await this.getUserFromDbById(id);
    if (user.isErr()) {
      if (user.error.type === 'NOT_FOUND') {
        this.logger.error('User to delete not found in db');
        return errAsync(user.error);
      }
      this.logger.error('Error updating user in db', user.error);
      return errAsync(user.error);
    }

    // If user exists, update user in db
    const result = await ResultAsync.fromPromise(
      this.orm.db
        .update(this.orm.schema.usersTable)
        .set(updateUserDto)
        .where(eq(this.orm.schema.usersTable.id, id))
        .returning(),
      (e) => {
        this.logger.error('Error updating user in db', e);
        return e instanceof Error ? e : new Error(String(e));
      },
    );

    // Handle db errors
    if (result.isErr()) {
      return errAsync({
        type: 'DB_ERROR',
        error: new DBError(String(result.error)),
      });
    }

    // If no user is returned from db, return error
    if (result.value.length === 0) {
      this.logger.error('No user returned from db');
      return errAsync({
        type: 'UPDATE_ERROR',
        error: new UpdateError('No user returned from db'),
      });
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
        this.logger.error('User to delete not found in db');
        return errAsync(user.error);
      }
      this.logger.error('Error updating user in db', user.error);
      return errAsync(user.error);
    }

    // If user exists, delete user in db
    const result = await ResultAsync.fromPromise(
      this.orm.db
        .delete(this.orm.schema.usersTable)
        .where(eq(this.orm.schema.usersTable.id, id))
        .returning(),
      (e) => {
        this.logger.error('Error deleting user in db', e);
        return e instanceof Error ? e : new Error(String(e));
      },
    );

    // Handle db errors
    if (result.isErr()) {
      return errAsync({
        type: 'DB_ERROR',
        error: new DBError(String(result.error)),
      });
    }

    // If no user is returned from db, return error
    if (result.value.length === 0) {
      this.logger.error('No user returned from db');
      return errAsync({
        type: 'DELETION_ERROR',
        error: new DeletionError('No user returned from db'),
      });
    }

    // Return deleted user
    const [deletedUser] = result.value;
    return okAsync(deletedUser);
  }

  async updateUserInDbByEmail(
    email: string,
    updateUserDto: UpdateUserDto,
  ): Promise<Result<User, UpdateUserInDbError>> {
    // Check if user exists
    const user = await this.getUserFromDbByEmail(email);
    if (user.isErr()) {
      if (user.error.type === 'NOT_FOUND') {
        this.logger.error('User to update not found in db');
        return errAsync(user.error);
      }
      this.logger.error('Error updating user in db', user.error);
      return errAsync(user.error);
    }

    // If user exists, update user in db
    const result = await ResultAsync.fromPromise(
      this.orm.db
        .update(this.orm.schema.usersTable)
        .set(updateUserDto)
        .where(eq(this.orm.schema.usersTable.email, email))
        .returning(),
      (e) => {
        this.logger.error('Error updating user in db', e);
        return e instanceof Error ? e : new Error(String(e));
      },
    );

    // Handle db errors
    if (result.isErr()) {
      return errAsync({
        type: 'DB_ERROR',
        error: new DBError(String(result.error)),
      });
    }

    // If no user is returned from db, return error
    if (result.value.length === 0) {
      this.logger.error('No user returned from db');
      return errAsync({
        type: 'UPDATE_ERROR',
        error: new UpdateError('No user returned from db'),
      });
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
        this.logger.error('User to delete not found in db');
        return errAsync(user.error);
      }
      this.logger.error('Error deleting user in db', user.error);
      return errAsync(user.error);
    }

    // If user exists, delete user in db
    const result = await ResultAsync.fromPromise(
      this.orm.db
        .delete(this.orm.schema.usersTable)
        .where(eq(this.orm.schema.usersTable.email, email))
        .returning(),
      (e) => {
        this.logger.error('Error deleting user in db', e);
        return e instanceof Error ? e : new Error(String(e));
      },
    );

    // Handle db errors
    if (result.isErr()) {
      return errAsync({
        type: 'DB_ERROR',
        error: new DBError(String(result.error)),
      });
    }

    // If no user is returned from db, return error
    if (result.value.length === 0) {
      this.logger.error('No user returned from db');
      return errAsync({
        type: 'DELETION_ERROR',
        error: new DeletionError('No user returned from db'),
      });
    }

    // Return deleted user
    const [deletedUser] = result.value;
    return okAsync(deletedUser);
  }

  async getAllUsersInDb(): Promise<Result<User[], GetAllUsersFromDbError>> {
    // Get all users in db
    const result = await ResultAsync.fromPromise(
      this.orm.db.select().from(this.orm.schema.usersTable),
      (e) => {
        this.logger.error('Error getting all users in db', e);
        return e instanceof Error ? e : new Error(String(e));
      },
    );

    // Handle db errors
    if (result.isErr()) {
      return errAsync({
        type: 'DB_ERROR',
        error: new DBError(String(result.error)),
      });
    }

    // Return all users
    return okAsync(result.value);
  }
}
