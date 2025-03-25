// components/CollaborativeTable/PresenceIndicator.tsx
import { memo, useMemo } from 'react';
import { usePresenceStore } from '@/components/CollaborativeTable/store/presenceStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserCircle } from 'lucide-react';

interface PresenceIndicatorProps {
  rowId: string;
  columnId: string;
  showTooltip?: boolean;
}

/**
 * Component to show users that are viewing or editing a specific cell
 * - Displays avatars with tooltips for active users
 * - Shows editing state indicators
 * - Optimized with memoization for performance
 */
export const PresenceIndicator = memo(function PresenceIndicator({
  rowId,
  columnId,
  showTooltip = true
}: PresenceIndicatorProps) {
  const presenceStore = usePresenceStore();
  
  // Get users focused on this cell
  const focusedUsers = useMemo(() => {
    return Object.entries(presenceStore.focusedCellByUser)
      .filter(([_, focus]) => focus.rowId === rowId && focus.columnId === columnId)
      .map(([userId]) => {
        return presenceStore.activeUsers.find(user => user.user_id === userId);
      })
      .filter(Boolean);
  }, [presenceStore.focusedCellByUser, presenceStore.activeUsers, rowId, columnId]);
  
  // Don't render anything if no users are focused on this cell
  if (focusedUsers.length === 0) {
    return null;
  }
  
  // Only show up to 3 avatars to avoid clutter
  const displayedUsers = focusedUsers.slice(0, 3);
  const remainingCount = focusedUsers.length - displayedUsers.length;
  
  // Generate unique colors for users without avatars
  const getUserColor = (userId: string) => {
    // Simple hash function to generate a color
    const hash = userId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const h = hash % 360;
    return `hsl(${h}, 70%, 70%)`;
  };
  
  return (
    <div className="absolute top-0 right-0 flex -space-x-2 p-1">
      {displayedUsers.map(user => (
        <TooltipProvider key={user!.user_id} delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="h-6 w-6 border-2 border-white ring-2 ring-yellow-200 bg-white">
                {user!.user_avatar ? (
                  <AvatarImage src={user!.user_avatar} />
                ) : (
                  <AvatarFallback 
                    style={{ backgroundColor: getUserColor(user!.user_id) }}
                  >
                    {user!.user_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
            </TooltipTrigger>
            {showTooltip && (
              <TooltipContent side="top">
                <p>{user!.user_name} is viewing this cell</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      ))}
      
      {/* Show indicator for additional users */}
      {remainingCount > 0 && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-xs border-2 border-white">
                +{remainingCount}
              </div>
            </TooltipTrigger>
            {showTooltip && (
              <TooltipContent side="top">
                <p>{remainingCount} more {remainingCount === 1 ? 'user' : 'users'}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
});