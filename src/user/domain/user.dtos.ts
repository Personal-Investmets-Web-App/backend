import { z } from 'zod';
import { ROLE, UserSchema } from './user.entities';

export const CreateUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  role: z.nativeEnum(ROLE).optional(),
  profilePic: z.string().nullable().optional(),
  hashedRefreshToken: z.string().nullable().optional(),
  password: z.string().nullable().optional(),
});
export type CreateUserDto = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = CreateUserSchema.partial();
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
