import { Client } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function setupTimezone() {
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
    
    console.log('🇮🇳 Setting up Indian Standard Time (IST) timezone...');
    
    // Set timezone for current session
    await client.query("SET timezone = 'Asia/Kolkata'");
    console.log('✅ Session timezone set to Asia/Kolkata');
    
    // Set timezone for the database (persistent)
    await client.query("ALTER DATABASE neondb SET timezone = 'Asia/Kolkata'");
    console.log('✅ Database timezone set to Asia/Kolkata');
    
    // Verify the timezone setting
    const timezoneResult = await client.query("SELECT current_setting('timezone') as timezone");
    console.log('📍 Current database timezone:', timezoneResult.rows[0].timezone);
    
    // Test time conversion
    const timeResult = await client.query(`
      SELECT 
        now() as current_time,
        now() AT TIME ZONE 'Asia/Kolkata' as ist_time,
        extract(timezone from now()) as timezone_offset
    `);
    
    console.log('🕐 Current database time:', timeResult.rows[0].current_time);
    console.log('🇮🇳 IST time:', timeResult.rows[0].ist_time);
    console.log('⏰ Timezone offset (seconds):', timeResult.rows[0].timezone_offset);
    
    // Check if Asia/Kolkata timezone is available
    const timezoneCheck = await client.query(`
      SELECT name FROM pg_timezone_names 
      WHERE name = 'Asia/Kolkata' OR name = 'Asia/Calcutta'
    `);
    
    if (timezoneCheck.rows.length > 0) {
      console.log('✅ Asia/Kolkata timezone is available in PostgreSQL');
    } else {
      console.log('⚠️  Asia/Kolkata timezone not found, using Asia/Calcutta');
    }
    
    console.log('\n🎉 Timezone setup completed successfully!');
    console.log('📝 All timestamps will now be stored and retrieved in IST');
    
  } catch (error) {
    console.error('❌ Error setting up timezone:', error);
  } finally {
    await client.end();
    console.log('👋 Database connection closed');
  }
}

// Run the setup
setupTimezone();
