import { FastifyRequest, FastifyReply } from 'fastify';
import { FeedRequest } from '../models/FeedRequest.js';
import { Farmer } from '../models/Farmer.js';
import { Stock } from '../models/Stock.js';
import { FeedHistory } from '../models/FeedHistory.js';
import { createRequestSchema } from '../utils/validators.js';
import { AppError } from '../utils/errorHandler.js';
import { AppDataSource } from '../config/database.js';
import { MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';

// Helper function to calculate default date range based on current date
function getDefaultDateRange(): { startDate: string; endDate: string } {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  let startDay: number;
  let endDay: number;
  
  if (currentDay >= 1 && currentDay <= 10) {
    // 1st to 10th of the month
    startDay = 1;
    endDay = 10;
  } else if (currentDay >= 11 && currentDay <= 20) {
    // 11th to 20th of the month
    startDay = 11;
    endDay = 20;
  } else {
    // 21st to end of month
    startDay = 21;
    // Get last day of the month
    endDay = new Date(currentYear, currentMonth + 1, 0).getDate();
  }
  
  const startDate = new Date(currentYear, currentMonth, startDay);
  const endDate = new Date(currentYear, currentMonth, endDay);
  
  // Format as YYYY-MM-DD
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  };
}

export async function getAllRequests(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as any;
    let { startDate, endDate } = query;

    // Apply default date range if no dates are provided
    if (!startDate && !endDate) {
      const defaultRange = getDefaultDateRange();
      startDate = defaultRange.startDate;
      endDate = defaultRange.endDate;
    }

    const feedRequestRepo = AppDataSource.getRepository(FeedRequest);
    
    // Build where conditions with date filtering
    const whereConditions: any = {};
    
    if (startDate || endDate) {
      if (startDate && endDate) {
        // Both start and end dates provided - use Between
        const startDateTime = new Date(startDate);
        startDateTime.setUTCHours(0, 0, 0, 0);
        const endDateTime = new Date(endDate);
        endDateTime.setUTCHours(23, 59, 59, 999);
        whereConditions.createdAt = Between(startDateTime, endDateTime);
      } else if (startDate) {
        // Only start date provided
        const startDateTime = new Date(startDate);
        startDateTime.setUTCHours(0, 0, 0, 0);
        whereConditions.createdAt = MoreThanOrEqual(startDateTime);
      } else if (endDate) {
        // Only end date provided
        const endDateTime = new Date(endDate);
        endDateTime.setUTCHours(23, 59, 59, 999);
        whereConditions.createdAt = LessThanOrEqual(endDateTime);
      }
    }
    
    const requests = await feedRequestRepo.find({
      where: Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
      relations: ['farmer', 'feed'],
      order: { createdAt: 'DESC' }
    });

    // Transform for frontend compatibility
    const transformedRequests = requests.map(req => ({
      ...req,
      id: req.id.toString(),
      farmerId: req.farmer ? {
        ...req.farmer,
        id: req.farmer.id.toString()
      } : req.farmerId,
      feedId: req.feed ? {
        ...req.feed,
        id: req.feed.id.toString()
      } : req.feedId
    }));

    return reply.send({
      success: true,
      count: requests.length,
      data: transformedRequests,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null
      }
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch requests',
    });
  }
}

export async function getRequestById(request: FastifyRequest, reply: FastifyReply) {
  try {
    const params = request.params as any;
    const feedRequestRepo = AppDataSource.getRepository(FeedRequest);
    const feedRequest = await feedRequestRepo.findOne({
      where: { id: parseInt(params.id) },
      relations: ['farmer', 'feed']
    });
    
    if (!feedRequest) {
      throw new AppError('Request not found', 404);
    }

    // Transform for frontend compatibility
    const transformedRequest = {
      ...feedRequest,
      id: feedRequest.id.toString(),
      farmerId: feedRequest.farmer ? {
        ...feedRequest.farmer,
        id: feedRequest.farmer.id.toString()
      } : feedRequest.farmerId,
      feedId: feedRequest.feed ? {
        ...feedRequest.feed,
        id: feedRequest.feed.id.toString()
      } : feedRequest.feedId
    };

    return reply.send({
      success: true,
      data: transformedRequest,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.name || 'Error',
      message: error.message || 'Failed to fetch request',
    });
  }
}

