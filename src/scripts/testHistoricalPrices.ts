import 'reflect-metadata';
import dotenv from 'dotenv';
import { AppDataSource } from '../config/database.js';
import { FeedRequest } from '../models/FeedRequest.js';

// Load environment variables
dotenv.config();

async function testHistoricalPrices() {
  try {
    console.log('🔍 Testing Historical Price Storage...');
    
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connection established');
    
    const feedRequestRepo = AppDataSource.getRepository(FeedRequest);
    
    // Get all requests with relations
    const requests = await feedRequestRepo.find({
      relations: ['farmer', 'feed'],
      order: { createdAt: 'DESC' }
    });
    
    console.log(`📊 Found ${requests.length} requests`);
    console.log('');
    
    requests.forEach((req, index) => {
      console.log(`--- Request ${index + 1} (ID: ${req.id}) ---`);
      console.log(`Status: ${req.status}`);
      console.log(`Farmer: ${req.farmer?.fullName || 'N/A'}`);
      console.log(`Feed: ${req.feed?.name || 'N/A'}`);
      console.log(`Quantity: ${req.qtyBags} bags`);
      console.log(`Current Feed Selling Price: ${req.feed?.sellingPrice || 'N/A'}`);
      console.log(`Current Feed Purchase Price: ${req.feed?.purchasePrice || 'N/A'}`);
      console.log(`Stored Selling Price at Approval: ${req.sellingPriceAtApproval || 'NULL'}`);
      console.log(`Stored Purchase Price at Approval: ${req.purchasePriceAtApproval || 'NULL'}`);
      console.log(`Stored Total Profit at Approval: ${req.totalProfitAtApproval || 'NULL'}`);
      console.log(`Approved By: ${req.approvedBy || 'N/A'}`);
      console.log(`Approved At: ${req.approvedAt || 'N/A'}`);
      console.log('');
    });
    
    // Check if any approved requests have historical prices
    const approvedRequests = requests.filter(req => req.status === 'Approved');
    const withHistoricalPrices = approvedRequests.filter(req => 
      req.sellingPriceAtApproval && req.purchasePriceAtApproval && req.totalProfitAtApproval
    );
    
    console.log(`📈 Summary:`);
    console.log(`   Total Requests: ${requests.length}`);
    console.log(`   Approved Requests: ${approvedRequests.length}`);
    console.log(`   Approved with Historical Prices: ${withHistoricalPrices.length}`);
    
    if (approvedRequests.length > 0 && withHistoricalPrices.length === 0) {
      console.log('⚠️  WARNING: Approved requests found but no historical prices stored!');
      console.log('   This means the approval logic is not working correctly.');
    } else if (withHistoricalPrices.length > 0) {
      console.log('✅ Historical prices are being stored correctly!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await AppDataSource.destroy();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
}

// Run the test
testHistoricalPrices();
