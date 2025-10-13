import { FastifyRequest, FastifyReply } from 'fastify';
import { Farmer } from '../models/Farmer.js';
import { createFarmerSchema, updateFarmerSchema } from '../utils/validators.js';
import { AppError } from '../utils/errorHandler.js';
import { AppDataSource } from '../config/database.js';
import { Like, FindManyOptions, MoreThanOrEqual } from 'typeorm';

export async function getAllFarmers(
  request: FastifyRequest, 
  reply: FastifyReply
) {
  try {
    const query = request.query as any;
    const { 
      search, 
      status, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      page = '1',
      limit = '10'
    } = query;

    const farmerRepo = AppDataSource.getRepository(Farmer);
    
    // Build where conditions
    let whereConditions: any = {};
    
    // Status filter
    if (status) {
      whereConditions.status = status;
    }

    // Search filter (searches in name, mobile, code, email)
    if (search) {
      whereConditions = [
        { fullName: Like(`%${search}%`), ...whereConditions },
        { mobile: Like(`%${search}%`), ...whereConditions },
        { code: Like(`%${search}%`), ...whereConditions },
        { email: Like(`%${search}%`), ...whereConditions }
      ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort options
    const order: any = {};
    order[sortBy] = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Execute query with pagination
    const [farmers, totalCount] = await Promise.all([
      farmerRepo.find({
        where: whereConditions,
        order,
        skip,
        take: limitNum
      }),
      farmerRepo.count({ where: whereConditions })
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    // Transform for frontend compatibility
    const transformedFarmers = farmers.map(farmer => ({
      ...farmer,
      id: farmer.id.toString()
    }));

    return reply.send({
      success: true,
      data: transformedFarmers,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      },
      filters: {
        search: search || null,
        status: status || null,
        sortBy,
        sortOrder
      }
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch farmers',
    });
  }
}

export async function getFarmerById(request: FastifyRequest, reply: FastifyReply) {
  try {
    const params = request.params as any;
    const farmerRepo = AppDataSource.getRepository(Farmer);
    const farmer = await farmerRepo.findOne({ where: { id: parseInt(params.id) } });
    
    if (!farmer) {
      throw new AppError('Farmer not found', 404);
    }

    // Transform for frontend compatibility
    const transformedFarmer = {
      ...farmer,
      id: farmer.id.toString()
    };

    return reply.send({
      success: true,
      data: transformedFarmer,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.name || 'Error',
      message: error.message || 'Failed to fetch farmer',
    });
  }
}

export async function createFarmer(request: FastifyRequest, reply: FastifyReply) {
  try {
    const validation = createFarmerSchema.safeParse(request.body);
    
    if (!validation.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Validation Error',
        message: validation.error.errors[0].message,
      });
    }

    const user = (request as any).user;
    const farmerRepo = AppDataSource.getRepository(Farmer);
    
    const farmer = farmerRepo.create({
      ...validation.data,
      createdBy: user.name,
    });

    const savedFarmer = await farmerRepo.save(farmer);

    // Transform for frontend compatibility
    const transformedFarmer = {
      ...savedFarmer,
      id: savedFarmer.id.toString()
    };

    return reply.status(201).send({
      success: true,
      message: 'Farmer created successfully',
      data: transformedFarmer,
    });
  } catch (error: any) {
    request.log.error(error);
    
    if (error.code === '23505') { // PostgreSQL unique violation
      const field = error.detail.includes('mobile') ? 'mobile' : 'code';
      return reply.status(400).send({
        statusCode: 400,
        error: 'Duplicate Error',
        message: `Farmer with this ${field} already exists`,
      });
    }

    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: error.message || 'Failed to create farmer',
    });
  }
}

