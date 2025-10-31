
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// ✅ All available admin pages
export const ADMIN_PAGES = {
  dashboard: { id: 'dashboard', name: 'Dashboard', path: 'AdminDashboard' },
  users: { id: 'users', name: 'Users Management', path: 'AdminUsers' },
  hosts: { id: 'hosts', name: 'Hosts Management', path: 'AdminHosts' },
  host_requests: { id: 'host_requests', name: 'Host Requests', path: 'AdminHostRequests' },
  bookings: { id: 'bookings', name: 'Bookings', path: 'AdminBookings' },
  customer_support: { id: 'customer_support', name: 'Customer Support', path: 'CustomerSupport' },
  partner_requests: { id: 'partner_requests', name: 'Partner Requests', path: 'AdminPartnerRequests' },
  messages: { id: 'messages', name: 'Messages', path: 'AdminMessages' },
  events: { id: 'events', name: 'Events', path: 'AdminEvents' },
  cities: { id: 'cities', name: 'Cities', path: 'AdminCities' },
  hero_slides: { id: 'hero_slides', name: 'Hero Slides', path: 'AdminHeroSlides' },
  offices: { id: 'offices', name: 'Offices', path: 'AdminOffices' },
  analytics: { id: 'analytics', name: 'Analytics', path: 'AdminAnalytics' },
};

export function useAdminPermissions() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (error) {
        return null;
      }
    },
    staleTime: 0,
    refetchInterval: 3000,
  });

  const hasFullAccess = user?.role_type === 'admin' &&
    (!user?.admin_access_type || user?.admin_access_type === 'full');

  const hasPageAccess = (pageId) => {
    if (!user || user.role_type !== 'admin') return false;
    if (hasFullAccess) return true;
    if (user.admin_access_type === 'limited' && user.admin_allowed_pages) {
      return user.admin_allowed_pages.includes(pageId);
    }
    return false;
  };

  return {
    user,
    hasFullAccess,
    hasPageAccess,
    isLoading: !user,
  };
}

export default function PermissionGuard({ pageId, children }) {
  const navigate = useNavigate();
  const { user, hasFullAccess, hasPageAccess, isLoading } = useAdminPermissions();

  useEffect(() => {
    if (!isLoading && user) {
      // ✅ Check if user lost admin role
      if (user.role_type !== 'admin') {
        console.log('🚫 Not an admin, redirecting to Home...');
        toast.success('🏠 Redirecting to Home page...', { duration: 2000 });
        navigate(createPageUrl('Home'), { replace: true });
        return;
      }

      // ✅ Check page access
      if (!hasPageAccess(pageId)) {
        console.log('🚫 No access to this page, redirecting to Dashboard...');
        navigate(createPageUrl('AdminDashboard'), { replace: true });
      }
    }
  }, [user, isLoading, pageId, hasPageAccess, navigate, hasFullAccess]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
      </div>
    );
  }

  if (!user || user.role_type !== 'admin' || !hasPageAccess(pageId)) {
    return null;
  }

  return <>{children}</>;
}
