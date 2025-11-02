import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function useMarketingAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (error) {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

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
      console.log('🚫 Unauthorized access to Marketing Dashboard');
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
