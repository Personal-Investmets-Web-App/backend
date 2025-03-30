import 'dotenv/config';
import { z } from 'zod';

interface EnvVars {
  MAIN_DB_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRE_IN: string;
  REFRESH_JWT_SECRET: string;
  REFRESH_JWT_EXPIRE_IN: string;
  PORT: number;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  FRONTEND_REDIRECT_URI: string;
}

const envsSchema = z
  .object({
    MAIN_DB_URL: z.coerce.string(),
    JWT_SECRET: z.coerce.string(),
    JWT_EXPIRE_IN: z.coerce.string(),
    REFRESH_JWT_SECRET: z.coerce.string(),
    REFRESH_JWT_EXPIRE_IN: z.coerce.string(),
    PORT: z.coerce.number(),
    GOOGLE_CLIENT_ID: z.coerce.string(),
    GOOGLE_CLIENT_SECRET: z.coerce.string(),
    GOOGLE_REDIRECT_URI: z.coerce.string(),
    FRONTEND_REDIRECT_URI: z.coerce.string(),
  })
  .passthrough();

const envVars = envsSchema.parse({
  ...process.env,
});

export const envs: EnvVars = {
  ...envVars,
};
