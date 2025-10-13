-- PostgreSQL Database Setup Script
-- Run this script as a PostgreSQL superuser (usually 'postgres')

-- Create the database
CREATE DATABASE dairyflow;

-- Create a user for the application (optional)
CREATE USER dairyflow_user WITH PASSWORD 'aditya';

-- Grant privileges to the user on the database
GRANT ALL PRIVILEGES ON DATABASE dairyflow TO dairyflow_user;

-- Connect to the new database and grant privileges on future tables
\c dairyflow;

-- Grant privileges on the public schema
GRANT ALL PRIVILEGES ON SCHEMA public TO dairyflow_user;

-- Grant privileges on all existing tables (if any)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dairyflow_user;

-- Grant privileges on all existing sequences (if any)
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dairyflow_user;

-- Grant privileges on all existing functions (if any)
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO dairyflow_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO dairyflow_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO dairyflow_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON FUNCTIONS TO dairyflow_user;

-- Verify the setup
\dt
\du
