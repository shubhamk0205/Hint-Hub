-- Create the playlist_progress table
CREATE TABLE IF NOT EXISTS playlist_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    playlist_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Create a unique constraint to prevent duplicate entries for the same user, playlist, and question
    UNIQUE(user_id, playlist_id, question_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_playlist_progress_user_id ON playlist_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_progress_playlist_id ON playlist_progress(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_progress_user_playlist ON playlist_progress(user_id, playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_progress_completed ON playlist_progress(completed);

-- Since we're using Firebase auth instead of Supabase auth, we'll disable RLS
-- and rely on application-level security (user_id filtering in queries)
ALTER TABLE playlist_progress DISABLE ROW LEVEL SECURITY;

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_playlist_progress_updated_at 
    BEFORE UPDATE ON playlist_progress 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a view for progress summaries
CREATE OR REPLACE VIEW playlist_progress_summary AS
SELECT 
    user_id,
    playlist_id,
    COUNT(*) as total_questions,
    COUNT(*) FILTER (WHERE completed = true) as completed_questions,
    CASE 
        WHEN COUNT(*) > 0 THEN 
            ROUND((COUNT(*) FILTER (WHERE completed = true)::decimal / COUNT(*)::decimal) * 100, 2)
        ELSE 0 
    END as progress_percentage
FROM playlist_progress
GROUP BY user_id, playlist_id;

-- Grant permissions on the view
GRANT SELECT ON playlist_progress_summary TO anon;
GRANT SELECT ON playlist_progress_summary TO authenticated;

-- Grant permissions on the table for anonymous users (since we're using Firebase auth)
GRANT SELECT, INSERT, UPDATE, DELETE ON playlist_progress TO anon;
GRANT USAGE, SELECT ON SEQUENCE playlist_progress_id_seq TO anon;
