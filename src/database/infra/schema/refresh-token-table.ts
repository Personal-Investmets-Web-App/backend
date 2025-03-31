import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { userTable } from './user-table';
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod';
import { z } from 'zod';

export const refreshTokenTable = pgTable('refresh_token_table', {
  id: serial('id').primaryKey(),
  hashedToken: text('hashed_token').notNull(),
  userId: integer('user_id')
    .notNull()
    .references(() => userTable.id),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const RefreshTokenTableSchema = createSelectSchema(refreshTokenTable);
export type RefreshTokenTable = z.infer<typeof RefreshTokenTableSchema>;

export const RefreshTokenTableInsertSchema =
  createInsertSchema(refreshTokenTable);
export type RefreshTokenTableInsert = z.infer<
  typeof RefreshTokenTableInsertSchema
>;

export const RefreshTokenTableUpdateSchema =
  createUpdateSchema(refreshTokenTable);
export type RefreshTokenTableUpdate = z.infer<
  typeof RefreshTokenTableUpdateSchema
>;
