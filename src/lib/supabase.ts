import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tqweelvaaecnvcfqdtok.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxd2VlbHZhYWVjbnZjZnFkdG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMjA4MjksImV4cCI6MjA3MTg5NjgyOX0.BEfzN3WaIfpmIuIPq-DbMWuxC7iW4-VIcMcM9CTPQ-8'

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
