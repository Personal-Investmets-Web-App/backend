import { z } from 'zod';
import { UserSchema } from 'src/user/domain/user.entities';
import { Request } from 'express';

export const UserJwtSchema = UserSchema.omit({
  password: true,
  profilePic: true,
  createdAt: true,
  updatedAt: true,
});
export type UserJwt = z.infer<typeof UserJwtSchema>;

export const JwtSchema = UserJwtSchema.extend({
  iat: z.number(),
  exp: z.number(),
});
export type Jwt = z.infer<typeof JwtSchema>;

export const UserAndAccessTokenSchema = z.object({
  user: UserJwtSchema,
  accessToken: z.string(),
});
export type UserAndAccessTokenDto = z.infer<typeof UserAndAccessTokenSchema>;

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
  cookies: any;
}
