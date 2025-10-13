import { FastifyRequest, FastifyReply } from 'fastify';
import { Admin } from '../models/Admin.js';
import { createAdminSchema, updateAdminSchema } from '../utils/validators.js';
import { AppError } from '../utils/errorHandler.js';
import { AppDataSource } from '../config/database.js';

export async function getAllAdmins(request: FastifyRequest, reply: FastifyReply) {
  try {
    const adminRepo = AppDataSource.getRepository(Admin);
    const admins = await adminRepo.find({ 
      order: { createdAt: 'DESC' } 
    });
    const transformedAdmins = admins.map(admin => ({
      ...admin,
      id: admin.id.toString()
    }));
    return reply.send({
      success: true,
      count: admins.length,
      data: transformedAdmins,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch admins',
    });
  }
}

export async function getAdminById(request: FastifyRequest, reply: FastifyReply) {
  try {
    const params = request.params as any;
    const adminRepo = AppDataSource.getRepository(Admin);
    const admin = await adminRepo.findOne({ where: { id: parseInt(params.id) } });
    
    if (!admin) {
      throw new AppError('Admin not found', 404);
    }

    const transformedAdmin = {
      ...admin,
      id: admin.id.toString()
    };

    return reply.send({
      success: true,
      data: transformedAdmin,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.name || 'Error',
      message: error.message || 'Failed to fetch admin',
    });
  }
}

export async function createAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    const validation = createAdminSchema.safeParse(request.body);
    
    if (!validation.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Validation Error',
        message: validation.error.errors[0].message,
      });
    }

    const user = (request as any).user;
    const adminRepo = AppDataSource.getRepository(Admin);
    
    const admin = adminRepo.create({
      ...validation.data,
      createdBy: user.name,
    });

    const savedAdmin = await adminRepo.save(admin);

    const transformedAdmin = {
      ...savedAdmin,
      id: savedAdmin.id.toString()
    };

    return reply.status(201).send({
      success: true,
      message: 'Admin created successfully',
      data: transformedAdmin,
    });
  } catch (error: any) {
    request.log.error(error);
    
    if (error.code === '23505') { // PostgreSQL unique violation
      return reply.status(400).send({
        statusCode: 400,
        error: 'Duplicate Error',
        message: 'Admin with this mobile number already exists',
      });
    }

    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: error.message || 'Failed to create admin',
    });
  }
}

export async function updateAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    const validation = updateAdminSchema.safeParse(request.body);
    
    if (!validation.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Validation Error',
        message: validation.error.errors[0].message,
      });
    }

    const params = request.params as any;
    const adminRepo = AppDataSource.getRepository(Admin);
    
    const admin = await adminRepo.findOne({ where: { id: parseInt(params.id) } });
    if (!admin) {
      throw new AppError('Admin not found', 404);
    }

    Object.assign(admin, validation.data);
    const updatedAdmin = await adminRepo.save(admin);

    const transformedAdmin = {
      ...updatedAdmin,
      id: updatedAdmin.id.toString()
    };

    return reply.send({
      success: true,
      message: 'Admin updated successfully',
      data: transformedAdmin,
    });
  } catch (error: any) {
    request.log.error(error);
    
    if (error.code === '23505') { // PostgreSQL unique violation
      return reply.status(400).send({
        statusCode: 400,
        error: 'Duplicate Error',
        message: 'Admin with this mobile number already exists',
      });
    }

    return reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.name || 'Error',
      message: error.message || 'Failed to update admin',
    });
  }
}

export async function deleteAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    const params = request.params as any;
    const adminRepo = AppDataSource.getRepository(Admin);
    
    const result = await adminRepo.delete(parseInt(params.id));

    if (result.affected === 0) {
      throw new AppError('Admin not found', 404);
    }

    return reply.send({
      success: true,
      message: 'Admin deleted successfully',
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.name || 'Error',
      message: error.message || 'Failed to delete admin',
    });
  }
}

