import { FastifyInstance } from 'fastify';
import {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
} from '../controllers/adminController.js';
import { requireSuperAdmin } from '../middleware/auth.js';

export async function adminRoutes(fastify: FastifyInstance) {
  // All admin routes require superadmin access
  
  // Get all admins
  fastify.get('/', {
    preHandler: requireSuperAdmin,
    schema: {
      tags: ['Admins'],
      description: 'Get all admins (Superadmin only)',
      security: [{ bearerAuth: [] }],
    },
  }, getAllAdmins);

  // Get admin by ID
  fastify.get('/:id', {
    preHandler: requireSuperAdmin,
    schema: {
      tags: ['Admins'],
      description: 'Get admin by ID (Superadmin only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, getAdminById);

  // Create admin
  fastify.post('/', {
    preHandler: requireSuperAdmin,
    schema: {
      tags: ['Admins'],
      description: 'Create a new admin (Superadmin only)',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'mobile', 'password'],
        properties: {
          name: { type: 'string' },
          mobile: { type: 'string' },
          password: { type: 'string' },
        },
      },
    },
  }, createAdmin);

  // Update admin
  fastify.put('/:id', {
    preHandler: requireSuperAdmin,
    schema: {
      tags: ['Admins'],
      description: 'Update admin by ID (Superadmin only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, updateAdmin);

  // Delete admin
  fastify.delete('/:id', {
    preHandler: requireSuperAdmin,
    schema: {
      tags: ['Admins'],
      description: 'Delete admin by ID (Superadmin only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, deleteAdmin);
}

