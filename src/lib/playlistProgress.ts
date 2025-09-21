import { supabase, PlaylistProgress, PlaylistProgressSummary } from './supabase'
import { auth } from './firebase'

// Deduplicate noisy console errors to avoid flooding the console on network failures
const loggedErrorKeys = new Set<string>()
const logErrorOnce = (key: string, ...args: unknown[]) => {
  if (loggedErrorKeys.has(key)) return
  loggedErrorKeys.add(key)
  // eslint-disable-next-line no-console
  console.error(...args)
}

const isNetworkFetchError = (error: unknown): boolean => {
  if (!error) return false
  const message = String((error as any)?.message || error)
  return message.includes('Failed to fetch') || message.includes('ERR_NAME_NOT_RESOLVED')
}

// Simple circuit breaker to avoid repeated failing requests when Supabase is unreachable
let supabaseUnavailable = false
const markSupabaseUnavailableIfNetworkError = (error: unknown, key: string) => {
  if (isNetworkFetchError(error)) {
    supabaseUnavailable = true
    logErrorOnce(key, 'Supabase appears unreachable. Disabling remote progress for this session.')
  }
}

// Save question completion status to Supabase
export const saveQuestionProgress = async (
  playlistId: string,
  questionId: string,
  completed: boolean
): Promise<boolean> => {
  if (supabaseUnavailable || !navigator.onLine) {
    return false
  }
  try {
    const user = auth.currentUser
    if (!user) {
      logErrorOnce('auth-missing', 'No authenticated user found')
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
      const key = isNetworkFetchError(error) ? 'network-saveQuestionProgress' : 'saveQuestionProgress'
      logErrorOnce(key, 'Error saving progress:', error)
      markSupabaseUnavailableIfNetworkError(error, 'cb-saveQuestionProgress')
      return false
    }

    return true
  } catch (error) {
    const key = isNetworkFetchError(error) ? 'network-saveQuestionProgress-catch' : 'saveQuestionProgress-catch'
    logErrorOnce(key, 'Error saving progress:', error)
    markSupabaseUnavailableIfNetworkError(error, 'cb-saveQuestionProgress-catch')
    return false
  }
}

// Save study plan question completion status to Supabase
export const saveStudyPlanProgress = async (
  planId: string,
  questionId: string,
  completed: boolean
): Promise<boolean> => {
  if (supabaseUnavailable || !navigator.onLine) {
    return false
  }
  try {
    const user = auth.currentUser
    if (!user) {
      logErrorOnce('auth-missing', 'No authenticated user found')
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
      const key = isNetworkFetchError(error) ? 'network-saveStudyPlanProgress' : 'saveStudyPlanProgress'
      logErrorOnce(key, 'Error saving study plan progress:', error)
      markSupabaseUnavailableIfNetworkError(error, 'cb-saveStudyPlanProgress')
      return false
    }

    return true
  } catch (error) {
    const key = isNetworkFetchError(error) ? 'network-saveStudyPlanProgress-catch' : 'saveStudyPlanProgress-catch'
    logErrorOnce(key, 'Error saving study plan progress:', error)
    markSupabaseUnavailableIfNetworkError(error, 'cb-saveStudyPlanProgress-catch')
    return false
  }
}

// Load all progress for a specific playlist
export const loadPlaylistProgress = async (playlistId: string): Promise<Record<string, boolean>> => {
  if (supabaseUnavailable || !navigator.onLine) {
    return {}
  }
  try {
    const user = auth.currentUser
    if (!user) {
      logErrorOnce('auth-missing', 'No authenticated user found')
      return {}
    }

    const { data, error } = await supabase
      .from('playlist_progress')
      .select('question_id, completed')
      .eq('user_id', user.uid)
      .eq('playlist_id', playlistId)

    if (error) {
      const key = isNetworkFetchError(error) ? 'network-loadPlaylistProgress' : 'loadPlaylistProgress'
      logErrorOnce(key, 'Error loading progress:', error)
      markSupabaseUnavailableIfNetworkError(error, 'cb-loadPlaylistProgress')
      return {}
    }

    const progress: Record<string, boolean> = {}
    data?.forEach(item => {
      progress[item.question_id] = item.completed
    })

    return progress
  } catch (error) {
    const key = isNetworkFetchError(error) ? 'network-loadPlaylistProgress-catch' : 'loadPlaylistProgress-catch'
    logErrorOnce(key, 'Error loading progress:', error)
    markSupabaseUnavailableIfNetworkError(error, 'cb-loadPlaylistProgress-catch')
    return {}
  }
}

