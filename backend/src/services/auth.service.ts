import User from '../models/User.model';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';

export const registerUser = async (name: string, email: string, password: string) => {
  const exists = await User.findOne({ email });
  if (exists) throw { status: 400, message: 'Email already registered' };

  const hashed = await hashPassword(password);
  const user = await User.create({ name, email, password: hashed });
  const token = signToken({ id: user._id, role: user.role });

  return {
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user) throw { status: 400, message: 'Invalid credentials' };

  const match = await comparePassword(password, user.password);
  if (!match) throw { status: 400, message: 'Invalid credentials' };

  const token = signToken({ id: user._id, role: user.role });

  return {
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};