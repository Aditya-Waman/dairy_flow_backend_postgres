import 'reflect-metadata';
import dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { SuperAdmin } from '../models/SuperAdmin.js';
import { Admin } from '../models/Admin.js';
import { Farmer } from '../models/Farmer.js';
import { Stock } from '../models/Stock.js';
import { FeedRequest } from '../models/FeedRequest.js';
import { FeedHistory } from '../models/FeedHistory.js';

// Load environment variables
dotenv.config();


export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'ep-divine-breeze-a1ksp8mp-pooler.ap-southeast-1.aws.neon.tech',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'npg_oWZCwymn3zd9',  
  database: process.env.DB_NAME || 'neondb',
  entities: [SuperAdmin, Admin, Farmer, Stock, FeedRequest, FeedHistory],
  synchronize: false, // Disable synchronize to avoid schema conflicts
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false, // Allow self-signed certificates
  } : false,
  extra: {
    // Additional connection options for Neon
    connectionTimeoutMillis: 30000, // Increased timeout
    idleTimeoutMillis: 60000, // Increased idle timeout
    max: 20, // Maximum number of connections
    sslmode: process.env.DB_SSL === 'true' ? 'require' : 'prefer',
    // Set timezone to Indian Standard Time
    timezone: 'Asia/Kolkata',
  },
});
export async function connectDatabase() {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      if (!AppDataSource.isInitialized) {
        console.log(`🔄 Attempting to connect to PostgreSQL (attempt ${retryCount + 1}/${maxRetries})...`);
        await AppDataSource.initialize();
      }
      
      console.log('✅ PostgreSQL connected successfully');
      console.log(`📍 Database: ${AppDataSource.options.database}`);
      if ('host' in AppDataSource.options && 'port' in AppDataSource.options) {
        console.log(`🏠 Host: ${(AppDataSource.options as any).host}:${(AppDataSource.options as any).port}`);
      }

      // Set timezone to Indian Standard Time
      await AppDataSource.query("SET timezone = 'Asia/Kolkata'");
      console.log('🇮🇳 Database timezone set to Asia/Kolkata (IST)');

      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        if (AppDataSource.isInitialized) {
          await AppDataSource.destroy();
          console.log('👋 PostgreSQL connection closed through app termination');
        }
        process.exit(0);
      });
      
      return; // Success, exit the retry loop
      
    } catch (error: any) {
      retryCount++;
      console.error(`❌ PostgreSQL connection failed (attempt ${retryCount}/${maxRetries}):`, error.message);
      
      if (retryCount >= maxRetries) {
        console.error('❌ Max retries reached. PostgreSQL connection failed permanently.');
        console.error('💡 Please check:');
        console.error('   1. Database server is running');
        console.error('   2. Network connectivity');
        console.error('   3. Database credentials in .env file');
        console.error('   4. SSL configuration');
        process.exit(1);
      }
      
      // Wait before retrying
      console.log(`⏳ Waiting 5 seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

