import { FastifyRequest, FastifyReply } from 'fastify';
import { Stock } from '../models/Stock.js';
import { createStockSchema, updateStockSchema } from '../utils/validators.js';
import { AppError } from '../utils/errorHandler.js';
import { AppDataSource } from '../config/database.js';
import { Like, LessThan } from 'typeorm';
import { getCurrentISTTime } from '../utils/timezone.js';

export async function getAllStock(
  request: FastifyRequest, 
  reply: FastifyReply
) {
  try {
    const query = request.query as any;
    const { 
      search, 
      type, 
      sortBy = 'lastUpdated', 
      sortOrder = 'desc',
      page = '1',
      limit = '10',
      lowStock
    } = query;

    const stockRepo = AppDataSource.getRepository(Stock);
    
    // Build where conditions
    let whereConditions: any = {};
    
    // Type filter
    if (type) {
      whereConditions.type = Like(`%${type}%`);
    }

    // Low stock filter
    if (lowStock === 'true') {
      whereConditions.quantityBags = LessThan(20); // Default threshold
    }

    // Search filter (searches in name and type)
    if (search) {
      whereConditions = [
        { name: Like(`%${search}%`), ...whereConditions },
        { type: Like(`%${search}%`), ...whereConditions }
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
    const [stock, totalCount] = await Promise.all([
      stockRepo.find({
        where: whereConditions,
        order,
        skip,
        take: limitNum
      }),
      stockRepo.count({ where: whereConditions })
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    // Transform for frontend compatibility
    const transformedStock = stock.map(item => ({
      ...item,
      id: item.id.toString()
    }));

    return reply.send({
      success: true,
      data: transformedStock,
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
        type: type || null,
        lowStock: lowStock || null,
        sortBy,
        sortOrder
      }
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch stock',
    });
  }
}

export async function getStockById(request: FastifyRequest, reply: FastifyReply) {
  try {
    const params = request.params as any;
    const stockRepo = AppDataSource.getRepository(Stock);
    const stock = await stockRepo.findOne({ where: { id: parseInt(params.id) } });
    
    if (!stock) {
      throw new AppError('Stock item not found', 404);
    }

    // Transform for frontend compatibility
    const transformedStock = {
      ...stock,
      id: stock.id.toString()
    };

    return reply.send({
      success: true,
      data: transformedStock,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.name || 'Error',
      message: error.message || 'Failed to fetch stock item',
    });
  }
}

export async function createStock(request: FastifyRequest, reply: FastifyReply) {
  try {
    const validation = createStockSchema.safeParse(request.body);
    
    if (!validation.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Validation Error',
        message: validation.error.errors[0].message,
      });
    }

    const user = (request as any).user;
    const stockRepo = AppDataSource.getRepository(Stock);
    
    const stock = stockRepo.create({
      ...validation.data,
      updatedBy: user.name,
    });

    const savedStock = await stockRepo.save(stock);

    // Transform for frontend compatibility
    const transformedStock = {
      ...savedStock,
      id: savedStock.id.toString()
    };

    return reply.status(201).send({
      success: true,
      message: 'Stock item created successfully',
      data: transformedStock,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: error.message || 'Failed to create stock item',
    });
  }
}

export async function updateStock(request: FastifyRequest, reply: FastifyReply) {
  try {
    const validation = updateStockSchema.safeParse(request.body);
    
    if (!validation.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Validation Error',
        message: validation.error.errors[0].message,
      });
    }

    const user = (request as any).user;
    const params = request.params as any;
    const stockRepo = AppDataSource.getRepository(Stock);
    
    const stock = await stockRepo.findOne({ where: { id: parseInt(params.id) } });
    if (!stock) {
      throw new AppError('Stock item not found', 404);
    }

    Object.assign(stock, validation.data, {
      updatedBy: user.name,
      lastUpdated: getCurrentISTTime(),
    });
    
    const updatedStock = await stockRepo.save(stock);

    // Transform for frontend compatibility
    const transformedStock = {
      ...updatedStock,
      id: updatedStock.id.toString()
    };

    return reply.send({
      success: true,
      message: 'Stock item updated successfully',
      data: transformedStock,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.name || 'Error',
      message: error.message || 'Failed to update stock item',
    });
  }
}

