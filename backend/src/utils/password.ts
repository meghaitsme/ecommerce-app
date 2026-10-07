import bcrypt from 'bcryptjs';

export const hashPassword = (pwd: string) => bcrypt.hash(pwd, 10);

export const comparePassword = (pwd: string, hash: string) =>
  bcrypt.compare(pwd, hash);