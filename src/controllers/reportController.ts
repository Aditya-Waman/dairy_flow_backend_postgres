import { FastifyRequest, FastifyReply } from 'fastify';
import { FeedRequest } from '../models/FeedRequest.js';
import { Farmer } from '../models/Farmer.js';
import { Stock } from '../models/Stock.js';
import { Admin } from '../models/Admin.js';
import { AppDataSource } from '../config/database.js';
import { MoreThanOrEqual, LessThanOrEqual } from 'typeorm';

interface ReportQuery {
  farmerId?: string;
  adminId?: string;
  startDate?: string;
  endDate?: string;
}

export async function getReports(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const query = request.query as any;
    const { farmerId, adminId, startDate, endDate } = query;

    const feedRequestRepo = AppDataSource.getRepository(FeedRequest);
    const adminRepo = AppDataSource.getRepository(Admin);
    
    // Build filter
    const whereConditions: any = { status: 'Approved' };

    if (farmerId) {
      whereConditions.farmerId = parseInt(farmerId);
    }

    if (startDate || endDate) {
      whereConditions.approvedAt = {};
      if (startDate) {
        whereConditions.approvedAt = MoreThanOrEqual(new Date(startDate));
      }
      if (endDate) {
        whereConditions.approvedAt = LessThanOrEqual(new Date(endDate));
      }
    }

    // Get approved requests with populated data
    const requests = await feedRequestRepo.find({
      where: whereConditions,
      relations: ['farmer', 'feed'],
      order: { approvedAt: 'DESC' }
    });

    // Filter by admin name if provided
    let filteredRequests = requests;
    if (adminId) {
      const admin = await adminRepo.findOne({ where: { id: parseInt(adminId) } });
      if (admin) {
        filteredRequests = requests.filter(r => r.approvedBy === admin.name);
      }
    }

    // Calculate totals
    let totalBags = 0;
    let totalRevenue = 0;
    let totalCost = 0;

    for (const req of filteredRequests) {
      const feed = req.feed as any;
      totalBags += req.qtyBags;
      totalRevenue += req.qtyBags * feed.sellingPrice;
      totalCost += req.qtyBags * feed.purchasePrice;
    }

    const totalProfit = totalRevenue - totalCost;

    // Farmer-wise summary
    const farmerMap: Record<string, any> = {};

    for (const req of filteredRequests) {
      const farmer = req.farmer as any;
      const feed = req.feed as any;

      if (!farmerMap[farmer.id]) {
        farmerMap[farmer.id] = {
          farmer: {
            id: farmer.id,
            fullName: farmer.fullName,
            mobile: farmer.mobile,
            code: farmer.code,
          },
          totalBags: 0,
          totalRevenue: 0,
          totalCost: 0,
          totalProfit: 0,
          feeds: [],
        };
      }

      const feedIndex = farmerMap[farmer.id].feeds.findIndex(
        (f: any) => f.feedName === feed.name
      );

      if (feedIndex >= 0) {
        farmerMap[farmer.id].feeds[feedIndex].bags += req.qtyBags;
        farmerMap[farmer.id].feeds[feedIndex].revenue += req.qtyBags * feed.sellingPrice;
        farmerMap[farmer.id].feeds[feedIndex].cost += req.qtyBags * feed.purchasePrice;
        farmerMap[farmer.id].feeds[feedIndex].profit +=
          req.qtyBags * (feed.sellingPrice - feed.purchasePrice);
        
        if (req.approvedAt && new Date(req.approvedAt) > new Date(farmerMap[farmer.id].feeds[feedIndex].lastApproved)) {
          farmerMap[farmer.id].feeds[feedIndex].lastApproved = req.approvedAt;
          farmerMap[farmer.id].feeds[feedIndex].approvedBy = req.approvedBy || '';
        }
      } else {
        farmerMap[farmer.id].feeds.push({
          feedName: feed.name,
          bags: req.qtyBags,
          revenue: req.qtyBags * feed.sellingPrice,
          cost: req.qtyBags * feed.purchasePrice,
          profit: req.qtyBags * (feed.sellingPrice - feed.purchasePrice),
          lastApproved: req.approvedAt || new Date(),
          approvedBy: req.approvedBy || '',
        });
      }

      farmerMap[farmer.id].totalBags += req.qtyBags;
      farmerMap[farmer.id].totalRevenue += req.qtyBags * feed.sellingPrice;
      farmerMap[farmer.id].totalCost += req.qtyBags * feed.purchasePrice;
      farmerMap[farmer.id].totalProfit +=
        req.qtyBags * (feed.sellingPrice - feed.purchasePrice);
    }

    const farmerSummary = Object.values(farmerMap).sort(
      (a: any, b: any) => b.totalProfit - a.totalProfit
    );

    return reply.send({
      success: true,
      summary: {
        totalFarmers: farmerSummary.length,
        totalBags,
        totalRevenue,
        totalCost,
        totalProfit,
        totalTransactions: filteredRequests.length,
      },
      farmerSummary,
      transactions: filteredRequests.map(r => ({
        id: r.id,
        farmer: r.farmer,
        feed: r.feed,
        qtyBags: r.qtyBags,
        price: r.price,
        approvedBy: r.approvedBy,
        approvedAt: r.approvedAt,
      })),
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: error.message || 'Failed to generate report',
    });
  }
}