// Load all progress for a specific study plan
export const loadStudyPlanProgress = async (planId: string): Promise<Record<string, boolean>> => {
  if (supabaseUnavailable || !navigator.onLine) {
    return {}
  }
  try {
    const user = auth.currentUser
    if (!user) {
      logErrorOnce('auth-missing', 'No authenticated user found')
      return {}
    }

    const { data, error } = await supabase
      .from('playlist_progress')
      .select('question_id, completed')
      .eq('user_id', user.uid)
      .eq('playlist_id', `study-plan-${planId}`)

    if (error) {
      const key = isNetworkFetchError(error) ? 'network-loadStudyPlanProgress' : 'loadStudyPlanProgress'
      logErrorOnce(key, 'Error loading study plan progress:', error)
      markSupabaseUnavailableIfNetworkError(error, 'cb-loadStudyPlanProgress')
      return {}
    }

    const progress: Record<string, boolean> = {}
    data?.forEach(item => {
      progress[item.question_id] = item.completed
    })

    return progress
  } catch (error) {
    const key = isNetworkFetchError(error) ? 'network-loadStudyPlanProgress-catch' : 'loadStudyPlanProgress-catch'
    logErrorOnce(key, 'Error loading study plan progress:', error)
    markSupabaseUnavailableIfNetworkError(error, 'cb-loadStudyPlanProgress-catch')
    return {}
  }
}

