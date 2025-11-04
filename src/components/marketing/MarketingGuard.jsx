import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { createPageUrl } from '@/utils';

import { useAppContext } from '../context/AppContext';

export function useMarketingAuth() {
  const { user, isLoading } = useAppContext();

  const hasAccess = user?.role_type === 'marketing' || user?.role_type === 'admin';

  return {
    user,
    isLoading,
    hasAccess,
    isMarketing: user?.role_type === 'marketing',
    isAdmin: user?.role_type === 'admin',
  };
}

export default function MarketingGuard({ children }) {
  const navigate = useNavigate();
  const { user, isLoading, hasAccess } = useMarketingAuth();

  useEffect(() => {
    if (!isLoading && !hasAccess) {
      console.log(' Unauthorized access to Marketing Dashboard');
      toast.error('Access Denied', {
        description: 'You need Marketing or Admin role to access this area.',
      });
      navigate(createPageUrl('Home'), { replace: true });
    }
  }, [user, isLoading, hasAccess, navigate]);

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 to-purple-50'>
        <Loader2 className='w-8 h-8 animate-spin text-purple-600' />
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}
