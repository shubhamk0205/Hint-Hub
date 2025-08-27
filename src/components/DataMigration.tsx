import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { 
  migrateLocalStorageToSupabase, 
  hasSupabaseProgress, 
  hasLocalStorageProgress 
} from '@/lib/playlistProgress'
import { auth } from '@/lib/firebase'
import { 
  Database, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Loader2 
} from 'lucide-react'

const DataMigration = () => {
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationProgress, setMigrationProgress] = useState(0)
  const [hasLocalData, setHasLocalData] = useState(false)
  const [hasSupabaseData, setHasSupabaseData] = useState(false)
  const [migrationComplete, setMigrationComplete] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    checkDataStatus()
  }, [])

  const checkDataStatus = async () => {
    const localData = hasLocalStorageProgress()
    const supabaseData = await hasSupabaseProgress()
    
    setHasLocalData(localData)
    setHasSupabaseData(supabaseData)
  }

  const handleMigration = async () => {
    if (!auth.currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to migrate your data.",
        variant: "destructive"
      })
      return
    }

    setIsMigrating(true)
    setMigrationProgress(0)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setMigrationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const success = await migrateLocalStorageToSupabase()
      
      clearInterval(progressInterval)
      setMigrationProgress(100)

      if (success) {
        setMigrationComplete(true)
        toast({
          title: "Migration Successful!",
          description: "Your playlist progress has been migrated to the cloud.",
        })
        
        // Update status after migration
        setTimeout(() => {
          checkDataStatus()
        }, 1000)
      } else {
        toast({
          title: "Migration Failed",
          description: "There was an error migrating your data. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Migration error:', error)
      toast({
        title: "Migration Error",
        description: "An unexpected error occurred during migration.",
        variant: "destructive"
      })
    } finally {
      setIsMigrating(false)
    }
  }

  if (!hasLocalData && !hasSupabaseData) {
    return null // Don't show migration component if no data exists
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Migration
        </CardTitle>
        <CardDescription>
          Migrate your playlist progress from local storage to the cloud
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasLocalData && !hasSupabaseData && (
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <AlertCircle className="h-4 w-4" />
            Local data found - ready to migrate
          </div>
        )}

        {hasSupabaseData && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            Cloud data available
          </div>
        )}

        {migrationComplete && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            Migration completed successfully!
          </div>
        )}

        {isMigrating && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Migrating data...
            </div>
            <Progress value={migrationProgress} className="h-2" />
          </div>
        )}

        {hasLocalData && !hasSupabaseData && !isMigrating && !migrationComplete && (
          <Button 
            onClick={handleMigration} 
            className="w-full"
            disabled={isMigrating}
          >
            <Upload className="h-4 w-4 mr-2" />
            Migrate to Cloud
          </Button>
        )}

        {migrationComplete && (
          <div className="text-xs text-muted-foreground">
            Your data is now safely stored in the cloud and will sync across all your devices.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default DataMigration
