import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://urooxqvwvsxxainfmorg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyb294cXZ3dnN4eGFpbmZtb3JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MTI3NjksImV4cCI6MjA3Mzk4ODc2OX0.8o_gxdKu3jIeJRXDP7B0Gf1ZlC0qxNlEqdt_Z4-UtJM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for playlist progress
export interface PlaylistProgress {
  id?: number
  user_id: string
  playlist_id: string
  question_id: string
  completed: boolean
  completed_at?: string
  created_at?: string
  updated_at?: string
}

export interface PlaylistProgressSummary {
  playlist_id: string
  total_questions: number
  completed_questions: number
  progress_percentage: number
}
