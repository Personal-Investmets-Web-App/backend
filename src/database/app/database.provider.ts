import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as Schema from '../infra/schema';
import { envs } from 'src/config/envs';
import { Logger } from '@nestjs/common';

export const DATABASE_ASYNC_PROVIDER = 'DATABASE_ASYNC_PROVIDER';
export const DATABASE_SCHEMA_PROVIDER = 'DATABASE_SCHEMA_PROVIDER';

export const databaseProvider = [
  {
    provide: DATABASE_ASYNC_PROVIDER,
    useFactory: async () => {
      const client = new Client({
        connectionString: envs.MAIN_DB_URL,
      });

      await client.connect();
      Logger.log('Connected to database', 'DatabaseProvider');
      const db = drizzle(client, { schema: Schema });
      return db;
    },
  },
  {
    provide: DATABASE_SCHEMA_PROVIDER,
    useValue: Schema,
  },
];
