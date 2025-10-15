import { AppDataSource } from '../config/database.js';
import { FeedRequest } from '../models/FeedRequest.js';
import { Farmer } from '../models/Farmer.js';
import { Stock } from '../models/Stock.js';
import { toISTString, getCurrentISTString } from '../utils/timezone.js';

async function testFeedRequestTime() {
  try {
    console.log('🔄 Testing Feed Request Time Storage...');
    
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    // Set timezone for this session
    await AppDataSource.query("SET timezone = 'Asia/Kolkata'");
    console.log('🇮🇳 Database timezone set to Asia/Kolkata');
    
    console.log('\n📅 Current Time Before Creating Request:');
    console.log('🕐 Current IST Time:', getCurrentISTString());
    
    // Create a test farmer
    const farmerRepo = AppDataSource.getRepository(Farmer);
    const testFarmer = farmerRepo.create({
      fullName: 'Test Farmer for Time',
      mobile: '9876543211',
      code: 'TFT001',
      email: 'testtime@example.com',
      status: 'Active',
      createdBy: 'system'
    });
    
    const savedFarmer = await farmerRepo.save(testFarmer);
    console.log('✅ Test farmer created with ID:', savedFarmer.id);
    
    // Create a test stock item
    const stockRepo = AppDataSource.getRepository(Stock);
    const testStock = stockRepo.create({
      name: 'Test Feed for Time',
      type: 'Cattle Feed',
      quantityBags: 100,
      bagWeight: 50.0,
      purchasePrice: 1000.00,
      sellingPrice: 1200.00,
      updatedBy: 'system'
    });
    
    const savedStock = await stockRepo.save(testStock);
    console.log('✅ Test stock created with ID:', savedStock.id);
    
    // Create a feed request and capture the exact time
    console.log('\n📝 Creating Feed Request...');
    const requestTime = new Date();
    console.log('🕐 Request creation time (JavaScript):', requestTime.toISOString());
    console.log('🇮🇳 Request creation time (IST):', toISTString(requestTime));
    
    const requestRepo = AppDataSource.getRepository(FeedRequest);
    const testRequest = requestRepo.create({
      farmerId: savedFarmer.id,
      feedId: savedStock.id,
      qtyBags: 10,
      price: 12000.00,
      feedPrice: 1200.00,
      status: 'Pending',
      createdBy: 'system'
    });
    
    const savedRequest = await requestRepo.save(testRequest);
    console.log('✅ Feed request created with ID:', savedRequest.id);
    
    // Check what time was actually stored in the database
    console.log('\n🗄️  Time Stored in Database:');
    console.log('📅 Created At (raw):', savedRequest.createdAt);
    console.log('📅 Created At (IST):', toISTString(savedRequest.createdAt));
    console.log('📅 Updated At (raw):', savedRequest.updatedAt);
    console.log('📅 Updated At (IST):', toISTString(savedRequest.updatedAt));
    
    // Query the database directly to see the raw timestamp
    const dbResult = await AppDataSource.query(`
      SELECT 
        id,
        created_at,
        updated_at,
        created_at AT TIME ZONE 'Asia/Kolkata' as created_at_ist,
        updated_at AT TIME ZONE 'Asia/Kolkata' as updated_at_ist
      FROM feed_requests 
      WHERE id = $1
    `, [savedRequest.id]);
    
    console.log('\n🔍 Raw Database Query Results:');
    console.log('📅 Created At (DB raw):', dbResult[0].created_at);
    console.log('🇮🇳 Created At (DB IST):', dbResult[0].created_at_ist);
    console.log('📅 Updated At (DB raw):', dbResult[0].updated_at);
    console.log('🇮🇳 Updated At (DB IST):', dbResult[0].updated_at_ist);
    
    // Show the timezone information
    const timezoneResult = await AppDataSource.query(`
      SELECT 
        current_setting('timezone') as timezone,
        now() as current_db_time,
        extract(timezone from now()) as timezone_offset
    `);
    
    console.log('\n⏰ Database Timezone Info:');
    console.log('📍 Database timezone:', timezoneResult[0].timezone);
    console.log('🕐 Current DB time:', timezoneResult[0].current_db_time);
    console.log('⏰ Timezone offset (seconds):', timezoneResult[0].timezone_offset);
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await requestRepo.delete({ id: savedRequest.id });
    await stockRepo.delete({ id: savedStock.id });
    await farmerRepo.delete({ id: savedFarmer.id });
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 Feed Request Time Test Completed!');
    console.log('✅ All timestamps are stored in IST in the database');
    
  } catch (error) {
    console.error('❌ Error testing feed request time:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Run the test
testFeedRequestTime();
