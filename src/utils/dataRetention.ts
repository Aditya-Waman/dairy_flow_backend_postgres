import cron from 'node-cron';
import { FeedRequest } from '../models/FeedRequest.js';
import { AppDataSource } from '../config/database.js';
import { LessThan, In } from 'typeorm';

const DATA_RETENTION_MONTHS = parseInt(process.env.DATA_RETENTION_MONTHS || '12');
const ENABLE_DATA_RETENTION = process.env.ENABLE_DATA_RETENTION !== 'false';

/**
 * Delete old feed requests and stock history after specified retention period
 * Runs daily at 2 AM
 * Note: SuperAdmin, Admin, and Farmer data persist permanently
 */
export function scheduleDataRetention() {
  if (!ENABLE_DATA_RETENTION) {
    console.log('ℹ️  Data retention scheduler disabled via ENABLE_DATA_RETENTION=false');
    return;
  }
  // Run daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('🗑️  Starting data retention cleanup...');
      
      const retentionDate = new Date();
      retentionDate.setMonth(retentionDate.getMonth() - DATA_RETENTION_MONTHS);

      const feedRequestRepo = AppDataSource.getRepository(FeedRequest);
      
      // Delete old feed requests (except Approved ones with recent history)
      const deletedRequests = await feedRequestRepo.delete({
        createdAt: LessThan(retentionDate),
        status: In(['Rejected', 'Pending']),
      });

      console.log(`✅ Deleted ${deletedRequests.affected} old feed requests`);
      console.log(`📅 Retention period: ${DATA_RETENTION_MONTHS} months`);
      console.log(`🔒 SuperAdmin, Admin, and Farmer data preserved permanently`);
      
    } catch (error) {
      console.error('❌ Data retention cleanup failed:', error);
    }
  });

  console.log(`✅ Data retention scheduler started (runs daily at 2 AM)`);
  console.log(`📅 Retention period: ${DATA_RETENTION_MONTHS} months`);
}

/**
 * Manual cleanup function for immediate execution
 */
export async function runDataCleanup() {
  try {
    console.log('🗑️  Running manual data cleanup...');
    
    const retentionDate = new Date();
    retentionDate.setMonth(retentionDate.getMonth() - DATA_RETENTION_MONTHS);

    const feedRequestRepo = AppDataSource.getRepository(FeedRequest);
    
    const deletedRequests = await feedRequestRepo.delete({
      createdAt: LessThan(retentionDate),
      status: In(['Rejected', 'Pending']),
    });

    console.log(`✅ Manual cleanup complete`);
    console.log(`   - Deleted ${deletedRequests.affected} old feed requests`);
    
    return {
      success: true,
      deletedRequests: deletedRequests.affected,
    };
  } catch (error) {
    console.error('❌ Manual data cleanup failed:', error);
    throw error;
  }
}

