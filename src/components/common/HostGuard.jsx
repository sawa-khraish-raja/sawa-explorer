import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAllDocuments, queryDocuments, getDocument, addDocument, updateDocument, deleteDocument } from '@/utils/firestore';
import { uploadImage, uploadVideo } from '@/utils/storage';
import { Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function HostGuard({ children, requireHost = true }) {
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await useAppContext().user;
      } catch (error) {
        return null;
      }
    },
    staleTime: 0,
    cacheTime: 0,
    refetchInterval: 5000,
  });

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
