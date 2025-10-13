import { z } from 'zod';

// Auth validators
export const loginSchema = z.object({
  mobile: z.string().length(10, 'Mobile number must be 10 digits').regex(/^[0-9]+$/, 'Mobile number must contain only digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Farmer validators
export const createFarmerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').trim(),
  mobile: z.string().length(10, 'Mobile number must be 10 digits').regex(/^[0-9]+$/, 'Mobile number must contain only digits'),
  code: z.string().min(1, 'Dairy code is required').trim(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  status: z.enum(['Active', 'Inactive']).optional().default('Active'),
});

export const updateFarmerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').trim().optional(),
  mobile: z.string().length(10, 'Mobile number must be 10 digits').regex(/^[0-9]+$/, 'Mobile number must contain only digits').optional(),
  code: z.string().min(1, 'Dairy code is required').trim().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  status: z.enum(['Active', 'Inactive']).optional(),
});

// Admin validators
export const createAdminSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  mobile: z.string().length(10, 'Mobile number must be 10 digits').regex(/^[0-9]+$/, 'Mobile number must contain only digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const updateAdminSchema = z.object({
  name: z.string().min(1, 'Name is required').trim().optional(),
  mobile: z.string().length(10, 'Mobile number must be 10 digits').regex(/^[0-9]+$/, 'Mobile number must contain only digits').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

// Stock validators
export const createStockSchema = z.object({
  name: z.string().min(1, 'Feed name is required').trim(),
  type: z.string().min(1, 'Feed type is required').trim(),
  quantityBags: z.number().min(0, 'Quantity must be non-negative'),
  bagWeight: z.number().min(0.1, 'Bag weight must be at least 0.1 kg'),
  purchasePrice: z.number().min(0, 'Purchase price must be non-negative'),
  sellingPrice: z.number().min(0, 'Selling price must be non-negative'),
});

export const updateStockSchema = z.object({
  name: z.string().min(1, 'Feed name is required').trim().optional(),
  type: z.string().min(1, 'Feed type is required').trim().optional(),
  quantityBags: z.number().min(0, 'Quantity must be non-negative').optional(),
  bagWeight: z.number().min(0.1, 'Bag weight must be at least 0.1 kg').optional(),
  purchasePrice: z.number().min(0, 'Purchase price must be non-negative').optional(),
  sellingPrice: z.number().min(0, 'Selling price must be non-negative').optional(),
});

// Feed Request validators
export const createRequestSchema = z.object({
  farmerId: z.string().min(1, 'Farmer ID is required'),
  feedId: z.string().min(1, 'Feed ID is required'),
  qtyBags: z.number().min(1, 'Quantity must be at least 1 bag'),
});

export const approveRequestSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
});

