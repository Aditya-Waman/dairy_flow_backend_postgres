import { FastifyInstance } from 'fastify';
import { getReports, getFarmerReport } from '../controllers/reportController.js';
import { requireAdmin } from '../middleware/auth.js';

export async function reportRoutes(fastify: FastifyInstance) {
  // Get comprehensive reports
  fastify.get('/', {
    preHandler: requireAdmin,
    schema: {
      tags: ['Reports'],
      description: 'Get comprehensive reports with filters',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          farmerId: { type: 'string', description: 'Filter by farmer ID' },
          adminId: { type: 'string', description: 'Filter by admin ID' },
          startDate: { type: 'string', description: 'Start date (ISO format)' },
          endDate: { type: 'string', description: 'End date (ISO format)' },
        },
      },
    },
  }, getReports);

  // Get farmer-specific report
  fastify.get('/farmer/:farmerId', {
    preHandler: requireAdmin,
    schema: {
      tags: ['Reports'],
      description: 'Get detailed report for a specific farmer',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          farmerId: { type: 'string' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'Start date (ISO format)' },
          endDate: { type: 'string', description: 'End date (ISO format)' },
        },
      },
    },
  }, getFarmerReport);
}

