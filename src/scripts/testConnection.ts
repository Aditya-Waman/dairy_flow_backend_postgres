import 'reflect-metadata';
import dotenv from 'dotenv';
import { Client } from 'pg';

// Load environment variables
dotenv.config();

async function testConnection() {
  console.log('🔍 Testing PostgreSQL connection...');
  console.log('📋 Connection details:');
  console.log(`   Host: ${process.env.DB_HOST}`);
  console.log(`   Port: ${process.env.DB_PORT}`);
  console.log(`   Database: ${process.env.DB_NAME}`);
  console.log(`   Username: ${process.env.DB_USERNAME}`);
  console.log(`   SSL: ${process.env.DB_SSL}`);
  console.log('');

  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: false
    } : false,
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('🔄 Attempting to connect...');
    await client.connect();
    console.log('✅ Connection successful!');
    
    // Test a simple query
    const result = await client.query('SELECT version()');
    console.log('📊 Database version:', result.rows[0].version);
    
    // Test table existence
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('📋 Available tables:', tablesResult.rows.map(row => row.table_name));
    
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    console.error('🔍 Error code:', error.code);
    console.error('🔍 Error details:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Solution: Database server is not running or not accessible');
    } else if (error.code === 'ENOTFOUND') {
      console.log('💡 Solution: Hostname not found - check DB_HOST in .env');
    } else if (error.code === 'ECONNRESET') {
      console.log('💡 Solution: Connection reset - try different SSL settings or check network');
    } else if (error.code === '28P01') {
      console.log('💡 Solution: Authentication failed - check username/password');
    } else if (error.code === '3D000') {
      console.log('💡 Solution: Database does not exist - check DB_NAME');
    }
  } finally {
    await client.end();
    console.log('👋 Connection closed');
  }
}

testConnection();
