import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as Schema from 'src/database/infra/schema';
import { envs } from 'src/config/envs';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

export async function migrateDb() {
  const client = new Client({
    connectionString: envs.MAIN_DB_URL,
  });

  await client.connect();

  const db = drizzle(client, { schema: Schema });

  await migrate(db, { migrationsFolder: './drizzle' });

  await client.end();
}

migrateDb()
  .then(() => console.log('Migrations complete'))
  .catch((err) => console.error(err))
  .finally(() => process.exit(0));

// Pasos para hacer migraciones
// 1. pnpm drizzle-kit generate
// 2. pnpm drizzle-kit migrate
