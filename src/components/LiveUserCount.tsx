import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { auth } from '@/lib/firebase';
import { UserCheck } from 'lucide-react';

const LiveUserCount = () => {
  const [totalUserCount, setTotalUserCount] = useState(0);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const updateUserActivity = async () => {
      if (!auth.currentUser) return;

      try {
        // Track user visit in total_users table
        const { error: trackError } = await supabase.rpc('track_user_visit', {
          user_uid: auth.currentUser.uid
        });

        if (trackError) {
          console.error('Error tracking user visit:', trackError);
        }
      } catch (error) {
        console.error('Error in updateUserActivity:', error);
      }
    };

    const fetchTotalUsers = async () => {
      try {
        const { data, error } = await supabase.rpc('get_total_user_count');

        if (error) {
          console.error('Error fetching total users:', error);
          return;
        }

        setTotalUserCount(data || 0);
      } catch (error) {
        console.error('Error in fetchTotalUsers:', error);
      }
    };

    const startUserTracking = () => {
      if (!auth.currentUser) return;

      setIsOnline(true);
      
      // Initial update
      updateUserActivity();
      fetchTotalUsers();
      
      // Update user activity every 30 seconds
      intervalId = setInterval(updateUserActivity, 30000);
      
      // Fetch total users every 60 seconds (less frequent since it changes less often)
      const totalUsersInterval = setInterval(fetchTotalUsers, 60000);
      
      // Cleanup function
      return () => {
        clearInterval(intervalId);
        clearInterval(totalUsersInterval);
      };
    };

    const cleanup = startUserTracking();

    // Handle auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && !isOnline) {
        startUserTracking();
      } else if (!user && isOnline) {
        setIsOnline(false);
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
      {/* Total Users Only */}
      <div className="flex items-center gap-1">
        <UserCheck className="h-4 w-4" />
        <span className="hidden sm:inline">
          {totalUserCount.toLocaleString()} total users
        </span>
        <span className="sm:hidden">
          {totalUserCount.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default LiveUserCount;
