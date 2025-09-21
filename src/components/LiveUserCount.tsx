import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { auth } from '@/lib/firebase';
import { Users } from 'lucide-react';

interface ActiveUser {
  id: string;
  user_id: string;
  last_seen: string;
  page: string;
}

const LiveUserCount = () => {
  const [userCount, setUserCount] = useState(0);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let subscription: any;

    const updateUserActivity = async () => {
      if (!auth.currentUser) return;

      try {
        // Update or insert user activity
        const { error } = await supabase
          .from('active_users')
          .upsert({
            user_id: auth.currentUser.uid,
            last_seen: new Date().toISOString(),
            page: window.location.pathname
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          console.error('Error updating user activity:', error);
        }
      } catch (error) {
        console.error('Error in updateUserActivity:', error);
      }
    };

    const fetchActiveUsers = async () => {
      try {
        // Get users active in the last 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        
        const { data, error } = await supabase
          .from('active_users')
          .select('*')
          .gte('last_seen', fiveMinutesAgo);

        if (error) {
          console.error('Error fetching active users:', error);
          return;
        }

        setUserCount(data?.length || 0);
      } catch (error) {
        console.error('Error in fetchActiveUsers:', error);
      }
    };

    const setupRealtimeSubscription = () => {
      // Subscribe to changes in active_users table
      subscription = supabase
        .channel('active_users_changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'active_users' 
          }, 
          () => {
            // Refetch active users when there are changes
            fetchActiveUsers();
          }
        )
        .subscribe();
    };

    const startUserTracking = () => {
      if (!auth.currentUser) return;

      setIsOnline(true);
      
      // Initial update
      updateUserActivity();
      fetchActiveUsers();
      
      // Set up real-time subscription
      setupRealtimeSubscription();
      
      // Update user activity every 30 seconds
      intervalId = setInterval(updateUserActivity, 30000);
      
      // Fetch active users every 10 seconds
      const fetchInterval = setInterval(fetchActiveUsers, 10000);
      
      // Cleanup function
      return () => {
        clearInterval(intervalId);
        clearInterval(fetchInterval);
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    };

    const cleanup = startUserTracking();

    // Handle auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && !isOnline) {
        startUserTracking();
      } else if (!user && isOnline) {
        setIsOnline(false);
        setUserCount(0);
        if (cleanup) cleanup();
      }
    });

    // Cleanup on unmount
    return () => {
      if (cleanup) cleanup();
      unsubscribe();
    };
  }, [isOnline]);

  // Don't show if user is not authenticated
  if (!auth.currentUser) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Users className="h-4 w-4" />
      <span className="hidden sm:inline">
        {userCount} {userCount === 1 ? 'user' : 'users'} active
      </span>
      <span className="sm:hidden">
        {userCount}
      </span>
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
    </div>
  );
};

export default LiveUserCount;
