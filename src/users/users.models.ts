import {
  UserTableInsertSchema,
  UserTableSchema,
  UserTableUpdateSchema,
} from 'src/drizzle/schema';
import { z } from 'zod';

// Database coupling
// If database changes, only this file needs to be update
export const UserSchema = UserTableSchema;
export type User = z.infer<typeof UserSchema>;

export const UserInsertSchema = UserTableInsertSchema;
export type UserInsertDto = z.infer<typeof UserInsertSchema>;

export const UserUpdateSchema = UserTableUpdateSchema;
export type UserUpdateDto = z.infer<typeof UserUpdateSchema>;
