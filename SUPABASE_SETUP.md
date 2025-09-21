# Supabase Integration Setup Guide

This guide will help you set up Supabase to store playlist progress data instead of using localStorage.

## Prerequisites

- A Supabase project (already configured)
- Project URL: `https://urooxqvwvsxxainfmorg.supabase.co`
- API Key (anon): `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyb294cXZ3dnN4eGFpbmZtb3JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MTI3NjksImV4cCI6MjA3Mzk4ODc2OX0.8o_gxdKu3jIeJRXDP7B0Gf1ZlC0qxNlEqdt_Z4-UtJM`

## Step 1: Set Up Database Table

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-setup.sql` into the editor
4. Click "Run" to execute the SQL commands

This will create:
- `playlist_progress` table with proper indexes
- Row Level Security (RLS) policies
- Automatic timestamp updates
- A summary view for progress analytics

## Step 2: Verify Installation

The following files have been added/modified:

### New Files:
- `src/lib/supabase.ts` - Supabase client configuration
- `src/lib/playlistProgress.ts` - Utility functions for managing progress
- `src/components/DataMigration.tsx` - Migration component
- `supabase-setup.sql` - Database setup script

### Modified Files:
- `src/pages/StudyPlans.tsx` - Updated to use Supabase instead of localStorage

## Step 3: Features

### Automatic Data Migration
- The `DataMigration` component will automatically detect if you have localStorage data
- Users can migrate their existing progress to Supabase with one click
- Migration preserves all completion status and timestamps

### Real-time Sync
- Progress is saved to Supabase immediately when users complete questions
- Data syncs across all devices and browsers
- No more lost progress when clearing browser data

### Security
- Row Level Security ensures users can only access their own data
- All database operations are authenticated through Firebase auth
- Data is encrypted at rest in Supabase

## Step 4: Usage

### For Users:
1. Sign in to your account
2. If you have existing localStorage data, the migration component will appear
3. Click "Migrate to Cloud" to transfer your data
4. Your progress will now be saved to the cloud automatically

### For Developers:
The following functions are available in `src/lib/playlistProgress.ts`:

```typescript
// Save question completion status
await saveQuestionProgress(playlistId, questionId, completed)

// Load all progress for a playlist
const progress = await loadPlaylistProgress(playlistId)

// Get progress summary
const summary = await getPlaylistProgressSummary(playlistId)

// Migrate localStorage data
await migrateLocalStorageToSupabase()

// Check if user has data in Supabase
const hasData = await hasSupabaseProgress()

// Check if user has data in localStorage
const hasLocalData = hasLocalStorageProgress()
```

## Step 5: Database Schema

### playlist_progress Table
```sql
- id: BIGSERIAL PRIMARY KEY
- user_id: TEXT NOT NULL (Firebase UID)
- playlist_id: TEXT NOT NULL
- question_id: TEXT NOT NULL
- completed: BOOLEAN NOT NULL DEFAULT FALSE
- completed_at: TIMESTAMP WITH TIME ZONE
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- updated_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

### Constraints
- Unique constraint on (user_id, playlist_id, question_id)
- Indexes for optimal query performance
- RLS policies for security

## Step 6: Troubleshooting

### Common Issues:

1. **"No authenticated user found"**
   - Ensure user is signed in through Firebase
   - Check that Firebase auth is properly configured

2. **"Error saving progress"**
   - Verify Supabase connection
   - Check that the database table exists
   - Ensure RLS policies are properly configured

3. **Migration fails**
   - Check browser console for detailed error messages
   - Verify Supabase credentials are correct
   - Ensure user has proper permissions

### Debug Mode:
Add this to your browser console to see detailed logs:
```javascript
localStorage.setItem('debug', 'true')
```

## Step 7: Performance Considerations

- Progress is saved individually per question for real-time updates
- Batch operations are used during migration
- Indexes are created for optimal query performance
- RLS policies are optimized for user-specific queries

## Step 8: Future Enhancements

Potential improvements:
- Add progress analytics and insights
- Implement offline support with sync
- Add progress sharing between users
- Create progress export/import functionality
- Add progress notifications and achievements

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify your Supabase project settings
3. Ensure all SQL commands were executed successfully
4. Check that Firebase authentication is working properly
