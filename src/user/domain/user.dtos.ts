import { z } from 'zod';
import { RefreshTokenSchema, ROLE, UserSchema } from './user.entities';

export const CreateUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  role: z.nativeEnum(ROLE).optional(),
  profilePic: z.string().nullable().optional(),
  password: z.string().nullable().optional(),
});
export type CreateUserDto = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = CreateUserSchema.partial();
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

export const CreateRefreshTokenSchema = RefreshTokenSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateRefreshTokenDto = z.infer<typeof CreateRefreshTokenSchema>;

export const UpdateRefreshTokenSchema = CreateRefreshTokenSchema.partial();
export type UpdateRefreshTokenDto = z.infer<typeof UpdateRefreshTokenSchema>;
