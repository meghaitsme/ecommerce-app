import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = verifyToken(token);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error: any) {
    // 🚨 ADD THIS LINE to see the error in your backend terminal
    console.error("JWT Error:", error.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  // 🚨 FIX: Lowercase 'admin'
  if (req.user?.role?.toLowerCase() !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};