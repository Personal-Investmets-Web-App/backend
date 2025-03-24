import { envs } from 'src/config/envs';

export const jwtConstants = {
  secret: envs.JWT_SECRET,
};

export const bcryptConstants = {
  saltRounds: 10,
};