export async function createRequest(request: FastifyRequest, reply: FastifyReply) {
  try {
    const validation = createRequestSchema.safeParse(request.body);
    
    if (!validation.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Validation Error',
        message: validation.error.errors[0].message,
      });
    }

    const { farmerId, feedId, qtyBags } = validation.data;
    const user = (request as any).user;

    const farmerRepo = AppDataSource.getRepository(Farmer);
    const stockRepo = AppDataSource.getRepository(Stock);
    const feedRequestRepo = AppDataSource.getRepository(FeedRequest);

    // Validate farmer exists and is active
    const farmer = await farmerRepo.findOne({ where: { id: parseInt(farmerId) } });
    if (!farmer) {
      throw new AppError('Farmer not found', 404);
    }
    if (farmer.status !== 'Active') {
      throw new AppError('Cannot create request for inactive farmer', 400);
    }

    // Validate feed exists
    const feed = await stockRepo.findOne({ where: { id: parseInt(feedId) } });
    if (!feed) {
      throw new AppError('Feed not found', 404);
    }

    // Check if sufficient stock is available
    if (feed.quantityBags < qtyBags) {
      throw new AppError(`Insufficient stock. Only ${feed.quantityBags} bags available`, 400);
    }

    // Calculate price
    const price = qtyBags * feed.sellingPrice;

    const feedRequest = feedRequestRepo.create({
      farmerId: parseInt(farmerId),
      feedId: parseInt(feedId),
      qtyBags,
      price,
      feedPrice: feed.sellingPrice, // Store current selling price
      createdBy: user.name,
    });

    const savedRequest = await feedRequestRepo.save(feedRequest);

    const populatedRequest = await feedRequestRepo.findOne({
      where: { id: savedRequest.id },
      relations: ['farmer', 'feed']
    });

    // Transform for frontend compatibility
    const transformedRequest = {
      ...populatedRequest!,
      id: populatedRequest!.id.toString(),
      farmerId: populatedRequest!.farmer ? {
        ...populatedRequest!.farmer,
        id: populatedRequest!.farmer.id.toString()
      } : populatedRequest!.farmerId,
      feedId: populatedRequest!.feed ? {
        ...populatedRequest!.feed,
        id: populatedRequest!.feed.id.toString()
      } : populatedRequest!.feedId
    };

    return reply.status(201).send({
      success: true,
      message: 'Request created successfully',
      data: transformedRequest,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.name || 'Error',
      message: error.message || 'Failed to create request',
    });
  }
}

