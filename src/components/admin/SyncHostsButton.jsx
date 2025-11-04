import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

export default function SyncHostsButton() {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  const syncHosts = async () => {
    setSyncing(true);
    try {
      console.log('Syncing hosts...');

      // Just refresh the queries
      await queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      await queryClient.invalidateQueries({ queryKey: ['officeHosts'] });

      console.log(' Sync complete');
      toast.success('Hosts data refreshed!');
    } catch (error) {
      console.error(' Sync error:', error);
      toast.error('Failed to sync hosts');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button onClick={syncHosts} disabled={syncing} variant='outline' className='gap-2'>
      {syncing ? (
        <>
          <Loader2 className='w-4 h-4 animate-spin' />
          Refreshing...
        </>
      ) : (
        <>
          <RefreshCw className='w-4 h-4' />
          Refresh Data
        </>
      )}
    </Button>
  );
}
