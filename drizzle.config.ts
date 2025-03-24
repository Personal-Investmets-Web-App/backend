import { defineConfig } from 'drizzle-kit';
import { envs } from 'src/config/envs';

export default defineConfig({
  schema: './src/drizzle/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: envs.MAIN_DB_URL,
  },
  verbose: true,
});
