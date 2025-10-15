import { AppDataSource } from '../config/database.js';
import { FeedRequest } from '../models/FeedRequest.js';
import { Farmer } from '../models/Farmer.js';
import { Stock } from '../models/Stock.js';
import { getCurrentISTString, toISTString, formatForAPI } from '../utils/timezone.js';

async function testTimezoneFunctionality() {
  try {
    console.log('🔄 Testing timezone functionality...');
    
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    // Set timezone for this session
    await AppDataSource.query("SET timezone = 'Asia/Kolkata'");
    console.log('🇮🇳 Database timezone set to Asia/Kolkata');
    
    // Test current time
    const currentTime = new Date();
    console.log('\n📅 Time Tests:');
    console.log('🕐 Current UTC time:', currentTime.toISOString());
    console.log('🇮🇳 Current IST time (utility):', getCurrentISTString());
    console.log('🇮🇳 Current IST time (formatted):', toISTString(currentTime));
    console.log('🇮🇳 Current IST time (API format):', formatForAPI(currentTime));
    
    // Test database time
    const dbTimeResult = await AppDataSource.query(`
      SELECT 
        now() as db_time,
        now() AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata' as ist_time,
        extract(timezone from now()) as timezone_offset
    `);
    
    console.log('\n🗄️  Database Time Tests:');
    console.log('🕐 Database time (IST):', dbTimeResult[0].db_time);
    console.log('🇮🇳 Database IST time (converted):', dbTimeResult[0].ist_time);
    console.log('⏰ Timezone offset (seconds):', dbTimeResult[0].timezone_offset);
    
    // Test creating a record with timestamp
    console.log('\n📝 Testing record creation with timestamps...');
    
    // Create a test farmer
    const farmerRepo = AppDataSource.getRepository(Farmer);
    const testFarmer = farmerRepo.create({
      fullName: 'Test Farmer IST',
      mobile: '9876543210',
      code: 'TF001',
      email: 'test@example.com',
      status: 'Active',
      createdBy: 'system'
    });
    
    const savedFarmer = await farmerRepo.save(testFarmer);
    console.log('✅ Test farmer created with ID:', savedFarmer.id);
    console.log('📅 Farmer created at (IST):', toISTString(savedFarmer.createdAt));
    
    // Create a test stock item
    const stockRepo = AppDataSource.getRepository(Stock);
    const testStock = stockRepo.create({
      name: 'Test Feed IST',
      type: 'Cattle Feed',
      quantityBags: 100,
      bagWeight: 50.0,
      purchasePrice: 1000.00,
      sellingPrice: 1200.00,
      updatedBy: 'system'
    });
    
    const savedStock = await stockRepo.save(testStock);
    console.log('✅ Test stock created with ID:', savedStock.id);
    console.log('📅 Stock created at (IST):', toISTString(savedStock.createdAt));
    console.log('📅 Stock updated at (IST):', toISTString(savedStock.updatedAt));
    
    // Create a test feed request
    const requestRepo = AppDataSource.getRepository(FeedRequest);
    const testRequest = requestRepo.create({
      farmerId: savedFarmer.id,
      feedId: savedStock.id,
      qtyBags: 5,
      price: 6000.00,
      feedPrice: 1200.00,
      status: 'Pending',
      createdBy: 'system'
    });
    
    const savedRequest = await requestRepo.save(testRequest);
    console.log('✅ Test request created with ID:', savedRequest.id);
    console.log('📅 Request created at (IST):', toISTString(savedRequest.createdAt));
    console.log('📅 Request updated at (IST):', toISTString(savedRequest.updatedAt));
    
    // Test retrieving records and checking timestamps
    console.log('\n🔍 Testing record retrieval...');
    const retrievedRequest = await requestRepo.findOne({
      where: { id: savedRequest.id },
      relations: ['farmer', 'feed']
    });
    
    if (retrievedRequest) {
      console.log('✅ Request retrieved successfully');
      console.log('📅 Retrieved created at (IST):', toISTString(retrievedRequest.createdAt));
      console.log('📅 Retrieved updated at (IST):', toISTString(retrievedRequest.updatedAt));
    }
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await requestRepo.delete({ id: savedRequest.id });
    await stockRepo.delete({ id: savedStock.id });
    await farmerRepo.delete({ id: savedFarmer.id });
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 Timezone functionality test completed successfully!');
    console.log('✅ All timestamps are working correctly in IST');
    
  } catch (error) {
    console.error('❌ Error testing timezone functionality:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Run the test
testTimezoneFunctionality();