// Get progress summary for a playlist
export const getPlaylistProgressSummary = async (playlistId: string): Promise<PlaylistProgressSummary | null> => {
  if (supabaseUnavailable || !navigator.onLine) {
    return null
  }
  try {
    const user = auth.currentUser
    if (!user) {
      logErrorOnce('auth-missing', 'No authenticated user found')
      return null
    }

    const { data, error } = await supabase
      .from('playlist_progress')
      .select('completed')
      .eq('user_id', user.uid)
      .eq('playlist_id', playlistId)

    if (error) {
      const key = isNetworkFetchError(error) ? 'network-getPlaylistProgressSummary' : 'getPlaylistProgressSummary'
      logErrorOnce(key, 'Error loading progress summary:', error)
      markSupabaseUnavailableIfNetworkError(error, 'cb-getPlaylistProgressSummary')
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
    const key = isNetworkFetchError(error) ? 'network-getPlaylistProgressSummary-catch' : 'getPlaylistProgressSummary-catch'
    logErrorOnce(key, 'Error loading progress summary:', error)
    markSupabaseUnavailableIfNetworkError(error, 'cb-getPlaylistProgressSummary-catch')
    return null
  }
}

// Get progress summary for a study plan
export const getStudyPlanProgressSummary = async (planId: string): Promise<PlaylistProgressSummary | null> => {
  if (supabaseUnavailable || !navigator.onLine) {
    return null
  }
  try {
    const user = auth.currentUser
    if (!user) {
      logErrorOnce('auth-missing', 'No authenticated user found')
      return null
    }

    const { data, error } = await supabase
      .from('playlist_progress')
      .select('completed')
      .eq('user_id', user.uid)
      .eq('playlist_id', `study-plan-${planId}`)

    if (error) {
      const key = isNetworkFetchError(error) ? 'network-getStudyPlanProgressSummary' : 'getStudyPlanProgressSummary'
      logErrorOnce(key, 'Error loading study plan progress summary:', error)
      markSupabaseUnavailableIfNetworkError(error, 'cb-getStudyPlanProgressSummary')
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
    const key = isNetworkFetchError(error) ? 'network-getStudyPlanProgressSummary-catch' : 'getStudyPlanProgressSummary-catch'
    logErrorOnce(key, 'Error loading study plan progress summary:', error)
    markSupabaseUnavailableIfNetworkError(error, 'cb-getStudyPlanProgressSummary-catch')
    return null
  }
}

// Migrate data from localStorage to Supabase
export const migrateLocalStorageToSupabase = async (): Promise<boolean> => {
  try {
    const user = auth.currentUser
    if (!user) {
      logErrorOnce('auth-missing', 'No authenticated user found')
      return false
    }

    // eslint-disable-next-line no-console
    console.log('Starting migration for user:', user.uid)

    // Get all localStorage keys that start with 'playlist-' or 'study-plan-'
    const playlistKeys = Object.keys(localStorage).filter(key => key.startsWith('playlist-'))
    const studyPlanKeys = Object.keys(localStorage).filter(key => key.startsWith('study-plan-'))
    const allKeys = [...playlistKeys, ...studyPlanKeys]
    
    // eslint-disable-next-line no-console
    console.log('Found keys to migrate:', allKeys)
    
    if (allKeys.length === 0) {
      // eslint-disable-next-line no-console
      console.log('No data found in localStorage')
      return true
    }

    const migrationPromises = allKeys.map(async (key) => {
      try {
        const progressData = localStorage.getItem(key)
        
        // eslint-disable-next-line no-console
        console.log(`Processing ${key}:`, progressData)
        
        if (!progressData) return

        const progress = JSON.parse(progressData)
        const questionIds = Object.keys(progress)

        // eslint-disable-next-line no-console
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

        // eslint-disable-next-line no-console
        console.log(`Inserting ${progressRecords.length} records for ${key}`)

        const { error } = await supabase
          .from('playlist_progress')
          .upsert(progressRecords, {
            onConflict: 'user_id,playlist_id,question_id'
          })

        if (error) {
          logErrorOnce(`migrate-${key}`, `Error migrating ${key}:`, error)
          // eslint-disable-next-line no-console
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          return false
        }

        // eslint-disable-next-line no-console
        console.log(`Successfully migrated ${key}`)
        return true
      } catch (error) {
        logErrorOnce(`migrate-catch-${key}`, `Error migrating data for ${key}:`, error)
        return false
      }
    })

    const results = await Promise.all(migrationPromises)
    const successCount = results.filter(Boolean).length
    
    // eslint-disable-next-line no-console
    console.log(`Migration completed: ${successCount}/${allKeys.length} items migrated successfully`)
    
    // Optionally, you can remove the localStorage data after successful migration
    // allKeys.forEach(key => localStorage.removeItem(key))
    
    return successCount === allKeys.length
  } catch (error) {
    logErrorOnce('migration', 'Error during migration:', error)
    return false
  }
}

// Check if user has any progress data in Supabase
export const hasSupabaseProgress = async (): Promise<boolean> => {
  if (supabaseUnavailable || !navigator.onLine) {
    return false
  }
  try {
    const user = auth.currentUser
    if (!user) return false

    const { data, error } = await supabase
      .from('playlist_progress')
      .select('id')
      .eq('user_id', user.uid)
      .limit(1)

    if (error) {
      const key = isNetworkFetchError(error) ? 'network-hasSupabaseProgress' : 'hasSupabaseProgress'
      logErrorOnce(key, 'Error checking Supabase progress:', error)
      markSupabaseUnavailableIfNetworkError(error, 'cb-hasSupabaseProgress')
      return false
    }

    return (data?.length || 0) > 0
  } catch (error) {
    const key = isNetworkFetchError(error) ? 'network-hasSupabaseProgress-catch' : 'hasSupabaseProgress-catch'
    logErrorOnce(key, 'Error checking Supabase progress:', error)
    markSupabaseUnavailableIfNetworkError(error, 'cb-hasSupabaseProgress-catch')
    return false
  }
}

// Check if user has any progress data in localStorage
export const hasLocalStorageProgress = (): boolean => {
  const playlistKeys = Object.keys(localStorage).filter(key => key.startsWith('playlist-'))
  const studyPlanKeys = Object.keys(localStorage).filter(key => key.startsWith('study-plan-'))
  return playlistKeys.length > 0 || studyPlanKeys.length > 0
}
