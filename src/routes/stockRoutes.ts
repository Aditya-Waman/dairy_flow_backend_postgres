import { FastifyInstance } from 'fastify';
import {
  getAllStock,
  getStockById,
  createStock,
  updateStock,
  deleteStock,
  getLowStock,
  searchStock,
  getStockStats,
  getStockByType,
} from '../controllers/stockController.js';
import { requireAdmin } from '../middleware/auth.js';

export async function stockRoutes(fastify: FastifyInstance) {
  // Get all stock with filtering and pagination
  fastify.get('/', {
    preHandler: requireAdmin,
    schema: {
      tags: ['Stock'],
      description: 'Get all stock items with filtering, sorting, and pagination',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Search in name and type' },
          type: { type: 'string', description: 'Filter by feed type' },
          sortBy: { type: 'string', enum: ['name', 'type', 'quantityBags', 'sellingPrice', 'lastUpdated'] },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] },
          page: { type: 'string', description: 'Page number (default: 1)' },
          limit: { type: 'string', description: 'Items per page (default: 10)' },
          lowStock: { type: 'string', enum: ['true', 'false'], description: 'Filter low stock items' },
        },
      },
    },
  }, getAllStock);

  // Search stock
  fastify.get('/search', {
    preHandler: requireAdmin,
    schema: {
      tags: ['Stock'],
      description: 'Search stock items by name or type',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        required: ['q'],
        properties: {
          q: { type: 'string', description: 'Search query (min 2 characters)' },
          type: { type: 'string', description: 'Filter by feed type' },
          limit: { type: 'string', description: 'Max results (default: 20)' },
        },
      },
    },
  }, searchStock);

  // Get stock statistics
  fastify.get('/stats', {
    preHandler: requireAdmin,
    schema: {
      tags: ['Stock'],
      description: 'Get stock statistics (total items, low stock, total value, type breakdown)',
      security: [{ bearerAuth: [] }],
    },
  }, getStockStats);

  // Get stock by type
  fastify.get('/type/:type', {
    preHandler: requireAdmin,
    schema: {
      tags: ['Stock'],
      description: 'Get stock items by type',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          type: { type: 'string' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          sortBy: { type: 'string', enum: ['name', 'quantityBags', 'sellingPrice'] },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] },
        },
      },
    },
  }, getStockByType);

  // Get low stock items
  fastify.get('/low-stock', {
    preHandler: requireAdmin,
    schema: {
      tags: ['Stock'],
      description: 'Get low stock items below threshold',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          threshold: { type: 'string', description: 'Threshold for low stock (default: 20)' },
        },
      },
    },
  }, getLowStock);

  // Get stock by ID
  fastify.get('/:id', {
    preHandler: requireAdmin,
    schema: {
      tags: ['Stock'],
      description: 'Get stock item by ID',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, getStockById);

  // Create stock
  fastify.post('/', {
    preHandler: requireAdmin,
    schema: {
      tags: ['Stock'],
      description: 'Create a new stock item',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'type', 'quantityBags', 'bagWeight', 'purchasePrice', 'sellingPrice'],
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
          quantityBags: { type: 'number' },
          bagWeight: { type: 'number' },
          purchasePrice: { type: 'number' },
          sellingPrice: { type: 'number' },
        },
      },
    },
  }, createStock);

  // Update stock
  fastify.put('/:id', {
    preHandler: requireAdmin,
    schema: {
      tags: ['Stock'],
      description: 'Update stock item by ID',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, updateStock);

  // Delete stock
  fastify.delete('/:id', {
    preHandler: requireAdmin,
    schema: {
      tags: ['Stock'],
      description: 'Delete stock item by ID',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, deleteStock);
}

