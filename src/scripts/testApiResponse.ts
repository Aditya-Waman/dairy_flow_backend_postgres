import 'reflect-metadata';
import dotenv from 'dotenv';
import { AppDataSource } from '../config/database.js';
import { FeedRequest } from '../models/FeedRequest.js';

// Load environment variables
dotenv.config();

async function testApiResponse() {
  try {
    console.log('🔍 Testing API Response Format...');
    
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connection established');
    
    const feedRequestRepo = AppDataSource.getRepository(FeedRequest);
    
    // Get all requests with relations (same as getAllRequests function)
    const requests = await feedRequestRepo.find({
      relations: ['farmer', 'feed'],
      order: { createdAt: 'DESC' }
    });

    // Transform for frontend compatibility (same as in controller)
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

    console.log('📊 API Response Format:');
    console.log(JSON.stringify(transformedRequests, null, 2));
    
    // Check specific fields for approved requests
    const approvedRequests = transformedRequests.filter(req => req.status === 'Approved');
    console.log('\n🔍 Approved Requests Analysis:');
    
    approvedRequests.forEach((req, index) => {
      console.log(`\n--- Approved Request ${index + 1} ---`);
      console.log(`ID: ${req.id}`);
      console.log(`Status: ${req.status}`);
      console.log(`sellingPriceAtApproval: ${req.sellingPriceAtApproval}`);
      console.log(`purchasePriceAtApproval: ${req.purchasePriceAtApproval}`);
      console.log(`totalProfitAtApproval: ${req.totalProfitAtApproval}`);
      console.log(`Type of sellingPriceAtApproval: ${typeof req.sellingPriceAtApproval}`);
      console.log(`Type of purchasePriceAtApproval: ${typeof req.purchasePriceAtApproval}`);
      console.log(`Type of totalProfitAtApproval: ${typeof req.totalProfitAtApproval}`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await AppDataSource.destroy();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
}

// Run the test
testApiResponse();
