import 'reflect-metadata';
import { AppDataSource } from '../config/database.js';

async function clearDatabaseData() {
  try {
    console.log('🔄 Connecting to database...');
    
    // Create a temporary DataSource without synchronization for cleanup
    const tempDataSource = new (AppDataSource.constructor as any)({
      ...AppDataSource.options,
      synchronize: false, // Disable synchronization for cleanup
      logging: false,     // Disable logging for cleanup
    });
    
    await tempDataSource.initialize();
    
    console.log('🗑️  Starting database cleanup...');
    
    // Get query runner for manual SQL execution
    const queryRunner = tempDataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
      // Start transaction
      await queryRunner.startTransaction();
      
      // Delete data from tables (in correct order due to foreign key constraints)
      console.log('📝 Deleting feed history...');
      await queryRunner.query('DELETE FROM feed_history');
      
      console.log('📝 Deleting feed requests...');
      await queryRunner.query('DELETE FROM feed_requests');
      
      console.log('📝 Deleting farmers...');
      await queryRunner.query('DELETE FROM farmers');
      
      console.log('📝 Deleting stock...');
      await queryRunner.query('DELETE FROM stock');
      
      console.log('📝 Deleting admins...');
      await queryRunner.query('DELETE FROM admins');
      
      // Reset serial sequences to start from 1
      console.log('🔄 Resetting serial sequences...');
      await queryRunner.query('ALTER SEQUENCE admins_id_seq RESTART WITH 1');
      await queryRunner.query('ALTER SEQUENCE farmers_id_seq RESTART WITH 1');
      await queryRunner.query('ALTER SEQUENCE stock_id_seq RESTART WITH 1');
      await queryRunner.query('ALTER SEQUENCE feed_requests_id_seq RESTART WITH 1');
      await queryRunner.query('ALTER SEQUENCE feed_history_id_seq RESTART WITH 1');
      
      // Commit transaction
      await queryRunner.commitTransaction();
      
      console.log('✅ Database cleanup completed successfully!');
      console.log('📊 Summary:');
      console.log('   - All data deleted except SuperAdmin');
      console.log('   - Serial sequences reset to start from 1');
      console.log('   - SuperAdmin data preserved');
      
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
    
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('👋 Database connection closed');
    }
  }
}

// Run the cleanup
clearDatabaseData();
