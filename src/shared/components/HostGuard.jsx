import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { createPageUrl } from '@/utils';

import { UseAppContext } from '@/shared/context/AppContext';

export default function HostGuard({ children, requireHost = true }) {
  const { user } = UseAppContext();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading check - AppContext should handle auth state
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!isLoading && user) {
      const isHost = user.host_approved;

      // If page requires host but user is not host
      if (requireHost && !isHost) {
        navigate(createPageUrl('Home'), { replace: true });
      }

      // If page requires non-host but user is host
      if (!requireHost && isHost) {
        // Redirect to appropriate dashboard
        if (user.host_type === 'office') {
          navigate(createPageUrl('HostDashboard'), { replace: true });
        } else {
          navigate(createPageUrl('IndependentHostDashboard'), { replace: true });
        }
      }
    }
  }, [user, isLoading, requireHost, navigate]);

  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <Loader2 className='w-8 h-8 animate-spin text-[var(--brand-primary)]' />
      </div>
    );
  }

  return children;
}
