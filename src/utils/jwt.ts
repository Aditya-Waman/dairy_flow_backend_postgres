import { FastifyRequest } from 'fastify';

export interface JWTPayload {
  id: string;
  mobile: string;
  name: string;
  role: 'superadmin' | 'admin';
}

// Use type assertion instead of interface extension to avoid conflicts
export type AuthenticatedRequest = FastifyRequest & {
  user?: JWTPayload;
};

export function generateToken(fastify: any, payload: JWTPayload): string {
  return fastify.jwt.sign(payload, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export async function verifyToken(fastify: any, token: string): Promise<JWTPayload> {
  try {
    const decoded = await fastify.jwt.verify(token);
    return decoded as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

