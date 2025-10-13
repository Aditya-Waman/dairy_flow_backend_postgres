import { FastifyInstance } from 'fastify';
import {
  getAllFarmers,
  getFarmerById,
  createFarmer,
  updateFarmer,
  deleteFarmer,
  toggleFarmerStatus,
  searchFarmers,
  getFarmerStats,
} from '../controllers/farmerController.js';
import { requireAdmin, requireSuperAdmin } from '../middleware/auth.js';

export async function farmerRoutes(fastify: FastifyInstance) {
  // Get all farmers with filtering and pagination
  fastify.get('/', {
    preHandler: requireAdmin,
    schema: {
      tags: ['Farmers'],
      description: 'Get all farmers with filtering, sorting, and pagination',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Search in name, mobile, code, email' },
          status: { type: 'string', enum: ['Active', 'Inactive'] },
          sortBy: { type: 'string', enum: ['name', 'mobile', 'code', 'createdAt'] },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] },
          page: { type: 'string', description: 'Page number (default: 1)' },
          limit: { type: 'string', description: 'Items per page (default: 10)' },
        },
      },
    },
  }, getAllFarmers);

  // Search farmers
  fastify.get('/search', {
    preHandler: requireAdmin,
    schema: {
      tags: ['Farmers'],
      description: 'Search farmers by name, mobile, code, or email',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['q'],
        properties: {
          q: { type: 'string', description: 'Search query (min 2 characters)' },
          status: { type: 'string', enum: ['Active', 'Inactive'] },
          limit: { type: 'string', description: 'Max results (default: 20)' },
        },
      },
    },
  }, searchFarmers);

  // Get farmer statistics
  fastify.get('/stats', {
    preHandler: requireAdmin,
    schema: {
      tags: ['Farmers'],
      description: 'Get farmer statistics (total, active, inactive, recent)',
      security: [{ bearerAuth: [] }],
    },
  }, getFarmerStats);

  // Get farmer by ID
  fastify.get('/:id', {
    preHandler: requireAdmin,
    schema: {
      tags: ['Farmers'],
      description: 'Get farmer by ID',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, getFarmerById);

  // Create farmer
  fastify.post('/', {
    preHandler: requireAdmin,
    schema: {
      tags: ['Farmers'],
      description: 'Create a new farmer',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['fullName', 'mobile', 'code'],
        properties: {
          fullName: { type: 'string' },
          mobile: { type: 'string' },
          code: { type: 'string' },
          email: { type: 'string' },
          status: { type: 'string', enum: ['Active', 'Inactive'] },
        },
      },
    },
  }, createFarmer);

  // Update farmer
  fastify.put('/:id', {
    preHandler: requireAdmin,
    schema: {
      tags: ['Farmers'],
      description: 'Update farmer by ID',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, updateFarmer);

  // Delete farmer (superadmin only)
  fastify.delete('/:id', {
    preHandler: requireSuperAdmin,
    schema: {
      tags: ['Farmers'],
      description: 'Delete farmer by ID (Superadmin only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, deleteFarmer);

  // Toggle farmer status
  fastify.patch('/:id/toggle-status', {
    preHandler: requireAdmin,
    schema: {
      tags: ['Farmers'],
      description: 'Toggle farmer status (Active/Inactive)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, toggleFarmerStatus);
}

