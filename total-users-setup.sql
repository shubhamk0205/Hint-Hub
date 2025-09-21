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

-- Create a trigger to automatically update the updated_at column
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
