import { Injectable, Logger } from '@nestjs/common';
import { DrizzleService } from 'src/drizzle/drizzle.service';
import { CreateUserDto, UpdateUserDto } from './users.models';
import { ResultAsync, errAsync, okAsync } from 'neverthrow';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { bcryptConstants } from './utils/constants';
import {
  UserCreationError,
  UserNotFoundError,
  UserUpdateError,
  UserDeletionError,
  DBError,
  UserAlreadyExistsError,
} from './utils/errors';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(private readonly orm: DrizzleService) {}

  async createUserInDb(createUserDto: CreateUserDto) {
    const user = await this.getUserByEmail(createUserDto.email);
    if (user.isOk()) {
      return errAsync(new UserAlreadyExistsError('User already exists'));
    }

    if (createUserDto.password) {
      const hashedPassword = await bcrypt.hash(
        createUserDto.password,
        bcryptConstants.saltRounds,
      );
      createUserDto.password = hashedPassword;
    }

    const result = await ResultAsync.fromPromise(
      this.orm.db
        .insert(this.orm.schema.usersTable)
        .values(createUserDto)
        .returning(),
      (dbError) => {
        this.logger.error('Error creating user in db', dbError);
        return new DBError('Error creating user in db');
      },
    );

    if (result.isErr()) {
      return errAsync(result.error);
    }

    if (result.value.length === 0) {
      this.logger.error('No user returned from db');
      return errAsync(new UserCreationError('No user returned from db'));
    }

    const [createdUser] = result.value;

    return okAsync(createdUser);
  }

  async getUserByEmail(email: string) {
    const result = await ResultAsync.fromPromise(
      this.orm.db
        .select()
        .from(this.orm.schema.usersTable)
        .where(eq(this.orm.schema.usersTable.email, email)),
      (dbError) => {
        this.logger.error('Error getting user by email', dbError);
        return new DBError('Error getting user by email');
      },
    );

    if (result.isErr()) {
      return errAsync(result.error);
    }

    if (result.value.length === 0) {
      this.logger.error('No user returned from db');
      return errAsync(new UserNotFoundError('No user returned from db'));
    }

    const [user] = result.value;

    return okAsync(user);
  }

  async getUserById(id: number) {
    const result = await ResultAsync.fromPromise(
      this.orm.db
        .select()
        .from(this.orm.schema.usersTable)
        .where(eq(this.orm.schema.usersTable.id, id)),
      (dbError) => {
        this.logger.error('Error getting user by id', dbError);
        return new DBError('Error getting user by id');
      },
    );

    if (result.isErr()) {
      return errAsync(result.error);
    }

    if (result.value.length === 0) {
      this.logger.error('No user returned from db');
      return errAsync(new UserNotFoundError('No user returned from db'));
    }

    const [user] = result.value;

    return okAsync(user);
  }

  async updateUserInDb(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.getUserById(id);
    if (user.isErr()) {
      if (user.error instanceof UserNotFoundError) {
        this.logger.error('User to delete not found in db');
        return errAsync(user.error);
      }
      this.logger.error('Error updating user in db', user.error);
      return errAsync(user.error);
    }

    const result = await ResultAsync.fromPromise(
      this.orm.db
        .update(this.orm.schema.usersTable)
        .set(updateUserDto)
        .where(eq(this.orm.schema.usersTable.id, id))
        .returning(),
      (dbError) => {
        this.logger.error('Error updating user in db', dbError);
        return new DBError('Error updating user in db');
      },
    );

    if (result.isErr()) {
      return errAsync(result.error);
    }

    if (result.value.length === 0) {
      this.logger.error('No user returned from db');
      return errAsync(new UserUpdateError('No user returned from db'));
    }

    const [updatedUser] = result.value;

    return okAsync(updatedUser);
  }

  async deleteUserInDb(id: number) {
    const user = await this.getUserById(id);
    if (user.isErr()) {
      if (user.error instanceof UserNotFoundError) {
        this.logger.error('User to delete not found in db');
        return errAsync(user.error);
      }
      this.logger.error('Error deleting user in db', user.error);
      return errAsync(user.error);
    }

    const result = await ResultAsync.fromPromise(
      this.orm.db
        .delete(this.orm.schema.usersTable)
        .where(eq(this.orm.schema.usersTable.id, id))
        .returning(),
      (dbError) => {
        this.logger.error('Error deleting user in db', dbError);
        return new DBError('Error deleting user in db');
      },
    );

    if (result.isErr()) {
      return errAsync(result.error);
    }

    if (result.value.length === 0) {
      this.logger.error('No user returned from db');
      return errAsync(new UserDeletionError('No user returned from db'));
    }

    const [deletedUser] = result.value;
    return okAsync(deletedUser);
  }

  async getAllUsersInDb() {
    const result = await ResultAsync.fromPromise(
      this.orm.db.select().from(this.orm.schema.usersTable),
      (dbError) => {
        this.logger.error('Error getting all users in db', dbError);
        return new DBError('Error getting all users in db');
      },
    );

    if (result.isErr()) {
      return errAsync(result.error);
    }

    return okAsync(result.value);
  }
}
