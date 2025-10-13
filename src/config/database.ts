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
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'aditya',  
  database: process.env.DB_NAME || 'dairyflow',
  entities: [SuperAdmin, Admin, Farmer, Stock, FeedRequest, FeedHistory],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  ssl: {
    rejectUnauthorized: false, // Allow self-signed certificates
  },
  extra: {
    // Additional connection options
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    sslmode: 'require', // Require SSL connection
  },
});
export async function connectDatabase() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    
    console.log('✅ PostgreSQL connected successfully');
    console.log(`📍 Database: ${AppDataSource.options.database}`);
    if ('host' in AppDataSource.options && 'port' in AppDataSource.options) {
      console.log(`🏠 Host: ${(AppDataSource.options as any).host}:${(AppDataSource.options as any).port}`);
    }

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        console.log('👋 PostgreSQL connection closed through app termination');
      }
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
    process.exit(1);
  }
}

