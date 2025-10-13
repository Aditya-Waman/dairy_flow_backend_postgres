import { FastifyRequest, FastifyReply } from 'fastify';
import { SuperAdmin } from '../models/SuperAdmin.js';
import { Admin } from '../models/Admin.js';
import { generateToken } from '../utils/jwt.js';
import { loginSchema } from '../utils/validators.js';
import { AppError } from '../utils/errorHandler.js';
import { AppDataSource } from '../config/database.js';

export async function login(request: FastifyRequest, reply: FastifyReply) {
  try {
    const validation = loginSchema.safeParse(request.body);
    
    if (!validation.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Validation Error',
        message: validation.error.errors[0].message,
      });
    }

    const { mobile, password } = validation.data;

    const superAdminRepo = AppDataSource.getRepository(SuperAdmin);
    const adminRepo = AppDataSource.getRepository(Admin);

    // Check SuperAdmin first
    let user = await superAdminRepo.findOne({ where: { mobile } });
    let role: 'superadmin' | 'admin' = 'superadmin';

    // If not SuperAdmin, check Admin
    if (!user) {
      user = await adminRepo.findOne({ where: { mobile } });
      role = 'admin';
    }

    if (!user) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid credentials',
      });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid credentials',
      });
    }

    const token = generateToken(request.server, {
      id: user.id.toString(),
      mobile: user.mobile,
      name: user.name,
      role,
    });

    return reply.send({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        role,
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: error.message || 'Login failed',
    });
  }
}

export async function getProfile(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = (request as any).user;
    
    const superAdminRepo = AppDataSource.getRepository(SuperAdmin);
    const adminRepo = AppDataSource.getRepository(Admin);
    
    let profile;
    if (user.role === 'superadmin') {
      profile = await superAdminRepo.findOne({ where: { id: parseInt(user.id) } });
    } else {
      profile = await adminRepo.findOne({ where: { id: parseInt(user.id) } });
    }

    if (!profile) {
      throw new AppError('User not found', 404);
    }

    return reply.send({
      success: true,
      user: {
        id: profile.id,
        name: profile.name,
        mobile: profile.mobile,
        role: user.role,
        createdAt: profile.createdAt,
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.name || 'Error',
      message: error.message || 'Failed to get profile',
    });
  }
}

