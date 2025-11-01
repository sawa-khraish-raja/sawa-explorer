import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Users,
  Building2,
  UserCheck,
  LayoutDashboard,
  Calendar,
  Menu,
  X,
  Shield,
  ExternalLink,
  Zap,
  MapPin,
  Bell,
  TrendingUp,
  MessageSquare,
  FileText,
  AlertCircle,
  Activity,
  Briefcase,
  Settings,
  Image,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAdminPermissions, ADMIN_PAGES } from './PermissionGuard';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function AdminLayout({ children, currentPage = '' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { hasFullAccess, hasPageAccess, user } = useAdminPermissions();

  const { data: notificationCounts = {}, isLoading: countsLoading } = useQuery({
    queryKey: ['adminNotificationCounts'],
    queryFn: async () => {
      try {
        const [hostRequests, partnerRequests, adventures, cancellations] = await Promise.all([
          base44.entities.HostRequest.filter({ status: 'pending' }),
          base44.entities.PartnerRequest.filter({ status: 'new' }),
          base44.entities.Adventure.filter({ approval_status: 'pending' }),
          base44.entities.CancellationRequest.filter({ status: 'pending' }),
        ]);

        return {
          hostRequests: hostRequests.length,
          partnerRequests: partnerRequests.length,
          pendingAdventures: adventures.length,
          pendingCancellations: cancellations.length,
        };
      } catch (error) {
        console.error('Error loading notification counts:', error);
        return {
          hostRequests: 0,
          partnerRequests: 0,
          pendingAdventures: 0,
          pendingCancellations: 0,
        };
      }
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });

  useEffect(() => {
    if (user) {
      const hasAnyAdminAccess =
        hasFullAccess || (user.admin_allowed_pages && user.admin_allowed_pages.length > 0);

      if (!hasAnyAdminAccess) {
        console.log('🚫 No admin access detected, redirecting to Home...');
        navigate(createPageUrl('Home'), { replace: true });
      }
    }
  }, [user, hasFullAccess, navigate]);

  const menuItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: 'AdminDashboard',
    },
    { id: 'users', name: 'Users', icon: Users, path: 'AdminUsers' },
    { id: 'hosts', name: 'Hosts', icon: UserCheck, path: 'AdminHosts' },
    { id: 'bookings', name: 'Bookings', icon: Calendar, path: 'AdminBookings' },
    {
      id: 'adventures',
      name: 'Adventures',
      icon: Zap,
      path: 'AdminAdventures',
      count: notificationCounts.pendingAdventures,
    },
    { id: 'cities', name: 'Cities', icon: MapPin, path: 'AdminCities' },
    { id: 'offices', name: 'Offices', icon: Building2, path: 'AdminOffices' },

    //  RESTORED + NEW
    {
      id: 'customer_support',
      name: 'Customer Support',
      icon: HelpCircle,
      path: 'CustomerSupport',
      badge: 'New',
    },
    {
      id: 'host_requests',
      name: 'Host Requests',
      icon: UserCheck,
      path: 'AdminHostRequests',
      count: notificationCounts.hostRequests,
    },
    {
      id: 'partner_requests',
      name: 'Partner Requests',
      icon: Briefcase,
      path: 'AdminPartnerRequests',
      count: notificationCounts.partnerRequests,
    },
    {
      id: 'cancellations',
      name: 'Cancellations',
      icon: XCircle,
      path: 'AdminCancellations',
      count: notificationCounts.pendingCancellations,
    },
    {
      id: 'messages',
      name: 'Messages',
      icon: MessageSquare,
      path: 'AdminMessages',
    },
    { id: 'events', name: 'Events', icon: Calendar, path: 'AdminEvents' },
    {
      id: 'hero_slides',
      name: 'Hero Slides',
      icon: Image,
      path: 'AdminHeroSlides',
    },
    {
      id: 'forum',
      name: 'Forum Moderation',
      icon: MessageSquare,
      path: 'AdminForumModeration',
    },
    {
      id: 'adventure_posts',
      name: 'Adventure Posts',
      icon: Image,
      path: 'AdminAdventurePosts',
    },
    {
      id: 'ai_monitoring',
      name: 'AI Monitoring',
      icon: Activity,
      path: 'AdminAIMonitoring',
    },
    {
      id: 'agencies',
      name: 'Agencies',
      icon: Building2,
      path: 'AdminAgencies',
    },
    {
      id: 'audit_logs',
      name: 'Audit Logs',
      icon: FileText,
      path: 'AdminAuditLogs',
    },

    {
      id: 'broadcast',
      name: 'Broadcast',
      icon: Bell,
      path: 'AdminBroadcast',
      badge: 'New',
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: TrendingUp,
      path: 'AdminAnalytics',
    },
  ].filter((item) => hasFullAccess || hasPageAccess(item.id));

  const totalNotifications = menuItems.reduce((sum, item) => sum + (item.count || 0), 0);

  return (
    <div className='flex min-h-screen bg-[var(--brand-bg-secondary)]'>
      {/* Desktop Sidebar */}
      <aside className='hidden lg:block w-64 flex-shrink-0 border-r border-[var(--brand-primary-border)] bg-gradient-to-b from-[#1e1b4b] via-[#312e81] to-[#4c1d95] sticky top-0 h-screen overflow-y-auto shadow-xl'>
        <div className='flex flex-col h-full'>
          <div className='p-4 border-b border-white/10'>
            <Link to={createPageUrl('Home')} className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-xl overflow-hidden shadow-lg'>
                <img
                  src='https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e8bf2aebfc9660599d11a9/e62457e5e_WhatsAppImage2025-10-16at235513_248ceca9.jpg'
                  alt='SAWA'
                  className='w-full h-full object-cover'
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/40x40/330066/FFFFFF?text=S';
                  }}
                />
              </div>

              <div className='flex items-center gap-2 border-l pl-3 border-white/30'>
                <span className='text-xl font-bold text-white'>SAWA</span>
                <div className='flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded-lg'>
                  <Shield className='w-4 h-4 text-white' />
                  <span className='text-xs font-bold text-white'>Admin</span>
                </div>
              </div>
            </Link>

            {user && (
              <div className='mt-3 px-2'>
                {hasFullAccess ? (
                  <Badge className='bg-green-500/20 text-green-200 border border-green-400/30 w-full justify-center'>
                    Full Access
                  </Badge>
                ) : (
                  <Badge className='bg-yellow-500/20 text-yellow-200 border border-yellow-400/30 w-full justify-center'>
                    ⚡ Limited Access
                  </Badge>
                )}

                {totalNotifications > 0 && (
                  <div className='mt-2 bg-red-500/20 border border-red-400/30 rounded-lg px-3 py-2 text-center'>
                    <p className='text-red-200 text-xs font-semibold'>
                      {totalNotifications} New{' '}
                      {totalNotifications === 1 ? 'Notification' : 'Notifications'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <nav className='flex-1 p-4 space-y-2 overflow-y-auto'>
            {menuItems.map((link) => {
              const isActive = location.pathname.includes(createPageUrl(link.path));
              return (
                <Link
                  key={link.id}
                  to={createPageUrl(link.path)}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-white/80 transition-all hover:text-white hover:bg-white/10',
                    isActive && 'bg-white/20 text-white font-semibold shadow-lg'
                  )}
                >
                  <div className='flex items-center gap-3'>
                    <link.icon className='h-4 w-4 flex-shrink-0' />
                    <span className='text-sm'>{link.name}</span>
                  </div>

                  {link.count && link.count > 0 && (
                    <Badge className='bg-red-500 text-white border-0 shadow-md text-xs h-5 px-2'>
                      {link.count}
                    </Badge>
                  )}

                  {link.badge && (
                    <Badge className='bg-purple-500/80 text-white border-0 shadow-md text-xs h-5 px-2'>
                      {link.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}

            {hasFullAccess && user?.company_name && (
              <a
                href={createPageUrl('OfficeDashboard')}
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-3 rounded-lg px-3 py-2 text-white/60 transition-all hover:text-white hover:bg-white/10 border-t border-white/10 mt-4 pt-4'
              >
                <Building2 className='h-4 w-4' />
                Office Dashboard
                <ExternalLink className='h-3 w-3 ml-auto' />
              </a>
            )}
          </nav>

          {user && (
            <div className='p-4 border-t border-white/10'>
              <div className='text-xs text-white/60 mb-1'>Logged in as</div>
              <div className='text-sm text-white font-semibold truncate'>
                {user.full_name || user.email}
              </div>
              {!hasFullAccess && user.admin_allowed_pages && (
                <div className='text-xs text-white/50 mt-1'>
                  {user.admin_allowed_pages.length} page
                  {user.admin_allowed_pages.length !== 1 ? 's' : ''} access
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className='lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#4c1d95] shadow-lg'>
        <div className='flex items-center justify-between p-3'>
          <Link to={createPageUrl('Home')} className='flex items-center gap-2'>
            <div className='w-8 h-8 rounded-lg overflow-hidden shadow-lg'>
              <img
                src='https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e8bf2aebfc9660599d11a9/e62457e5e_WhatsAppImage2025-10-16at235513_248ceca9.jpg'
                alt='SAWA'
                className='w-full h-full object-cover'
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/32x32/330066/FFFFFF?text=S';
                }}
              />
            </div>

            <div className='flex items-center gap-1.5'>
              <span className='text-base font-bold text-white'>SAWA</span>
              <div className='flex items-center gap-0.5 bg-white/20 px-1.5 py-0.5 rounded-md'>
                <Shield className='w-2.5 h-2.5 text-white' />
                <span className='text-[9px] font-bold text-white'>Admin</span>
              </div>
            </div>
          </Link>
          <div className='flex items-center gap-1.5'>
            {totalNotifications > 0 && (
              <div className='bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center'>
                {totalNotifications > 9 ? '9+' : totalNotifications}
              </div>
            )}
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className='text-white hover:bg-white/10 w-8 h-8'
            >
              {mobileMenuOpen ? <X className='w-5 h-5' /> : <Menu className='w-5 h-5' />}
            </Button>
          </div>
        </div>

        {user && (
          <div className='px-3 pb-2'>
            {hasFullAccess ? (
              <Badge className='bg-green-500/20 text-green-200 border border-green-400/30 text-[10px] h-5'>
                Full Access
              </Badge>
            ) : (
              <Badge className='bg-yellow-500/20 text-yellow-200 border border-yellow-400/30 text-[10px] h-5'>
                ⚡ Limited ({user.admin_allowed_pages?.length || 0} pages)
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className='lg:hidden fixed inset-0 bg-black/50 z-40'
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed top-16 left-0 bottom-0 w-64 bg-gradient-to-b from-[#1e1b4b] via-[#312e81] to-[#4c1d95] shadow-xl z-40 transform transition-transform duration-300 overflow-y-auto',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className='p-4 space-y-2'>
          {menuItems.map((link) => {
            const isActive = location.pathname.includes(createPageUrl(link.path));
            return (
              <Link
                key={link.id}
                to={createPageUrl(link.path)}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-white/80 transition-all hover:text-white hover:bg-white/10',
                  isActive && 'bg-white/20 text-white font-semibold shadow-lg'
                )}
              >
                <div className='flex items-center gap-3'>
                  <link.icon className='h-4 w-4' />
                  {link.name}
                </div>

                {link.count && link.count > 0 && (
                  <Badge className='bg-red-500 text-white border-0 shadow-md text-xs h-5 px-2'>
                    {link.count}
                  </Badge>
                )}

                {link.badge && (
                  <Badge className='bg-purple-500/80 text-white border-0 shadow-md text-xs h-5 px-2'>
                    {link.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className='p-4 border-t border-white/10 mt-auto'>
            <div className='text-xs text-white/60 mb-1'>Logged in as</div>
            <div className='text-sm text-white font-semibold truncate'>
              {user.full_name || user.email}
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className='flex-1 w-full lg:w-auto overflow-x-hidden'>
        <div className='p-3 sm:p-4 lg:p-8 pt-24 lg:pt-8 bg-gradient-to-br from-[var(--brand-bg-secondary)] to-[var(--brand-bg-accent-light)] min-h-screen'>
          {children}
        </div>
      </main>
    </div>
  );
}
