-- Complete Users Tracking Setup for Hint Hub
-- This file sets up both active users and total users tracking

-- ==============================================
-- ACTIVE USERS TABLE (for real-time active users)
-- ==============================================

-- Create the active_users table for tracking live users
CREATE TABLE IF NOT EXISTS active_users (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    page TEXT DEFAULT '/',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_active_users_last_seen ON active_users(last_seen);
CREATE INDEX IF NOT EXISTS idx_active_users_user_id ON active_users(user_id);

-- Disable RLS since we're using Firebase auth
ALTER TABLE active_users DISABLE ROW LEVEL SECURITY;

-- Grant permissions for anonymous users (since we're using Firebase auth)
GRANT SELECT, INSERT, UPDATE, DELETE ON active_users TO anon;
GRANT USAGE, SELECT ON SEQUENCE active_users_id_seq TO anon;

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_active_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists, then create a new one
DROP TRIGGER IF EXISTS update_active_users_updated_at ON active_users;
CREATE TRIGGER update_active_users_updated_at 
    BEFORE UPDATE ON active_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_active_users_updated_at();

-- Create a function to clean up old inactive users (optional)
CREATE OR REPLACE FUNCTION cleanup_inactive_users()
RETURNS void AS $$
BEGIN
    -- Delete users who haven't been active for more than 10 minutes
    DELETE FROM active_users 
    WHERE last_seen < NOW() - INTERVAL '10 minutes';
END;
$$ language 'plpgsql';

-- ==============================================
-- TOTAL USERS TABLE (for tracking all users ever)
-- ==============================================

-- Create the total_users table for tracking all users who have ever used the website
CREATE TABLE IF NOT EXISTS total_users (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    first_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_visits INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_total_users_user_id ON total_users(user_id);
CREATE INDEX IF NOT EXISTS idx_total_users_first_visit ON total_users(first_visit);
CREATE INDEX IF NOT EXISTS idx_total_users_last_visit ON total_users(last_visit);

-- Disable RLS since we're using Firebase auth
ALTER TABLE total_users DISABLE ROW LEVEL SECURITY;

-- Grant permissions for anonymous users (since we're using Firebase auth)
GRANT SELECT, INSERT, UPDATE, DELETE ON total_users TO anon;
GRANT USAGE, SELECT ON SEQUENCE total_users_id_seq TO anon;

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_total_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists, then create a new one
DROP TRIGGER IF EXISTS update_total_users_updated_at ON total_users;
CREATE TRIGGER update_total_users_updated_at 
    BEFORE UPDATE ON total_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_total_users_updated_at();

-- Create a function to track user visits
CREATE OR REPLACE FUNCTION track_user_visit(user_uid TEXT)
RETURNS void AS $$
BEGIN
    -- Insert or update user visit record
    INSERT INTO total_users (user_id, first_visit, last_visit, total_visits)
    VALUES (user_uid, NOW(), NOW(), 1)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        last_visit = NOW(),
        total_visits = total_users.total_visits + 1,
        updated_at = NOW();
END;
$$ language 'plpgsql';

-- Create a function to get total user count
CREATE OR REPLACE FUNCTION get_total_user_count()
RETURNS INTEGER AS $$
DECLARE
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM total_users;
    RETURN total_count;
END;
$$ language 'plpgsql';

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION track_user_visit(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_total_user_count() TO anon;

-- ==============================================
-- USAGE INSTRUCTIONS
-- ==============================================

/*
SETUP INSTRUCTIONS:

1. Run this SQL file in your Supabase SQL editor
2. The system will automatically track:
   - Active users (users active in last 5 minutes)
   - Total users (all users who have ever visited)

3. The LiveUserCount component will display:
   - Active users with a green pulsing dot
   - Total users with a user check icon

4. Optional: Set up a cron job to clean up inactive users:
   - Go to Supabase Dashboard > Database > Functions
   - Create a new function that calls cleanup_inactive_users()
   - Set it to run every 10 minutes

FEATURES:
- Real-time active user tracking
- Total user count tracking
- Visit counting per user
- Automatic cleanup of inactive users
- Optimized with proper indexes
- Firebase auth compatible
*/
