import { Request, Response, NextFunction } from 'express';


// backend/src/middlewares/error.middleware.ts
export const errorHandler = (err: any, req: any, res: any, next: any) => {
  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // If it's a mongoose CastError (just in case), make it a 400
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  res.status(statusCode).json({ message });
};