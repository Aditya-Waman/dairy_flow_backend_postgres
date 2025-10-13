import { FastifyInstance } from 'fastify';
import {
  getAllRequests,
  getRequestById,
  createRequest,
  approveRequest,
  rejectRequest,
  getPendingRequests,
} from '../controllers/requestController.js';
import { requireAdmin } from '../middleware/auth.js';

export async function requestRoutes(fastify: FastifyInstance) {
  // Get all requests
  fastify.get('/', {
    preHandler: requireAdmin,
    schema: {
      tags: ['Feed Requests'],
      description: 'Get all feed requests',
      security: [{ bearerAuth: [] }],
    },
  }, getAllRequests);

  // Get pending requests
  fastify.get('/pending', {
    preHandler: requireAdmin,
    schema: {
      tags: ['Feed Requests'],
      description: 'Get all pending feed requests',
      security: [{ bearerAuth: [] }],
    },
  }, getPendingRequests);

  // Get request by ID
  fastify.get('/:id', {
    preHandler: requireAdmin,
    schema: {
      tags: ['Feed Requests'],
      description: 'Get feed request by ID',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, getRequestById);

  // Create request
  fastify.post('/', {
    preHandler: requireAdmin,
    schema: {
      tags: ['Feed Requests'],
      description: 'Create a new feed request',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['farmerId', 'feedId', 'qtyBags'],
        properties: {
          farmerId: { type: 'string' },
          feedId: { type: 'string' },
          qtyBags: { type: 'number' },
        },
      },
    },
  }, createRequest);

  // Approve request
  fastify.patch('/:id/approve', {
    preHandler: requireAdmin,
    schema: {
      tags: ['Feed Requests'],
      description: 'Approve a feed request',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, approveRequest);

  // Reject request
  fastify.patch('/:id/reject', {
    preHandler: requireAdmin,
    schema: {
      tags: ['Feed Requests'],
      description: 'Reject a feed request',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, rejectRequest);
}

