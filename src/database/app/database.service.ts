import { Inject, Injectable } from '@nestjs/common';
import {
  DATABASE_ASYNC_PROVIDER,
  DATABASE_SCHEMA_PROVIDER,
} from './database.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as Schema from '../infra/schema';

@Injectable()
export class DatabaseService {
  constructor(
    @Inject(DATABASE_ASYNC_PROVIDER)
    readonly db: NodePgDatabase<typeof Schema>,

    @Inject(DATABASE_SCHEMA_PROVIDER)
    readonly schema: typeof Schema,
  ) {}
}
