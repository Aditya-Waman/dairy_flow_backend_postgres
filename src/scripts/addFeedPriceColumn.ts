import 'reflect-metadata';
import { AppDataSource } from '../config/database.js';

async function addFeedPriceColumn() {
  try {
    console.log('🔄 Connecting to database...');
    await AppDataSource.initialize();
    
    console.log('🔄 Adding feed_price column to feed_requests table...');
    
    // Get query runner for manual SQL execution
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
      // Start transaction
      await queryRunner.startTransaction();
      
      // Check if column already exists
      const columnExists = await queryRunner.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'feed_requests' 
        AND column_name = 'feed_price'
      `);
      
      if (columnExists.length > 0) {
        console.log('ℹ️  feed_price column already exists, skipping...');
      } else {
        // Add the new column
        await queryRunner.query(`
          ALTER TABLE feed_requests 
          ADD COLUMN feed_price DECIMAL(10,2) NOT NULL DEFAULT 0
        `);
        
        // Update existing records with current selling price from stock table
        await queryRunner.query(`
          UPDATE feed_requests 
          SET feed_price = stock.selling_price
          FROM stock 
          WHERE feed_requests.feed_id = stock.id
        `);
        
        console.log('✅ feed_price column added successfully!');
        console.log('✅ Existing records updated with current selling prices');
      }
      
      // Commit transaction
      await queryRunner.commitTransaction();
      
      console.log('🎉 Migration completed successfully!');
      
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('👋 Database connection closed');
    }
  }
}

// Run the migration
addFeedPriceColumn();
