import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signToken = (payload: object): string =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as any);

export const verifyToken = (token: string): any =>
  jwt.verify(token, env.JWT_SECRET);