export async function deleteStock(request: FastifyRequest, reply: FastifyReply) {
  try {
    const params = request.params as any;
    const stockRepo = AppDataSource.getRepository(Stock);
    
    const result = await stockRepo.delete(parseInt(params.id));

    if (result.affected === 0) {
      throw new AppError('Stock item not found', 404);
    }

    return reply.send({
      success: true,
      message: 'Stock item deleted successfully',
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.name || 'Error',
      message: error.message || 'Failed to delete stock item',
    });
  }
}

export async function getLowStock(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as any;
    const threshold = parseInt(query.threshold || '20');
    const stockRepo = AppDataSource.getRepository(Stock);
    
    const lowStock = await stockRepo.find({
      where: { quantityBags: LessThan(threshold) },
      order: { quantityBags: 'ASC' }
    });

    // Transform for frontend compatibility
    const transformedStock = lowStock.map(item => ({
      ...item,
      id: item.id.toString()
    }));

    return reply.send({
      success: true,
      threshold,
      count: lowStock.length,
      data: transformedStock,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch low stock items',
    });
  }
}

export async function searchStock(
  request: FastifyRequest, 
  reply: FastifyReply
) {
  try {
    const query = request.query as any;
    const { q, type, limit = '20' } = query;

    if (!q || q.trim().length < 2) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Search query must be at least 2 characters long',
      });
    }

    const stockRepo = AppDataSource.getRepository(Stock);
    
    // Build search filter
    let whereConditions: any = [
      { name: Like(`%${q}%`) },
      { type: Like(`%${q}%`) }
    ];

    // Add type filter if provided
    if (type) {
      whereConditions.forEach((condition: any) => {
        condition.type = Like(`%${type}%`);
      });
    }

    const stock = await stockRepo.find({
      where: whereConditions,
      order: { name: 'ASC' },
      take: parseInt(limit)
    });

    // Transform for frontend compatibility
    const transformedStock = stock.map((item: any) => ({
      ...item,
      id: item.id.toString()
    }));

    return reply.send({
      success: true,
      query: q,
      count: stock.length,
      data: transformedStock,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: error.message || 'Failed to search stock',
    });
  }
}

export async function getStockStats(request: FastifyRequest, reply: FastifyReply) {
  try {
    const stockRepo = AppDataSource.getRepository(Stock);
    
    const [
      totalItems,
      lowStockCount,
      totalBagsResult,
      totalValueResult,
      typeStatsResult
    ] = await Promise.all([
      stockRepo.count(),
      stockRepo.count({ where: { quantityBags: LessThan(20) } }),
      stockRepo
        .createQueryBuilder('stock')
        .select('SUM(stock.quantityBags)', 'total')
        .getRawOne(),
      stockRepo
        .createQueryBuilder('stock')
        .select('SUM(stock.quantityBags * stock.sellingPrice)', 'total')
        .getRawOne(),
      stockRepo
        .createQueryBuilder('stock')
        .select('stock.type', 'type')
        .addSelect('COUNT(*)', 'count')
        .addSelect('SUM(stock.quantityBags)', 'totalBags')
        .groupBy('stock.type')
        .getRawMany()
    ]);

    return reply.send({
      success: true,
      stats: {
        totalItems,
        lowStockCount,
        totalBags: parseInt(totalBagsResult?.total || '0'),
        totalValue: parseFloat(totalValueResult?.total || '0'),
        typeBreakdown: typeStatsResult
      }
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch stock statistics',
    });
  }
}

export async function getStockByType(
  request: FastifyRequest, 
  reply: FastifyReply
) {
  try {
    const params = request.params as any;
    const query = request.query as any;
    const { type } = params;
    const { sortBy = 'name', sortOrder = 'asc' } = query;

    const stockRepo = AppDataSource.getRepository(Stock);
    
    const order: any = {};
    order[sortBy] = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const stock = await stockRepo.find({
      where: { type: Like(`%${type}%`) },
      order
    });

    // Transform for frontend compatibility
    const transformedStock = stock.map((item: any) => ({
      ...item,
      id: item.id.toString()
    }));

    return reply.send({
      success: true,
      type,
      count: stock.length,
      data: transformedStock,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch stock by type',
    });
  }
}

