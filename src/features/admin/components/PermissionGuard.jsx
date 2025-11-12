import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { createPageUrl } from '@/utils';

import { UseAppContext } from "@/shared/context/AppContext";

//  All available admin pages
export const ADMIN_PAGES = {
  dashboard: { id: 'dashboard', name: 'Dashboard', path: 'AdminDashboard' },
  users: { id: 'users', name: 'Users Management', path: 'AdminUsers' },
  hosts: { id: 'hosts', name: 'Hosts Management', path: 'AdminHosts' },
  host_requests: {
    id: 'host_requests',
    name: 'Host Requests',
    path: 'AdminHostRequests',
  },
  bookings: { id: 'bookings', name: 'Bookings', path: 'AdminBookings' },
  customer_support: {
    id: 'customer_support',
    name: 'Customer Support',
    path: 'CustomerSupport',
  },
  partner_requests: {
    id: 'partner_requests',
    name: 'Partner Requests',
    path: 'AdminPartnerRequests',
  },
  messages: { id: 'messages', name: 'Messages', path: 'AdminMessages' },
  events: { id: 'events', name: 'Events', path: 'AdminEvents' },
  cities: { id: 'cities', name: 'Cities', path: 'AdminCities' },
  hero_slides: {
    id: 'hero_slides',
    name: 'Hero Slides',
    path: 'AdminHeroSlides',
  },
  offices: { id: 'offices', name: 'Offices', path: 'AdminOffices' },
  analytics: { id: 'analytics', name: 'Analytics', path: 'AdminAnalytics' },
};

export function useAdminPermissions() {
  const { user, userLoading, isAdmin } = UseAppContext();

  const hasFullAccess =
    user?.role_type === 'admin' && (!user?.admin_access_type || user?.admin_access_type === 'full');

  const hasPageAccess = (pageId) => {
    if (!user || !isAdmin) return false;
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
    isLoading: userLoading,
    isAdmin,
  };
}

export default function PermissionGuard({ pageId, children }) {
  const navigate = useNavigate();
  const { user, hasFullAccess, hasPageAccess, isLoading, isAdmin } = useAdminPermissions();

  useEffect(() => {
    // Only check permissions after loading is complete AND we have a definitive answer
    if (!isLoading) {
      // If loading is done and user is null, they're not logged in
      if (user === null) {
        console.log(' Not logged in, redirecting to Home...');
        toast.info('Please sign in as an admin to access this page.', { duration: 2000 });
        navigate(createPageUrl('Home'), { replace: true });
        return;
      }

      // If we have a user but they're not an admin
      if (user && !isAdmin) {
        console.log(' Not an admin, redirecting to Home...');
        toast.info('Please sign in as an admin to access this page.', { duration: 2000 });
        navigate(createPageUrl('Home'), { replace: true });
        return;
      }

      //  Check page access for limited admins
      if (user && isAdmin && !hasPageAccess(pageId)) {
        console.log(' No access to this page, redirecting to Dashboard...');
        toast.warning('You do not have access to this page.', { duration: 2000 });
        navigate(createPageUrl('AdminDashboard'), { replace: true });
      }
    }
  }, [user, isLoading, pageId, hasPageAccess, navigate, isAdmin]);

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-96'>
        <Loader2 className='w-8 h-8 animate-spin text-[var(--brand-primary)]' />
      </div>
    );
  }

  if (!user || !isAdmin || !hasPageAccess(pageId)) {
    return null;
  }

  return <>{children}</>;
}
