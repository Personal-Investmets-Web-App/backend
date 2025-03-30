import { z } from 'zod';
import { BaseColumn } from 'src/shared/domain/base.entities';

export type UniqueUserColumn = BaseColumn<'email' | 'id', string | number>;

export enum REGISTER_METHOD {
  GOOGLE = 'google',
  EMAIL = 'email',
}

export type RegisterMethod = REGISTER_METHOD.GOOGLE | REGISTER_METHOD.EMAIL;

export enum ROLE {
  ADMIN = 'admin',
  USER = 'user',
  EDITOR = 'editor',
}

export type Role = ROLE.ADMIN | ROLE.USER | ROLE.EDITOR;

export const UserSchema = z.object({
  id: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  role: z.nativeEnum(ROLE),

  email: z.string().email(),
  name: z.string(),
  lastName: z.string(),
  registerMethod: z.nativeEnum(REGISTER_METHOD),

  profilePic: z.string().nullable(),
  hashedRefreshToken: z.string().nullable(),
  password: z.string().nullable(),
});

export type User = z.infer<typeof UserSchema>;
