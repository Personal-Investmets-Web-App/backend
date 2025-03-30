import { Result } from 'neverthrow';

export interface BaseRepository<TEntity, TCreateDto, TUpdateDto> {
  create(createDto: TCreateDto): Promise<Result<TEntity, any>>;
  findByUniqueColumn(column: any): Promise<Result<TEntity, any>>;
  updateByUniqueColumn(
    column: any,
    updateDto: TUpdateDto,
  ): Promise<Result<TEntity, any>>;
  deleteByUniqueColumn(column: any): Promise<Result<TEntity, any>>;
  findAll(): Promise<Result<TEntity[], any>>;
}
