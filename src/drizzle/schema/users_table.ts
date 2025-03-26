import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import {
  createSelectSchema,
  createInsertSchema,
  createUpdateSchema,
} from 'drizzle-zod';
import { z } from 'zod';

export type RegisterMethodTable = 'google' | 'email';

export const usersTable = pgTable('users_table', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  registerMethod: text('register_method')
    .notNull()
    .$type<RegisterMethodTable>(),
  name: text('name').notNull(),
  lastName: text('last_name').notNull(),
  profilePic: text('profile_pic'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const UserTableSchema = createSelectSchema(usersTable).extend({
  registerMethod: z.enum(['google', 'email']),
});
export type UserTable = z.infer<typeof UserTableSchema>;

export const UserTableInsertSchema = createInsertSchema(usersTable).extend({
  registerMethod: z.enum(['google', 'email']),
});
export type UserTableInsert = z.infer<typeof UserTableInsertSchema>;

export const UserTableUpdateSchema = createUpdateSchema(usersTable).extend({
  registerMethod: z.enum(['google', 'email']).optional(),
});
export type UserTableUpdate = z.infer<typeof UserTableUpdateSchema>;
