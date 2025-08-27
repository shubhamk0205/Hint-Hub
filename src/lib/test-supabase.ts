import { supabase } from './supabase'

// Simple test function to verify Supabase connection
export const testSupabaseConnection = async () => {
  try {
    // Test the connection by making a simple query
    const { data, error } = await supabase
      .from('playlist_progress')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection test failed:', error)
      return false
    }
    
    console.log('Supabase connection test successful')
    return true
  } catch (error) {
    console.error('Supabase connection test error:', error)
    return false
  }
}

// Test function to check if the table exists
export const testTableExists = async () => {
  try {
    const { data, error } = await supabase
      .from('playlist_progress')
      .select('*')
      .limit(0)
    
    if (error) {
      console.error('Table test failed:', error)
      return false
    }
    
    console.log('Table exists and is accessible')
    return true
  } catch (error) {
    console.error('Table test error:', error)
    return false
  }
}