export async function getFarmerReport(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const params = request.params as any;
    const query = request.query as any;
    const { farmerId } = params;
    const { startDate, endDate } = query;

    const farmerRepo = AppDataSource.getRepository(Farmer);
    const feedRequestRepo = AppDataSource.getRepository(FeedRequest);

    const farmer = await farmerRepo.findOne({ where: { id: parseInt(farmerId) } });
    if (!farmer) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Farmer not found',
      });
    }

    const whereConditions: any = {
      farmerId: parseInt(farmerId),
      status: 'Approved',
    };

    if (startDate || endDate) {
      whereConditions.approvedAt = {};
      if (startDate) {
        whereConditions.approvedAt = MoreThanOrEqual(new Date(startDate));
      }
      if (endDate) {
        whereConditions.approvedAt = LessThanOrEqual(new Date(endDate));
      }
    }

    const requests = await feedRequestRepo.find({
      where: whereConditions,
      relations: ['feed'],
      order: { approvedAt: 'DESC' }
    });

    let totalBags = 0;
    let totalAmount = 0;

    const feedBreakdown: Record<string, any> = {};

    for (const req of requests) {
      const feed = req.feed as any;
      totalBags += req.qtyBags;
      totalAmount += req.price;

      if (!feedBreakdown[feed.name]) {
        feedBreakdown[feed.name] = {
          feedName: feed.name,
          totalBags: 0,
          totalAmount: 0,
          transactions: 0,
        };
      }

      feedBreakdown[feed.name].totalBags += req.qtyBags;
      feedBreakdown[feed.name].totalAmount += req.price;
      feedBreakdown[feed.name].transactions += 1;
    }

    return reply.send({
      success: true,
      farmer: {
        id: farmer.id,
        fullName: farmer.fullName,
        mobile: farmer.mobile,
        code: farmer.code,
        status: farmer.status,
      },
      summary: {
        totalBags,
        totalAmount,
        totalTransactions: requests.length,
      },
      feedBreakdown: Object.values(feedBreakdown),
      transactions: requests,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: error.message || 'Failed to generate farmer report',
    });
  }
}

export async function getFeedStockReport(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const query = request.query as any;
    const { startDate, endDate } = query;

    const stockRepo = AppDataSource.getRepository(Stock);
    const feedRequestRepo = AppDataSource.getRepository(FeedRequest);

    // Get all stock items
    const allStock = await stockRepo.find({
      order: { name: 'ASC' }
    });

    // Build date filter for approved requests
    const whereConditions: any = { status: 'Approved' };
    
    if (startDate || endDate) {
      whereConditions.approvedAt = {};
      if (startDate) {
        whereConditions.approvedAt = MoreThanOrEqual(new Date(startDate));
      }
      if (endDate) {
        whereConditions.approvedAt = LessThanOrEqual(new Date(endDate));
      }
    }

    // Get approved requests in the date range
    const approvedRequests = await feedRequestRepo.find({
      where: whereConditions,
      relations: ['feed'],
      order: { approvedAt: 'DESC' }
    });

    // Calculate stock report for each feed
    const feedStockReport = allStock.map(stock => {
      // Calculate total sold (from approved requests in date range)
      const soldInPeriod = approvedRequests
        .filter(req => (req.feed as any).id === stock.id)
        .reduce((total, req) => total + req.qtyBags, 0);

      // For "Total Ordered", we need to consider stock additions
      // Since we don't have a separate stock addition table, we'll use the current stock quantity
      // plus the sold quantity as an approximation of total ordered
      const totalOrdered = stock.quantityBags + soldInPeriod;

      // Remaining stock is current stock quantity
      const remainingStock = stock.quantityBags;

      return {
        feedId: stock.id,
        feedName: stock.name,
        feedType: stock.type,
        totalOrdered,
        totalSold: soldInPeriod,
        remainingStock,
        currentPrice: stock.sellingPrice,
        purchasePrice: stock.purchasePrice,
        bagWeight: stock.bagWeight,
        lastUpdated: stock.lastUpdated
      };
    });

    // Calculate summary totals
    const summary = {
      totalFeeds: feedStockReport.length,
      totalOrdered: feedStockReport.reduce((sum, feed) => sum + feed.totalOrdered, 0),
      totalSold: feedStockReport.reduce((sum, feed) => sum + feed.totalSold, 0),
      totalRemaining: feedStockReport.reduce((sum, feed) => sum + feed.remainingStock, 0),
      totalValue: feedStockReport.reduce((sum, feed) => sum + (feed.remainingStock * feed.currentPrice), 0)
    };

    return reply.send({
      success: true,
      summary,
      feedStockReport,
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
      message: error.message || 'Failed to generate feed stock report',
    });
  }
}

