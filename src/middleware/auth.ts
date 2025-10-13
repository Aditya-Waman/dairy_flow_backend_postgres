import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../utils/jwt.js';

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
    }
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = await request.server.jwt.verify(token);
      (request as AuthenticatedRequest).user = decoded as any;
    } catch (error) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }
  } catch (error) {
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
}

export async function requireSuperAdmin(
  request: FastifyRequest,
  reply: FastifyReply
) {
  await authenticate(request, reply);
  
  const user = (request as AuthenticatedRequest).user;
  
  if (user?.role !== 'superadmin') {
    return reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Superadmin access required',
    });
  }
}

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
) {
  await authenticate(request, reply);
  
  const user = (request as AuthenticatedRequest).user;
  
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Admin access required',
    });
  }
}

