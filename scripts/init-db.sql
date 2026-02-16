-- Initial PostgreSQL database setup script
-- This script runs when the database is first created

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';

-- Optional: Create additional schemas if needed
-- CREATE SCHEMA IF NOT EXISTS stratix;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE stratix_db TO stratix;
