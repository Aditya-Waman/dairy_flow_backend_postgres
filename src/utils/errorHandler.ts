import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  error: FastifyError | AppError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const statusCode = (error as any).statusCode || error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Log error for debugging
  if (statusCode >= 500) {
    request.log.error(error);
  } else {
    request.log.warn(error);
  }

  reply.status(statusCode).send({
    statusCode,
    error: error.name || 'Error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
}

export function notFoundHandler(request: FastifyRequest, reply: FastifyReply) {
  reply.status(404).send({
    statusCode: 404,
    error: 'Not Found',
    message: `Route ${request.method} ${request.url} not found`,
  });
}

