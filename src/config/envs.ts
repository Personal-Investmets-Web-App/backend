import 'dotenv/config';
import { z } from 'zod';

interface EnvVars {
  MAIN_DB_URL: string;
  JWT_SECRET: string;
  PORT: number;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}

const envsSchema = z
  .object({
    MAIN_DB_URL: z.coerce.string(),
    JWT_SECRET: z.coerce.string(),
    PORT: z.coerce.number(),
    GOOGLE_CLIENT_ID: z.coerce.string(),
    GOOGLE_CLIENT_SECRET: z.coerce.string(),
  })
  .passthrough();

const envVars = envsSchema.parse({
  ...process.env,
});

export const envs: EnvVars = {
  ...envVars,
};
