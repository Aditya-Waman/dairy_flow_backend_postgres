-- Clear all data except SuperAdmin and reset serial sequences
-- Run this script in PostgreSQL to clear all data except SuperAdmin

BEGIN;

-- Delete data from tables (in correct order due to foreign key constraints)
DELETE FROM feed_history;
DELETE FROM feed_requests;
DELETE FROM farmers;
DELETE FROM stock;
DELETE FROM admins;

-- Reset serial sequences to start from 1
ALTER SEQUENCE admins_id_seq RESTART WITH 1;
ALTER SEQUENCE farmers_id_seq RESTART WITH 1;
ALTER SEQUENCE stock_id_seq RESTART WITH 1;
ALTER SEQUENCE feed_requests_id_seq RESTART WITH 1;
ALTER SEQUENCE feed_history_id_seq RESTART WITH 1;

COMMIT;

-- Show summary
SELECT 'Database cleanup completed successfully!' as status;
SELECT 'All data deleted except SuperAdmin' as summary;
SELECT 'Serial sequences reset to start from 1' as sequences;
