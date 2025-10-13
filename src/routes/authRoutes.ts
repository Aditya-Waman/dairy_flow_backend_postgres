import { FastifyInstance } from 'fastify';
import { login, getProfile } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

export async function authRoutes(fastify: FastifyInstance) {
  // Login
  fastify.post('/login', {
    schema: {
      tags: ['Authentication'],
      description: 'Login with mobile and password',
      body: {
        type: 'object',
        required: ['mobile', 'password'],
        properties: {
          mobile: { type: 'string', description: '10-digit mobile number' },
          password: { type: 'string', description: 'Password' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                mobile: { type: 'string' },
                role: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, login);

  // Get profile
  fastify.get('/profile', {
    preHandler: authenticate,
    schema: {
      tags: ['Authentication'],
      description: 'Get current user profile',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                mobile: { type: 'string' },
                role: { type: 'string' },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, getProfile);
}

