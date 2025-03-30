import { z } from 'zod';
import { UserSchema } from 'src/user/domain/user.entities';

export const UserProfileSchema = UserSchema.omit({
  password: true,
  createdAt: true,
  updatedAt: true,
  hashedRefreshToken: true,
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const UserJwtSchema = UserSchema.omit({
  password: true,
  profilePic: true,
  createdAt: true,
  updatedAt: true,
  hashedRefreshToken: true,
});
export type UserJwt = z.infer<typeof UserJwtSchema>;

export const TokensAndUserSchema = z.object({
  user: UserJwtSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type TokensAndUserDto = z.infer<typeof TokensAndUserSchema>;

export const LoginSchema = UserSchema.pick({
  email: true,
  password: true,
}).extend({
  email: z.string().email('Invalid email format'),
  password: z.string(),
});
export type LoginDto = z.infer<typeof LoginSchema>;

export const RegisterWithEmailAndPasswordSchema = UserSchema.pick({
  email: true,
  password: true,
  name: true,
  lastName: true,
}).extend({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: z.string().min(1, 'Name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});
export type RegisterWithEmailAndPasswordDto = z.infer<
  typeof RegisterWithEmailAndPasswordSchema
>;

/**
Request modified by the GoogleStrategy
with the same structure as the Request object
and the addition of the user property
*/
export class GoogleStrategyRequest extends Request {
  user: UserJwt;
}

/**
Request modified by the JwtStrategy
with the same structure as the Request object
and the addition of the user property
*/
export class JwtStrategyRequest extends Request {
  user: UserJwt;
}

/**
Request modified by the LocalStrategy
with the same structure as the Request object
and the addition of the user property
*/
export class LocalStrategyRequest extends Request {
  user: UserJwt;
}

/**
Request modified by the RefreshJwtStrategyRequest
with the same structure as the Request object
and the addition of the user property
*/
export class RefreshJwtStrategyRequest extends Request {
  user: UserJwt;
}
