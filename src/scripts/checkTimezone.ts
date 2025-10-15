import { Client } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkTimezone() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'aditya',
    database: process.env.DB_NAME || 'neondb',
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    
    console.log('🕐 Checking current timezone settings...');
    
    // Set timezone for this session
    await client.query("SET timezone = 'Asia/Kolkata'");
    
    // Check current timezone
    const timezoneResult = await client.query("SELECT current_setting('timezone') as timezone");
    console.log('📍 Current database timezone:', timezoneResult.rows[0].timezone);
    
    // Check current time
    const timeResult = await client.query(`
      SELECT 
        now() as current_time,
        now() AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata' as ist_time,
        extract(timezone from now()) as timezone_offset_seconds
    `);
    console.log('🕐 Current database time (IST):', timeResult.rows[0].current_time);
    console.log('🇮🇳 Current IST time (converted):', timeResult.rows[0].ist_time);
    console.log('⏰ Timezone offset (seconds):', timeResult.rows[0].timezone_offset_seconds);
    
    // Check available timezones
    const availableTz = await client.query("SELECT name FROM pg_timezone_names WHERE name LIKE '%Asia%' ORDER BY name");
    console.log('\n🌏 Available Asian timezones:');
    availableTz.rows.forEach(row => {
      if (row.name.includes('Kolkata') || row.name.includes('Calcutta')) {
        console.log(`   ✅ ${row.name} (Indian Standard Time)`);
      } else {
        console.log(`   📍 ${row.name}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking timezone:', error);
  } finally {
    await client.end();
    console.log('👋 Database connection closed');
  }
}

// Run the check
checkTimezone();

