import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import {
  createSelectSchema,
  createInsertSchema,
  createUpdateSchema,
} from 'drizzle-zod';
import { z } from 'zod';
import {
  REGISTER_METHOD,
  ROLE,
  Role,
  RegisterMethod,
} from 'src/user/domain/user.entities';

export const userTable = pgTable('user_table', {
  // Auto generated fields
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  role: text('role').notNull().$type<Role>().default(ROLE.USER),

  // Not null fields
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  lastName: text('last_name').notNull(),
  registerMethod: text('register_method').notNull().$type<RegisterMethod>(),

  // Nullable fields
  profilePic: text('profile_pic'),
  hashedRefreshToken: text('hashed_refresh_token'),
  password: text('password'),
});

export const UserTableSchema = createSelectSchema(userTable).extend({
  registerMethod: z.nativeEnum(REGISTER_METHOD),
  role: z.nativeEnum(ROLE),
});
export type UserTable = z.infer<typeof UserTableSchema>;

export const UserTableInsertSchema = createInsertSchema(userTable).extend({
  registerMethod: z.nativeEnum(REGISTER_METHOD),
  role: z.nativeEnum(ROLE).optional(),
});
export type UserTableInsert = z.infer<typeof UserTableInsertSchema>;

export const UserTableUpdateSchema = createUpdateSchema(userTable).extend({
  registerMethod: z.nativeEnum(REGISTER_METHOD).optional(),
  role: z.nativeEnum(ROLE).optional(),
});
export type UserTableUpdate = z.infer<typeof UserTableUpdateSchema>;
