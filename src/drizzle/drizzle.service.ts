import { Inject, Injectable } from '@nestjs/common';
import {
  DrizzleAsyncProvider,
  DrizzleSchemaProvider,
} from './drizzle.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as Schema from './schema';

@Injectable()
export class DrizzleService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    readonly db: NodePgDatabase<typeof Schema>,

    @Inject(DrizzleSchemaProvider)
    readonly schema: typeof Schema,
  ) {}
}
