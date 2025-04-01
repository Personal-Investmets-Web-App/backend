import { Injectable, Logger } from '@nestjs/common';
import { hashPassword } from 'src/shared/utils/cripto';
import { UserRepositoryDatabase } from '../infra/repositories/user.repository-db';
import { CreateUserDto, UpdateUserDto } from '../domain/user.dtos';
import { errAsync, Result } from 'neverthrow';
import { User } from '../domain/user.entities';
import { CreateUserError } from '../infra/user.errors';
import { UserRefreshTokenRepositoryDatabase } from '../infra/repositories/user.refresh-token-repository-db';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    private readonly userRepositoryDatabase: UserRepositoryDatabase,
    private readonly userRefreshTokenRepositoryDatabase: UserRefreshTokenRepositoryDatabase,
  ) {}

  async createUser(
    userInsertDto: CreateUserDto,
  ): Promise<Result<User, CreateUserError>> {
    // Hash password if provided
    if (userInsertDto.password) {
      const hashedPassword = await hashPassword(userInsertDto.password);
      if (hashedPassword.isErr()) {
        this.logger.error('createUserInDb', hashedPassword.error);
        return errAsync(hashedPassword.error);
      }
      userInsertDto.password = hashedPassword.value;
    }

    return this.userRepositoryDatabase.create(userInsertDto);
  }

  async getUserById(id: number) {
    return this.userRepositoryDatabase.findByUniqueColumn({
      name: 'id',
      value: id,
    });
  }

  async getUserByEmail(email: string) {
    return this.userRepositoryDatabase.findByUniqueColumn({
      name: 'email',
      value: email,
    });
  }

  async updateUserById(id: number, updateUserDto: UpdateUserDto) {
    return this.userRepositoryDatabase.updateByUniqueColumn(
      {
        name: 'id',
        value: id,
      },
      updateUserDto,
    );
  }

  async updateUserByEmail(email: string, updateUserDto: UpdateUserDto) {
    return this.userRepositoryDatabase.updateByUniqueColumn(
      {
        name: 'email',
        value: email,
      },
      updateUserDto,
    );
  }

  async deleteUserById(id: number) {
    return this.userRepositoryDatabase.deleteByUniqueColumn({
      name: 'id',
      value: id,
    });
  }

  async deleteUserByEmail(email: string) {
    return this.userRepositoryDatabase.deleteByUniqueColumn({
      name: 'email',
      value: email,
    });
  }

  async getAllUsers() {
    return this.userRepositoryDatabase.findAll();
  }

  async createRefreshToken(
    userId: number,
    hashedToken: string,
    expirationDate: Date,
  ) {
    return this.userRefreshTokenRepositoryDatabase.create({
      userId,
      hashedToken,
      expiresAt: expirationDate,
    });
  }

  async findRefreshTokensByUserId(userId: number) {
    return this.userRefreshTokenRepositoryDatabase.findByUserId(userId);
  }

  async deleteRefreshTokenByUserIdAndHashedToken(
    userId: number,
    hashedToken: string,
  ) {
    return this.userRefreshTokenRepositoryDatabase.deleteByUserIdAndHashedToken(
      userId,
      hashedToken,
    );
  }

  async deleteAllRefreshTokenByUser(userId: number) {
    return this.userRefreshTokenRepositoryDatabase.deleteAllByUserId(userId);
  }

  async deleteAllRefreshTokens() {
    return this.userRefreshTokenRepositoryDatabase.deleteAll();
  }

  async deleteExpiredRefreshTokens() {
    return this.userRefreshTokenRepositoryDatabase.deleteExpired();
  }
}
