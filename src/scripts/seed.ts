import dotenv from 'dotenv';
dotenv.config();

import 'reflect-metadata';
import { AppDataSource } from '../config/database.js';
import { SuperAdmin } from '../models/SuperAdmin.js';
import { Admin } from '../models/Admin.js';
import { Farmer } from '../models/Farmer.js';
import { Stock } from '../models/Stock.js';

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to PostgreSQL');

    const superAdminRepo = AppDataSource.getRepository(SuperAdmin);
    const adminRepo = AppDataSource.getRepository(Admin);
    const farmerRepo = AppDataSource.getRepository(Farmer);
    const stockRepo = AppDataSource.getRepository(Stock);

    // Create SuperAdmin
    const superadminExists = await superAdminRepo.findOne({ 
      where: { mobile: process.env.SUPERADMIN_MOBILE || '9322148474' }
    });

    if (!superadminExists) {
      const superadmin = superAdminRepo.create({
        name: process.env.SUPERADMIN_NAME || 'Aditya Waman',
        mobile: process.env.SUPERADMIN_MOBILE || '9322148474',
        password: process.env.SUPERADMIN_PASSWORD || 'AdiTya@@9322',
        role: 'superadmin',
      });
      await superAdminRepo.save(superadmin);
      console.log('✅ SuperAdmin created:', superadmin.name);
    } else {
      console.log('ℹ️  SuperAdmin already exists');
    }

    // Create default Admin
    const adminExists = await adminRepo.findOne({ 
      where: { mobile: process.env.DEFAULT_ADMIN_MOBILE || '9999999999' }
    });

    if (!adminExists) {
      const admin = adminRepo.create({
        name: process.env.DEFAULT_ADMIN_NAME || 'Sanchit',
        mobile: process.env.DEFAULT_ADMIN_MOBILE || '9999999999',
        password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
        role: 'admin',
        createdBy: 'System',
      });
      await adminRepo.save(admin);
      console.log('✅ Admin created:', admin.name);
    } else {
      console.log('ℹ️  Default Admin already exists');
    }

    // Create sample farmers
    const farmerCount = await farmerRepo.count();
    if (farmerCount === 0) {
      const farmers = [
        farmerRepo.create({
          fullName: 'Ravi Kumar',
          mobile: '9876543210',
          code: 'DK-1023',
          email: 'ravi@example.com',
          status: 'Active',
          createdBy: 'System',
        }),
        farmerRepo.create({
          fullName: 'Suman Patel',
          mobile: '9876542210',
          code: 'DK-1088',
          email: '',
          status: 'Inactive',
          createdBy: 'System',
        }),
      ];
      await farmerRepo.save(farmers);
      console.log(`✅ Created ${farmers.length} sample farmers`);
    } else {
      console.log(`ℹ️  ${farmerCount} farmers already exist`);
    }

    // Create sample stock items
    const stockCount = await stockRepo.count();
    if (stockCount === 0) {
      const stock = [
        stockRepo.create({
          name: 'Maize',
          type: 'Grain',
          quantityBags: 45,
          bagWeight: 50,
          purchasePrice: 120,
          sellingPrice: 150,
          updatedBy: 'System',
        }),
        stockRepo.create({
          name: 'Cottonseed',
          type: 'Oilcake',
          quantityBags: 12,
          bagWeight: 50,
          purchasePrice: 200,
          sellingPrice: 240,
          updatedBy: 'System',
        }),
        stockRepo.create({
          name: 'Soybean',
          type: 'Oilcake',
          quantityBags: 28,
          bagWeight: 50,
          purchasePrice: 220,
          sellingPrice: 260,
          updatedBy: 'System',
        }),
      ];
      await stockRepo.save(stock);
      console.log(`✅ Created ${stock.length} sample stock items`);
    } else {
      console.log(`ℹ️  ${stockCount} stock items already exist`);
    }

    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('📝 Default Credentials:');
    console.log('   SuperAdmin:');
    console.log(`   - Mobile: ${process.env.SUPERADMIN_MOBILE || '9322148474'}`);
    console.log(`   - Password: ${process.env.SUPERADMIN_PASSWORD || 'AdiTya@@9322'}`);
    console.log('   Admin:');
    console.log(`   - Mobile: ${process.env.DEFAULT_ADMIN_MOBILE || '9999999999'}`);
    console.log(`   - Password: ${process.env.DEFAULT_ADMIN_PASSWORD || 'admin123'}\n`);

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();