export async function approveRequest(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = (request as any).user;
    const params = request.params as any;
    
    const feedRequestRepo = AppDataSource.getRepository(FeedRequest);
    const stockRepo = AppDataSource.getRepository(Stock);
    const farmerRepo = AppDataSource.getRepository(Farmer);
    const feedHistoryRepo = AppDataSource.getRepository(FeedHistory);

    const feedRequest = await feedRequestRepo.findOne({ where: { id: parseInt(params.id) } });

    if (!feedRequest) {
      throw new AppError('Request not found', 404);
    }

    if (feedRequest.status !== 'Pending') {
      throw new AppError('Request is already processed', 400);
    }

    // Get feed and farmer details
    const feed = await stockRepo.findOne({ where: { id: feedRequest.feedId } });
    const farmer = await farmerRepo.findOne({ where: { id: feedRequest.farmerId } });

    if (!feed || !farmer) {
      throw new AppError('Invalid request data', 400);
    }

    // Check stock availability
    if (feed.quantityBags < feedRequest.qtyBags) {
      throw new AppError(`Insufficient stock. Only ${feed.quantityBags} bags available`, 400);
    }

    // Start transaction
    await AppDataSource.transaction(async (manager) => {
      // Update stock quantity
      feed.quantityBags -= feedRequest.qtyBags;
      feed.updatedBy = user.name;
      await manager.save(feed);

      // Create feed history entry
      const feedHistory = feedHistoryRepo.create({
        farmerId: feedRequest.farmerId,
        date: new Date(),
        feedType: feed.name,
        bags: feedRequest.qtyBags,
        price: feedRequest.price,
        approvedBy: user.name,
      });
      await manager.save(feedHistory);

      // Calculate and store historical prices at approval time
      const sellingPriceAtApproval = feed.sellingPrice;
      const purchasePriceAtApproval = feed.purchasePrice;
      const totalProfitAtApproval = (sellingPriceAtApproval - purchasePriceAtApproval) * feedRequest.qtyBags;

      // Update request status with historical prices
      feedRequest.status = 'Approved';
      feedRequest.approvedBy = user.name;
      feedRequest.approvedAt = new Date();
      feedRequest.sellingPriceAtApproval = sellingPriceAtApproval;
      feedRequest.purchasePriceAtApproval = purchasePriceAtApproval;
      feedRequest.totalProfitAtApproval = totalProfitAtApproval;
      await manager.save(feedRequest);
    });

    const populatedRequest = await feedRequestRepo.findOne({
      where: { id: feedRequest.id },
      relations: ['farmer', 'feed']
    });

    // Transform for frontend compatibility
    const transformedRequest = {
      ...populatedRequest!,
      id: populatedRequest!.id.toString(),
      farmerId: populatedRequest!.farmer ? {
        ...populatedRequest!.farmer,
        id: populatedRequest!.farmer.id.toString()
      } : populatedRequest!.farmerId,
      feedId: populatedRequest!.feed ? {
        ...populatedRequest!.feed,
        id: populatedRequest!.feed.id.toString()
      } : populatedRequest!.feedId
    };

    return reply.send({
      success: true,
      message: 'Request approved successfully',
      data: transformedRequest,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.name || 'Error',
      message: error.message || 'Failed to approve request',
    });
  }
}

export async function rejectRequest(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = (request as any).user;
    const params = request.params as any;
    const feedRequestRepo = AppDataSource.getRepository(FeedRequest);
    
    const feedRequest = await feedRequestRepo.findOne({ where: { id: parseInt(params.id) } });

    if (!feedRequest) {
      throw new AppError('Request not found', 404);
    }

    if (feedRequest.status !== 'Pending') {
      throw new AppError('Request is already processed', 400);
    }

    feedRequest.status = 'Rejected';
    feedRequest.approvedBy = user.name;
    feedRequest.approvedAt = new Date();
    await feedRequestRepo.save(feedRequest);

    const populatedRequest = await feedRequestRepo.findOne({
      where: { id: feedRequest.id },
      relations: ['farmer', 'feed']
    });

    // Transform for frontend compatibility
    const transformedRequest = {
      ...populatedRequest!,
      id: populatedRequest!.id.toString(),
      farmerId: populatedRequest!.farmer ? {
        ...populatedRequest!.farmer,
        id: populatedRequest!.farmer.id.toString()
      } : populatedRequest!.farmerId,
      feedId: populatedRequest!.feed ? {
        ...populatedRequest!.feed,
        id: populatedRequest!.feed.id.toString()
      } : populatedRequest!.feedId
    };

    return reply.send({
      success: true,
      message: 'Request rejected successfully',
      data: transformedRequest,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.name || 'Error',
      message: error.message || 'Failed to reject request',
    });
  }
}

export async function getPendingRequests(request: FastifyRequest, reply: FastifyReply) {
  try {
    const feedRequestRepo = AppDataSource.getRepository(FeedRequest);
    const pendingRequests = await feedRequestRepo.find({
      where: { status: 'Pending' },
      relations: ['farmer', 'feed'],
      order: { createdAt: 'DESC' }
    });

    // Transform for frontend compatibility
    const transformedRequests = pendingRequests.map(req => ({
      ...req,
      id: req.id.toString(),
      farmerId: req.farmer ? {
        ...req.farmer,
        id: req.farmer.id.toString()
      } : req.farmerId,
      feedId: req.feed ? {
        ...req.feed,
        id: req.feed.id.toString()
      } : req.feedId
    }));

    return reply.send({
      success: true,
      count: pendingRequests.length,
      data: transformedRequests,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch pending requests',
    });
  }
}