export async function updateFarmer(request: FastifyRequest, reply: FastifyReply) {
  try {
    const validation = updateFarmerSchema.safeParse(request.body);
    
    if (!validation.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Validation Error',
        message: validation.error.errors[0].message,
      });
    }

    const params = request.params as any;
    const farmerRepo = AppDataSource.getRepository(Farmer);
    
    const farmer = await farmerRepo.findOne({ where: { id: parseInt(params.id) } });
    if (!farmer) {
      throw new AppError('Farmer not found', 404);
    }

    Object.assign(farmer, validation.data);
    const updatedFarmer = await farmerRepo.save(farmer);

    // Transform for frontend compatibility
    const transformedFarmer = {
      ...updatedFarmer,
      id: updatedFarmer.id.toString()
    };

    return reply.send({
      success: true,
      message: 'Farmer updated successfully',
      data: transformedFarmer,
    });
  } catch (error: any) {
    request.log.error(error);
    
    if (error.code === '23505') { // PostgreSQL unique violation
      const field = error.detail.includes('mobile') ? 'mobile' : 'code';
      return reply.status(400).send({
        statusCode: 400,
        error: 'Duplicate Error',
        message: `Farmer with this ${field} already exists`,
      });
    }

    return reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.name || 'Error',
      message: error.message || 'Failed to update farmer',
    });
  }
}

export async function deleteFarmer(request: FastifyRequest, reply: FastifyReply) {
  try {
    const params = request.params as any;
    const farmerRepo = AppDataSource.getRepository(Farmer);
    
    const result = await farmerRepo.delete(parseInt(params.id));

    if (result.affected === 0) {
      throw new AppError('Farmer not found', 404);
    }

    return reply.send({
      success: true,
      message: 'Farmer deleted successfully',
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.name || 'Error',
      message: error.message || 'Failed to delete farmer',
    });
  }
}

export async function toggleFarmerStatus(request: FastifyRequest, reply: FastifyReply) {
  try {
    const params = request.params as any;
    const farmerRepo = AppDataSource.getRepository(Farmer);
    
    const farmer = await farmerRepo.findOne({ where: { id: parseInt(params.id) } });

    if (!farmer) {
      throw new AppError('Farmer not found', 404);
    }

    farmer.status = farmer.status === 'Active' ? 'Inactive' : 'Active';
    const updatedFarmer = await farmerRepo.save(farmer);

    return reply.send({
      success: true,
      message: `Farmer ${updatedFarmer.status === 'Active' ? 'activated' : 'deactivated'} successfully`,
      data: updatedFarmer,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.name || 'Error',
      message: error.message || 'Failed to toggle farmer status',
    });
  }
}

export async function searchFarmers(
  request: FastifyRequest, 
  reply: FastifyReply
) {
  try {
    const query = request.query as any;
    const { q, status, limit = '20' } = query;

    if (!q || q.trim().length < 2) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Search query must be at least 2 characters long',
      });
    }

    const farmerRepo = AppDataSource.getRepository(Farmer);
    
    // Build search filter
    const whereConditions: any = [
      { fullName: Like(`%${q}%`) },
      { mobile: Like(`%${q}%`) },
      { code: Like(`%${q}%`) },
      { email: Like(`%${q}%`) }
    ];

    // Add status filter if provided
    if (status) {
      whereConditions.forEach((condition: any) => {
        condition.status = status;
      });
    }

    const farmers = await farmerRepo.find({
      where: whereConditions,
      order: { fullName: 'ASC' },
      take: parseInt(limit)
    });

    // Transform for frontend compatibility
    const transformedFarmers = farmers.map(farmer => ({
      ...farmer,
      id: farmer.id.toString()
    }));

    return reply.send({
      success: true,
      query: q,
      count: farmers.length,
      data: transformedFarmers,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: error.message || 'Failed to search farmers',
    });
  }
}

export async function getFarmerStats(request: FastifyRequest, reply: FastifyReply) {
  try {
    const farmerRepo = AppDataSource.getRepository(Farmer);
    
    const [totalFarmers, activeFarmers, inactiveFarmers] = await Promise.all([
      farmerRepo.count(),
      farmerRepo.count({ where: { status: 'Active' } }),
      farmerRepo.count({ where: { status: 'Inactive' } })
    ]);

    // Get recent farmers (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentFarmers = await farmerRepo.count({
      where: {
        createdAt: MoreThanOrEqual(thirtyDaysAgo)
      }
    });

    return reply.send({
      success: true,
      stats: {
        total: totalFarmers,
        active: activeFarmers,
        inactive: inactiveFarmers,
        recent: recentFarmers
      }
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch farmer statistics',
    });
  }
}

