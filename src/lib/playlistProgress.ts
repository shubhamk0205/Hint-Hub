import { supabase, PlaylistProgress, PlaylistProgressSummary } from './supabase'
import { auth } from './firebase'

// Save question completion status to Supabase
export const saveQuestionProgress = async (
  playlistId: string,
  questionId: string,
  completed: boolean
): Promise<boolean> => {
  try {
    const user = auth.currentUser
    if (!user) {
      console.error('No authenticated user found')
      return false
    }

    const { error } = await supabase
      .from('playlist_progress')
      .upsert({
        user_id: user.uid,
        playlist_id: playlistId,
        question_id: questionId,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,playlist_id,question_id'
      })

    if (error) {
      console.error('Error saving progress:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error saving progress:', error)
    return false
  }
}

// Save study plan question completion status to Supabase
export const saveStudyPlanProgress = async (
  planId: string,
  questionId: string,
  completed: boolean
): Promise<boolean> => {
  try {
    const user = auth.currentUser
    if (!user) {
      console.error('No authenticated user found')
      return false
    }

    const { error } = await supabase
      .from('playlist_progress')
      .upsert({
        user_id: user.uid,
        playlist_id: `study-plan-${planId}`, // Use a prefix to distinguish from playlists
        question_id: questionId,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,playlist_id,question_id'
      })

    if (error) {
      console.error('Error saving study plan progress:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error saving study plan progress:', error)
    return false
  }
}

// Load all progress for a specific playlist
export const loadPlaylistProgress = async (playlistId: string): Promise<Record<string, boolean>> => {
  try {
    const user = auth.currentUser
    if (!user) {
      console.error('No authenticated user found')
      return {}
    }

    const { data, error } = await supabase
      .from('playlist_progress')
      .select('question_id, completed')
      .eq('user_id', user.uid)
      .eq('playlist_id', playlistId)

    if (error) {
      console.error('Error loading progress:', error)
      return {}
    }

    const progress: Record<string, boolean> = {}
    data?.forEach(item => {
      progress[item.question_id] = item.completed
    })

    return progress
  } catch (error) {
    console.error('Error loading progress:', error)
    return {}
  }
}

// Load all progress for a specific study plan
export const loadStudyPlanProgress = async (planId: string): Promise<Record<string, boolean>> => {
  try {
    const user = auth.currentUser
    if (!user) {
      console.error('No authenticated user found')
      return {}
    }

    const { data, error } = await supabase
      .from('playlist_progress')
      .select('question_id, completed')
      .eq('user_id', user.uid)
      .eq('playlist_id', `study-plan-${planId}`)

    if (error) {
      console.error('Error loading study plan progress:', error)
      return {}
    }

    const progress: Record<string, boolean> = {}
    data?.forEach(item => {
      progress[item.question_id] = item.completed
    })

    return progress
  } catch (error) {
    console.error('Error loading study plan progress:', error)
    return {}
  }
}

// Get progress summary for a playlist
export const getPlaylistProgressSummary = async (playlistId: string): Promise<PlaylistProgressSummary | null> => {
  try {
    const user = auth.currentUser
    if (!user) {
      console.error('No authenticated user found')
      return null
    }

    const { data, error } = await supabase
      .from('playlist_progress')
      .select('completed')
      .eq('user_id', user.uid)
      .eq('playlist_id', playlistId)

    if (error) {
      console.error('Error loading progress summary:', error)
      return null
    }

    const completedQuestions = data?.filter(item => item.completed).length || 0
    const totalQuestions = data?.length || 0

    return {
      playlist_id: playlistId,
      total_questions: totalQuestions,
      completed_questions: completedQuestions,
      progress_percentage: totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0
    }
  } catch (error) {
    console.error('Error loading progress summary:', error)
    return null
  }
}

// Get progress summary for a study plan
export const getStudyPlanProgressSummary = async (planId: string): Promise<PlaylistProgressSummary | null> => {
  try {
    const user = auth.currentUser
    if (!user) {
      console.error('No authenticated user found')
      return null
    }

    const { data, error } = await supabase
      .from('playlist_progress')
      .select('completed')
      .eq('user_id', user.uid)
      .eq('playlist_id', `study-plan-${planId}`)

    if (error) {
      console.error('Error loading study plan progress summary:', error)
      return null
    }

    const completedQuestions = data?.filter(item => item.completed).length || 0
    const totalQuestions = data?.length || 0

    return {
      playlist_id: `study-plan-${planId}`,
      total_questions: totalQuestions,
      completed_questions: completedQuestions,
      progress_percentage: totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0
    }
  } catch (error) {
    console.error('Error loading study plan progress summary:', error)
    return null
  }
}

// Migrate data from localStorage to Supabase
export const migrateLocalStorageToSupabase = async (): Promise<boolean> => {
  try {
    const user = auth.currentUser
    if (!user) {
      console.error('No authenticated user found')
      return false
    }

    console.log('Starting migration for user:', user.uid)

    // Get all localStorage keys that start with 'playlist-' or 'study-plan-'
    const playlistKeys = Object.keys(localStorage).filter(key => key.startsWith('playlist-'))
    const studyPlanKeys = Object.keys(localStorage).filter(key => key.startsWith('study-plan-'))
    const allKeys = [...playlistKeys, ...studyPlanKeys]
    
    console.log('Found keys to migrate:', allKeys)
    
    if (allKeys.length === 0) {
      console.log('No data found in localStorage')
      return true
    }

    const migrationPromises = allKeys.map(async (key) => {
      try {
        const progressData = localStorage.getItem(key)
        
        console.log(`Processing ${key}:`, progressData)
        
        if (!progressData) return

        const progress = JSON.parse(progressData)
        const questionIds = Object.keys(progress)

        console.log(`${key} has ${questionIds.length} questions`)

        // Insert all progress data
        const progressRecords = questionIds.map(questionId => ({
          user_id: user.uid,
          playlist_id: key, // Keep the original key (playlist-xxx or study-plan-xxx)
          question_id: questionId,
          completed: progress[questionId],
          completed_at: progress[questionId] ? new Date().toISOString() : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))

        console.log(`Inserting ${progressRecords.length} records for ${key}`)

        const { error } = await supabase
          .from('playlist_progress')
          .upsert(progressRecords, {
            onConflict: 'user_id,playlist_id,question_id'
          })

        if (error) {
          console.error(`Error migrating ${key}:`, error)
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          return false
        }

        console.log(`Successfully migrated ${key}`)
        return true
      } catch (error) {
        console.error(`Error migrating data for ${key}:`, error)
        return false
      }
    })

    const results = await Promise.all(migrationPromises)
    const successCount = results.filter(Boolean).length
    
    console.log(`Migration completed: ${successCount}/${allKeys.length} items migrated successfully`)
    
    // Optionally, you can remove the localStorage data after successful migration
    // allKeys.forEach(key => localStorage.removeItem(key))
    
    return successCount === allKeys.length
  } catch (error) {
    console.error('Error during migration:', error)
    return false
  }
}

// Check if user has any progress data in Supabase
export const hasSupabaseProgress = async (): Promise<boolean> => {
  try {
    const user = auth.currentUser
    if (!user) return false

    const { data, error } = await supabase
      .from('playlist_progress')
      .select('id')
      .eq('user_id', user.uid)
      .limit(1)

    if (error) {
      console.error('Error checking Supabase progress:', error)
      return false
    }

    return (data?.length || 0) > 0
  } catch (error) {
    console.error('Error checking Supabase progress:', error)
    return false
  }
}

// Check if user has any progress data in localStorage
export const hasLocalStorageProgress = (): boolean => {
  const playlistKeys = Object.keys(localStorage).filter(key => key.startsWith('playlist-'))
  const studyPlanKeys = Object.keys(localStorage).filter(key => key.startsWith('study-plan-'))
  return playlistKeys.length > 0 || studyPlanKeys.length > 0
}
