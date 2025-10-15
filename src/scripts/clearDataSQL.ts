import { Client } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function clearDatabaseData() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'aditya',
    database: process.env.DB_NAME || 'dairyflow',
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    
    console.log('🗑️  Starting database cleanup...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Delete data from tables (in correct order due to foreign key constraints)
    console.log('📝 Deleting feed history...');
    await client.query('DELETE FROM feed_history');
    
    console.log('📝 Deleting feed requests...');
    await client.query('DELETE FROM feed_requests');
    
    console.log('📝 Deleting farmers...');
    await client.query('DELETE FROM farmers');
    
    console.log('📝 Deleting stock...');
    await client.query('DELETE FROM stock');
    
    console.log('📝 Deleting admins...');
    await client.query('DELETE FROM admins');
    
    // Reset serial sequences to start from 1
    console.log('🔄 Resetting serial sequences...');
    await client.query('ALTER SEQUENCE admins_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE farmers_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE stock_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE feed_requests_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE feed_history_id_seq RESTART WITH 1');
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('✅ Database cleanup completed successfully!');
    console.log('📊 Summary:');
    console.log('   - All data deleted except SuperAdmin');
    console.log('   - Serial sequences reset to start from 1');
    console.log('   - SuperAdmin data preserved');
    
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('❌ Database cleanup failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('👋 Database connection closed');
  }
}

// Run the cleanup
clearDatabaseData();
