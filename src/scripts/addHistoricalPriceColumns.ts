import { AppDataSource } from '../config/database.js';

async function addHistoricalPriceColumns() {
  try {
    console.log('🔄 Starting database migration to add historical price columns...');
    
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connection established');
    
    // Add new columns to feed_requests table
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
      // Check if columns already exist
      const tableInfo = await queryRunner.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'feed_requests' 
        AND column_name IN ('selling_price_at_approval', 'purchase_price_at_approval', 'total_profit_at_approval')
      `);
      
      const existingColumns = tableInfo.map((row: any) => row.column_name);
      
      if (!existingColumns.includes('selling_price_at_approval')) {
        await queryRunner.query(`
          ALTER TABLE feed_requests 
          ADD COLUMN selling_price_at_approval DECIMAL(10,2) NULL
        `);
        console.log('✅ Added selling_price_at_approval column');
      } else {
        console.log('ℹ️  selling_price_at_approval column already exists');
      }
      
      if (!existingColumns.includes('purchase_price_at_approval')) {
        await queryRunner.query(`
          ALTER TABLE feed_requests 
          ADD COLUMN purchase_price_at_approval DECIMAL(10,2) NULL
        `);
        console.log('✅ Added purchase_price_at_approval column');
      } else {
        console.log('ℹ️  purchase_price_at_approval column already exists');
      }
      
      if (!existingColumns.includes('total_profit_at_approval')) {
        await queryRunner.query(`
          ALTER TABLE feed_requests 
          ADD COLUMN total_profit_at_approval DECIMAL(10,2) NULL
        `);
        console.log('✅ Added total_profit_at_approval column');
      } else {
        console.log('ℹ️  total_profit_at_approval column already exists');
      }
      
      console.log('🎉 Database migration completed successfully!');
      console.log('📊 Historical price columns added to feed_requests table');
      
    } finally {
      await queryRunner.release();
    }
    
  } catch (error) {
    console.error('❌ Database migration failed:', error);
  } finally {
    await AppDataSource.destroy();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
}

// Run the migration
addHistoricalPriceColumns();
