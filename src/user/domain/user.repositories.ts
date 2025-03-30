import { Result } from 'neverthrow';
import { UniqueUserColumn, User } from './user.entities';
import { CreateUserDto, UpdateUserDto } from './user.dtos';
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
