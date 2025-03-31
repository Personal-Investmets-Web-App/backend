import { Result } from 'neverthrow';
import { RefreshToken, UniqueUserColumn, User } from './user.entities';
import {
  CreateRefreshTokenDto,
  CreateUserDto,
  UpdateUserDto,
} from './user.dtos';
import { BaseRepository } from 'src/shared/domain/base.repository';

export abstract class UserRepository
  implements BaseRepository<User, CreateUserDto, UpdateUserDto>
{
  abstract create(createDto: CreateUserDto): Promise<Result<User, any>>;
  abstract findByUniqueColumn(
    column: UniqueUserColumn,
  ): Promise<Result<User, any>>;
  abstract updateByUniqueColumn(
    column: UniqueUserColumn,
    updateDto: UpdateUserDto,
  ): Promise<Result<User, any>>;
  abstract deleteByUniqueColumn(
    column: UniqueUserColumn,
  ): Promise<Result<User, any>>;
  abstract findAll(): Promise<Result<User[], any>>;
}

export abstract class RefreshTokenRepository {
  abstract create(
    createDto: CreateRefreshTokenDto,
  ): Promise<Result<RefreshToken, any>>;
  abstract findByUserId(userId: number): Promise<Result<RefreshToken[], any>>;
  abstract deleteByUserIdAndHashedToken(
    userId: number,
    hashedToken: string,
  ): Promise<Result<RefreshToken, any>>;
  abstract deleteAllByUserId(userId: number): Promise<Result<void, any>>;
  abstract deleteAll(): Promise<Result<void, any>>;
  abstract deleteExpired(): Promise<Result<void, any>>;
}
