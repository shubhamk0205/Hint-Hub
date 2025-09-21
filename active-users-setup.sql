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

-- Create a trigger to automatically update the updated_at column
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

-- Optional: Create a scheduled job to clean up inactive users
-- This would need to be set up in your Supabase dashboard under Database > Functions
-- You can call this function periodically or set up a cron job
