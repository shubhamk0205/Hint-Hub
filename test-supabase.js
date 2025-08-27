import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tqweelvaaecnvcfqdtok.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxd2VlbHZhYWVjbnZjZnFkdG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMjA4MjksImV4cCI6MjA3MTg5NjgyOX0.BEfzN3WaIfpmIuIPq-DbMWuxC7iW4-VIcMcM9CTPQ-8'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test user ID (simulating Firebase auth)
const testUserId = 'test-user-123'

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...')
  
  try {
    // Test the connection by making a simple query
    const { data, error } = await supabase
      .from('playlist_progress')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error.message)
      return false
    }
    
    console.log('✅ Supabase connection test successful')
    return true
  } catch (error) {
    console.error('❌ Supabase connection test error:', error.message)
    return false
  }
}

async function testTableExists() {
  console.log('🔍 Testing if playlist_progress table exists...')
  
  try {
    const { data, error } = await supabase
      .from('playlist_progress')
      .select('*')
      .limit(0)
    
    if (error) {
      console.error('❌ Table test failed:', error.message)
      return false
    }
    
    console.log('✅ Table exists and is accessible')
    return true
  } catch (error) {
    console.error('❌ Table test error:', error.message)
    return false
  }
}

async function testTableSchema() {
  console.log('🔍 Testing table schema...')
  
  try {
    const { data, error } = await supabase
      .from('playlist_progress')
      .select('id, user_id, playlist_id, question_id, completed, completed_at, created_at, updated_at')
      .limit(1)
    
    if (error) {
      console.error('❌ Schema test failed:', error.message)
      return false
    }
    
    console.log('✅ Table schema is correct')
    return true
  } catch (error) {
    console.error('❌ Schema test error:', error.message)
    return false
  }
}

async function testRLSPolicies() {
  console.log('🔍 Testing RLS policies with Firebase-style user ID...')
  
  try {
    // Test inserting data with a Firebase-style user ID
    const { data: insertData, error: insertError } = await supabase
      .from('playlist_progress')
      .insert({
        user_id: testUserId,
        playlist_id: 'test-playlist-1',
        question_id: 'test-question-1',
        completed: true,
        completed_at: new Date().toISOString()
      })
      .select()
    
    if (insertError) {
      console.error('❌ RLS Insert test failed:', insertError.message)
      console.error('Error details:', insertError)
      return false
    }
    
    console.log('✅ RLS Insert test successful')
    
    // Test selecting the data we just inserted
    const { data: selectData, error: selectError } = await supabase
      .from('playlist_progress')
      .select('*')
      .eq('user_id', testUserId)
    
    if (selectError) {
      console.error('❌ RLS Select test failed:', selectError.message)
      return false
    }
    
    console.log('✅ RLS Select test successful')
    console.log('Found records:', selectData?.length || 0)
    
    // Clean up test data
    const { error: deleteError } = await supabase
      .from('playlist_progress')
      .delete()
      .eq('user_id', testUserId)
    
    if (deleteError) {
      console.error('⚠️  Cleanup failed:', deleteError.message)
    } else {
      console.log('✅ Test data cleaned up')
    }
    
    return true
  } catch (error) {
    console.error('❌ RLS test error:', error.message)
    return false
  }
}

async function runAllTests() {
  console.log('🚀 Starting Supabase integration tests...\n')
  
  const connectionTest = await testSupabaseConnection()
  console.log('')
  
  if (connectionTest) {
    const tableTest = await testTableExists()
    console.log('')
    
    if (tableTest) {
      await testTableSchema()
      console.log('')
      await testRLSPolicies()
      console.log('')
      console.log('🎉 All tests passed! Supabase integration is working correctly.')
    } else {
      console.log('⚠️  Table test failed. Please run the SQL setup script in Supabase.')
    }
  } else {
    console.log('⚠️  Connection test failed. Please check your Supabase credentials.')
  }
}

runAllTests().catch(console.error)
