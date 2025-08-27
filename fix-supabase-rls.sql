-- Fix RLS policies for Firebase auth
-- Disable RLS since we're using Firebase auth instead of Supabase auth
ALTER TABLE playlist_progress DISABLE ROW LEVEL SECURITY;

-- Grant permissions on the table for anonymous users (since we're using Firebase auth)
GRANT SELECT, INSERT, UPDATE, DELETE ON playlist_progress TO anon;
GRANT USAGE, SELECT ON SEQUENCE playlist_progress_id_seq TO anon;

-- Grant permissions on the view
GRANT SELECT ON playlist_progress_summary TO anon;
