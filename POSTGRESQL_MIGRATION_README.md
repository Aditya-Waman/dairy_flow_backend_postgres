# PostgreSQL Migration Guide

This guide will help you migrate your DairyFlow application from MongoDB to PostgreSQL while maintaining the exact same API responses and business logic.

## Prerequisites

1. **PostgreSQL Installation**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib

   # macOS
   brew install postgresql
   brew services start postgresql

   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

2. **Node.js Dependencies**
   ```bash
   npm install
   ```

## Database Setup

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE dairyflow;

# Create user (optional)
CREATE USER dairyflow_user WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE dairyflow TO dairyflow_user;

# Exit PostgreSQL
\q
```

### 2. Environment Configuration

Create a `.env` file in your project root:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password_here
DB_NAME=dairyflow

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
HOST=0.0.0.0
NODE_ENV=development
LOG_LEVEL=info

# Data Retention
DATA_RETENTION_MONTHS=12

# Default Admin Credentials
SUPERADMIN_NAME=Aditya Waman
SUPERADMIN_MOBILE=9322148474
SUPERADMIN_PASSWORD=AdiTya@@9322

DEFAULT_ADMIN_NAME=Sanchit
DEFAULT_ADMIN_MOBILE=9999999999
DEFAULT_ADMIN_PASSWORD=admin123
```

## Migration Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Schema Creation

The database schema will be created automatically when you start the application (TypeORM synchronize is enabled in development mode).

### 3. Seed Initial Data

```bash
npm run seed
```

This will create:
- Default SuperAdmin user
- Default Admin user
- Sample farmers
- Sample stock items

### 4. Start the Application

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## Key Changes Made

### 1. Database Layer
- **MongoDB → PostgreSQL**: Complete migration from Mongoose to TypeORM
- **ObjectId → Integer IDs**: All MongoDB ObjectIds converted to PostgreSQL auto-incrementing integers
- **Embedded Documents → Separate Tables**: Farmer's feed history moved to separate `feed_history` table

### 2. Models (Entities)
- `SuperAdmin`: PostgreSQL entity with bcrypt password hashing
- `Admin`: PostgreSQL entity with bcrypt password hashing
- `Farmer`: PostgreSQL entity with separate feed history relationship
- `Stock`: PostgreSQL entity with decimal precision for prices
- `FeedRequest`: PostgreSQL entity with foreign key relationships
- `FeedHistory`: New separate entity for farmer feed history

### 3. Controllers
- All CRUD operations updated to use TypeORM repositories
- Search queries converted from MongoDB regex to PostgreSQL LIKE
- Aggregation pipelines converted to SQL queries
- Error handling updated for PostgreSQL error codes

### 4. Database Configuration
- TypeORM DataSource configuration
- Connection pooling and SSL support
- Automatic schema synchronization in development

## API Compatibility

✅ **100% API Compatible** - All endpoints maintain the same:
- Request/response structure
- HTTP status codes
- Error messages
- Business logic
- Authentication flow

## Database Schema

### Tables Created

1. **super_admins** - SuperAdmin user accounts
2. **admins** - Admin user accounts  
3. **farmers** - Farmer customer records
4. **feed_history** - Farmer feed transaction history
5. **stock** - Inventory stock items
6. **feed_requests** - Feed request transactions

### Relationships

- `feed_requests.farmer_id` → `farmers.id`
- `feed_requests.feed_id` → `stock.id`
- `feed_history.farmer_id` → `farmers.id`

## Performance Optimizations

### Indexes Created
- `farmers`: status, code, mobile
- `stock`: name, type
- `feed_requests`: farmer_id, feed_id, status, created_at
- `feed_history`: farmer_id

### Query Optimizations
- Efficient JOIN operations for related data
- Proper indexing for search operations
- Connection pooling for better performance

## Data Migration (If Needed)

If you have existing MongoDB data, you'll need to create a migration script:

```typescript
// Example migration script structure
import { MongoClient } from 'mongodb';
import { AppDataSource } from './src/config/database.js';

async function migrateData() {
  // Connect to MongoDB
  const mongoClient = new MongoClient('mongodb://localhost:27017/dairyflow');
  await mongoClient.connect();
  
  // Connect to PostgreSQL
  await AppDataSource.initialize();
  
  // Migrate each collection
  // ... migration logic
  
  await mongoClient.close();
  await AppDataSource.destroy();
}
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   ```bash
   # Check PostgreSQL is running
   sudo systemctl status postgresql
   
   # Start PostgreSQL
   sudo systemctl start postgresql
   ```

2. **Authentication Failed**
   - Verify database credentials in `.env`
   - Check PostgreSQL user permissions

3. **Schema Sync Issues**
   - Ensure `NODE_ENV=development` for automatic schema sync
   - Check TypeORM entity imports in `database.ts`

4. **Port Already in Use**
   ```bash
   # Kill process on port 5000
   lsof -ti:5000 | xargs kill -9
   ```

### Logs and Debugging

- Application logs: Check console output
- Database logs: Check PostgreSQL logs
- TypeORM logs: Enabled in development mode

## Production Deployment

### Environment Variables
```env
NODE_ENV=production
DB_HOST=your-production-db-host
DB_PASSWORD=your-secure-password
JWT_SECRET=your-production-jwt-secret
```

### Database Security
- Use strong passwords
- Enable SSL connections
- Restrict database access
- Regular backups

### Performance
- Disable TypeORM synchronize in production
- Use connection pooling
- Monitor query performance
- Set up proper indexes

## Benefits of Migration

1. **ACID Compliance**: Better data consistency for financial transactions
2. **Performance**: Optimized queries and better indexing
3. **Data Integrity**: Foreign key constraints and data validation
4. **Ecosystem**: Rich tooling and monitoring options
5. **Scalability**: Better horizontal scaling options

## Support

If you encounter any issues during migration:

1. Check the logs for specific error messages
2. Verify database connectivity
3. Ensure all environment variables are set correctly
4. Check PostgreSQL permissions and user access

The migration maintains 100% API compatibility, so your frontend applications will continue to work without any changes.
