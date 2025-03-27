import * as bcrypt from 'bcrypt';
import * as argon2 from 'argon2';

export const saltRounds = 10;

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash);
};

export const hashLongString = async (longString: string) => {
  return await argon2.hash(longString);
};

export const verifyLongString = async (longString: string, hash: string) => {
  return await argon2.verify(hash, longString);
};
