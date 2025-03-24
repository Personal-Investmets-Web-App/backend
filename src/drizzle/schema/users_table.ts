import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users_table', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  lastName: text('last_name'),
  profilePic: text('profile_pic'),
  password: text('password'),
  refreshToken: text('refresh_token'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type UserTable = typeof usersTable.$inferSelect;

export type UserTableInsert = typeof usersTable.$inferInsert;
