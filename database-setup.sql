-- PostgreSQL Database Setup for DairyFlow
-- Run this script to create the database and user

-- Create database
CREATE DATABASE dairyflow;

-- Create user (optional - you can use existing postgres user)
-- CREATE USER dairyflow_user WITH PASSWORD 'your_password_here';
-- GRANT ALL PRIVILEGES ON DATABASE dairyflow TO dairyflow_user;

-- Connect to the dairyflow database
\c dairyflow;

-- Create tables (these will be created automatically by TypeORM synchronize)
-- But here's the schema for reference:

CREATE TABLE IF NOT EXISTS super_admins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(10) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'superadmin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(10) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS farmers (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(10) UNIQUE NOT NULL,
    code VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    status VARCHAR(20) DEFAULT 'Active',
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feed_history (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER REFERENCES farmers(id),
    date TIMESTAMP NOT NULL,
    feed_type VARCHAR(255) NOT NULL,
    bags INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    approved_by VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS stock (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    quantity_bags INTEGER NOT NULL DEFAULT 0,
    bag_weight DECIMAL(5,2) NOT NULL DEFAULT 50.0,
    purchase_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feed_requests (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER REFERENCES farmers(id),
    feed_id INTEGER REFERENCES stock(id),
    qty_bags INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending',
    created_by VARCHAR(255) NOT NULL,
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_farmers_status ON farmers(status);
CREATE INDEX IF NOT EXISTS idx_farmers_code ON farmers(code);
CREATE INDEX IF NOT EXISTS idx_farmers_mobile ON farmers(mobile);

CREATE INDEX IF NOT EXISTS idx_stock_name ON stock(name);
CREATE INDEX IF NOT EXISTS idx_stock_type ON stock(type);

CREATE INDEX IF NOT EXISTS idx_feed_requests_farmer_id ON feed_requests(farmer_id);
CREATE INDEX IF NOT EXISTS idx_feed_requests_feed_id ON feed_requests(feed_id);
CREATE INDEX IF NOT EXISTS idx_feed_requests_status ON feed_requests(status);
CREATE INDEX IF NOT EXISTS idx_feed_requests_created_at ON feed_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_feed_history_farmer_id ON feed_history(farmer_id);

-- Grant permissions (if using separate user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dairyflow_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dairyflow_user;
