import dotenv from 'dotenv';
dotenv.config();

import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { connectDatabase } from './config/database.js';
import { authRoutes } from './routes/authRoutes.js';
import { farmerRoutes } from './routes/farmerRoutes.js';
import { adminRoutes } from './routes/adminRoutes.js';
import { stockRoutes } from './routes/stockRoutes.js';
import { requestRoutes } from './routes/requestRoutes.js';
import { reportRoutes } from './routes/reportRoutes.js';
import { errorHandler, notFoundHandler } from './utils/errorHandler.js';
import { scheduleDataRetention } from './utils/dataRetention.js';

const PORT = parseInt(process.env.PORT || '5000');
const HOST = process.env.HOST || '0.0.0.0';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    } : undefined,
  },
});

// Register CORS
await fastify.register(cors, {
  origin: true, // Allow all origins in development
  credentials: true,
});

// Register JWT
await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key',
});

// Register Swagger
await fastify.register(swagger, {
  openapi: {
    info: {
      title: 'DairyFlow API',
      description: 'Complete API documentation for DairyFlow Farm Management System',
      version: '1.0.0',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Authentication', description: 'Authentication endpoints' },
      { name: 'Farmers', description: 'Farmer management endpoints' },
      { name: 'Admins', description: 'Admin management endpoints (Superadmin only)' },
      { name: 'Stock', description: 'Feed stock management endpoints' },
      { name: 'Feed Requests', description: 'Feed request management endpoints' },
      { name: 'Reports', description: 'Analytics and reporting endpoints' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
});

// Register Swagger UI
await fastify.register(swaggerUI, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
  },
  staticCSP: true,
});

// Health check
fastify.get('/health', async () => {
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };
});

// API Routes
await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(farmerRoutes, { prefix: '/api/farmers' });
await fastify.register(adminRoutes, { prefix: '/api/admins' });
await fastify.register(stockRoutes, { prefix: '/api/stock' });
await fastify.register(requestRoutes, { prefix: '/api/requests' });
await fastify.register(reportRoutes, { prefix: '/api/reports' });

// Error handling
fastify.setErrorHandler(errorHandler);
fastify.setNotFoundHandler(notFoundHandler);

// Start server
async function start() {
  try {
    // Connect to database
    await connectDatabase();

    // Start data retention scheduler
    if (process.env.NODE_ENV === 'production') {
      scheduleDataRetention();
    } else {
      console.log('ℹ️  Data retention scheduler disabled in development mode');
    }

    // Start server
    await fastify.listen({ port: PORT, host: HOST });
    
    console.log('\n🚀 Server is running!');
    console.log(`📍 API Server: http://localhost:${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/docs`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

start();

