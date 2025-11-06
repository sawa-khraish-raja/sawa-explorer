import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Menu,
  User,
  LogOut,
  LayoutDashboard,
  Youtube,
  Instagram,
  Briefcase,
  Info,
  ChevronLeft,
  MapPin,
  Users,
  BarChart3,
} from 'lucide-react';
import { useEffect, useCallback, useState, useMemo, memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';

import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import { AuthModal } from '@/components/auth/AuthModal';
import ChatLauncher from '@/components/chat/ChatLauncher';
import MessagesBadge from '@/components/chat/MessagesBadge';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import GlobalStyles from '@/components/common/GlobalStyles';
import ResponsiveStyles from '@/components/common/ResponsiveStyles';
import { AppProvider, useAppContext } from '@/components/context/AppContext';
import { LanguageProvider, useTranslation } from '@/components/i18n/LanguageContext';
import { FCMProvider } from '@/components/notifications/FCMProvider';
import NotificationBell from '@/components/notifications/NotificationBell';
import NotificationPrompt from '@/components/notifications/NotificationPrompt';
import NotificationWelcomePrompt from '@/components/notifications/NotificationWelcomePrompt';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { AUTH_MODAL_EVENT } from '@/services/firebaseAuthAdapter';
import { createPageUrl } from '@/utils';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20 * 60 * 1000,
      cacheTime: 40 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: (failureCount, error) => {
        if (error?.response?.status === 429) return false;
        return failureCount < 1;
      },
      retryDelay: 10000,
    },
  },
});

const DesktopNav = memo(
  ({
    isHost,
    isOfficeOnly,
    hasAdminRole,
    isActivePage,
    createPageUrl,
    t,
    location,
    officeDashboardBaseUrl,
    adminDashboardBaseUrl,
  }) => {
    if (isOfficeOnly) {
      return (
        <Link
          to={createPageUrl('OfficeDashboard')}
          className={cn(
            'px-4 py-2.5 text-[15px] font-medium rounded-full transition-all duration-150',
            location.pathname.startsWith(officeDashboardBaseUrl)
              ? 'text-gray-900'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          )}
        >
          {t('nav.office')}
        </Link>
      );
    }

    if (isHost && !hasAdminRole) {
      return (
        <>
          <Link
            to={createPageUrl('HostDashboard')}
            className={cn(
              'px-4 py-2.5 text-[15px] font-medium rounded-full transition-all duration-150',
              isActivePage('HostDashboard')
                ? 'text-gray-900'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            {t('nav.my_dashboard')}
          </Link>
          <Link
            to={createPageUrl('HostAdventures')}
            className={cn(
              'px-4 py-2.5 text-[15px] font-medium rounded-full transition-all duration-150',
              isActivePage('HostAdventures')
                ? 'text-gray-900'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            My Adventures
          </Link>
          <Link
            to={createPageUrl('Adventures')}
            className={cn(
              'px-4 py-2.5 text-[15px] font-medium rounded-full transition-all duration-150',
              isActivePage('Adventures')
                ? 'text-gray-900'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            {t('nav.adventures')}
          </Link>
          <Link
            to={createPageUrl('ForumHome')}
            className={cn(
              'px-4 py-2.5 text-[15px] font-medium rounded-full transition-all duration-150',
              isActivePage('ForumHome')
                ? 'text-gray-900'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            Community
          </Link>
        </>
      );
    }

    if (hasAdminRole) {
      return (
        <>
          <Link
            to={createPageUrl('Home')}
            className={cn(
              'px-4 py-2.5 text-[15px] font-medium rounded-full transition-all duration-150',
              isActivePage('Home')
                ? 'text-gray-900'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            {t('nav.home')}
          </Link>
          <Link
            to={createPageUrl('Destinations')}
            className={cn(
              'px-4 py-2.5 text-[15px] font-medium rounded-full transition-all duration-150',
              isActivePage('Destinations')
                ? 'text-gray-900'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            Destinations
          </Link>
          <Link
            to={createPageUrl('ForumHome')}
            className={cn(
              'px-4 py-2.5 text-[15px] font-medium rounded-full transition-all duration-150',
              isActivePage('ForumHome')
                ? 'text-gray-900'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            Community
          </Link>
          <Link
            to={createPageUrl('About')}
            className={cn(
              'px-4 py-2.5 text-[15px] font-medium rounded-full transition-all duration-150',
              isActivePage('About')
                ? 'text-gray-900'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            {t('nav.about')}
          </Link>
        </>
      );
    }

    return (
      <>
        <Link
          to={createPageUrl('Home')}
          className={cn(
            'px-4 py-2.5 text-[15px] font-medium rounded-full transition-all duration-150',
            isActivePage('Home')
              ? 'text-gray-900'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          )}
        >
          {t('nav.home')}
        </Link>
        <Link
          to={createPageUrl('Destinations')}
          className={cn(
            'px-4 py-2.5 text-[15px] font-medium rounded-full transition-all duration-150',
            isActivePage('Destinations')
              ? 'text-gray-900'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          )}
        >
          Destinations
        </Link>
        <Link
          to={createPageUrl('ForumHome')}
          className={cn(
            'px-4 py-2.5 text-[15px] font-medium rounded-full transition-all duration-150',
            isActivePage('ForumHome')
              ? 'text-gray-900'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          )}
        >
          Community
        </Link>
        <Link
          to={createPageUrl('About')}
          className={cn(
            'px-4 py-2.5 text-[15px] font-medium rounded-full transition-all duration-150',
            isActivePage('About')
              ? 'text-gray-900'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          )}
        >
          {t('nav.about')}
        </Link>
      </>
    );
  }
);

DesktopNav.displayName = 'DesktopNav';

const AppContent = memo(({ children, currentPageName }) => {
  const { t, language } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');

  const { user, userLoading: isLoadingUser } = useAppContext();
  const { logout } = useAuth();

  useEffect(() => {
    const handleOpenAuthModal = (event) => {
      const nextTab = event.detail?.tab || 'login';
      setAuthModalTab(nextTab);
      setAuthModalOpen(true);
    };

    window.addEventListener(AUTH_MODAL_EVENT, handleOpenAuthModal);
    return () => {
      window.removeEventListener(AUTH_MODAL_EVENT, handleOpenAuthModal);
    };
  }, []);

  const openLoginModal = () => {
    setAuthModalTab('login');
    setAuthModalOpen(true);
  };

  const openSignupModal = () => {
    setAuthModalTab('signup');
    setAuthModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone ||
      document.referrer.includes('android-app://');
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

    if (isIOS && isSafari && !isStandalone) {
      const timer = setTimeout(() => setShowInstallPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    if ('Notification' in window && Notification.permission === 'default') {
      // Handle potential unhandled promise rejection for Notification.requestPermission()
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    let rafId = null;
    let lastScrollY = 0;

    const handleScroll = () => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        if (Math.abs(currentScrollY - lastScrollY) > 10) {
          setScrolled(currentScrollY > 10);
          lastScrollY = currentScrollY;
        }
        rafId = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const userRoles = useMemo(() => {
    if (!user)
      return { hasAdminRole: false, hasOfficeRole: false, isHost: false, isMarketing: false };

    return {
      hasAdminRole: user.role_type === 'admin' || user.role === 'admin',
      hasOfficeRole: user.role_type === 'office',
      isHost: !!user.host_approved,
      isMarketing: user.role_type === 'marketing',
    };
  }, [user?.id, user?.role_type, user?.role, user?.host_approved]);

  const { hasAdminRole, hasOfficeRole, isHost, isMarketing } = userRoles;
  const isOfficeOnly = hasOfficeRole && !isHost && !hasAdminRole;

  const messagesBaseUrl = useMemo(() => createPageUrl('Messages'), []);
  const hostDashboardBaseUrl = useMemo(() => createPageUrl('HostDashboard'), []);
  const officeDashboardBaseUrl = useMemo(() => createPageUrl('OfficeDashboard'), []);
  const adminDashboardBaseUrl = useMemo(() => createPageUrl('AdminDashboard'), []);

  const isMessagesPage = location.pathname.startsWith(messagesBaseUrl);
  const isHostDashboardWithConvo =
    location.pathname.startsWith(hostDashboardBaseUrl) &&
    location.search?.includes('conversation_id');
  const isOfficeDashboardPage = location.pathname.startsWith(officeDashboardBaseUrl);
  const isAdminDashboardPage = location.pathname.startsWith(adminDashboardBaseUrl);

  const isInConversation = useMemo(
    () =>
      (isMessagesPage || isHostDashboardWithConvo || isOfficeDashboardPage) &&
      location.search?.includes('conversation_id'),
    [isMessagesPage, isHostDashboardWithConvo, isOfficeDashboardPage, location.search]
  );

  const hideFooter =
    isMessagesPage || isHostDashboardWithConvo || isOfficeDashboardPage || isAdminDashboardPage;

  const isActivePage = useCallback(
    (pageName) => location.pathname === createPageUrl(pageName),
    [location.pathname]
  );

  const shouldShowBackButton = useCallback(() => {
    const currentPath = location.pathname.replace(/\/$/, '');
    const homePath = createPageUrl('Home').replace(/\/$/, '');
    const isHomePage = currentPath === homePath || currentPath === '' || currentPath === '/';
    return !isHomePage;
  }, [location.pathname]);

  const handleBackClick = useCallback(
    (e) => {
      e.preventDefault();
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(createPageUrl('Home'));
      }
    },
    [navigate, createPageUrl]
  );

  const showLoadingSkeleton = isLoadingUser && !user;

  return (
    <>
      <GlobalStyles />
      <ResponsiveStyles />
      <GoogleAnalytics />

      <Toaster
        position='top-center'
        expand={false}
        richColors
        toastOptions={{
          duration: 4000,
          style: {
            marginTop: isInConversation ? '60px' : '80px',
          },
          classNames: {
            toast: 'text-sm p-3 max-w-md',
            title: 'text-sm font-semibold',
            description: 'text-xs',
          },
        }}
      />

      {showInstallPrompt && (
        <div className='fixed top-16 left-4 right-4 z-[60] lg:hidden'>
          <div className='bg-gradient-to-r from-[#330066] to-[#9933CC] text-white rounded-2xl shadow-2xl p-4 border-2 border-white/20'>
            <div className='flex items-start gap-3'>
              <img
                src='https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e8bf2aebfc9660599d11a9/e62457e5e_WhatsAppImage2025-10-16at235513_248ceca9.jpg'
                alt='SAWA App Icon'
                className='w-12 h-12 rounded-xl flex-shrink-0'
                loading='lazy'
              />
              <div className='flex-1 min-w-0'>
                <h3 className='font-bold text-sm mb-1'>ثبّت تطبيق SAWA</h3>
                <div className='text-xs text-white/90 space-y-2'>
                  <p className='font-semibold'>اتبع هذه الخطوات:</p>
                  <ol className='list-decimal list-inside space-y-1 mr-2'>
                    <li>اضغط على زر مشاركة في الأسفل</li>
                    <li>مرر للأسفل</li>
                    <li>اختر إضافة إلى الشاشة الرئيسية</li>
                  </ol>
                </div>
                <button
                  onClick={() => setShowInstallPrompt(false)}
                  className='text-xs font-semibold underline text-white/80 hover:text-white mt-3'
                  type='button'
                >
                  فهمت، شكراً
                </button>
              </div>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className='text-white/80 hover:text-white flex-shrink-0'
                aria-label='Close install prompt'
                type='button'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>
            <div className='flex justify-center mt-3'>
              <svg
                className='w-6 h-6 text-white'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={3}
                  d='M19 14l-7 7m0 0l-7-7m7 7V3'
                />
              </svg>
            </div>
          </div>
        </div>
      )}

      <div
        className='min-h-screen flex flex-col bg-white pb-[env(safe-area-inset-bottom)]'
        dir={language === 'ar' || language === 'he' ? 'rtl' : 'ltr'}
      >
        <style>{`
            :root {
              --brand-primary: #330066;
              --brand-primary-hover: #47008F;
              --brand-primary-border: #5C00B8;
              --brand-secondary: #9933CC;
              --brand-secondary-hover: #AD5CD6;
              --brand-secondary-light: #CE9DE7;
              --brand-bg-accent: #CCCCFF;
              --brand-bg-accent-dark: #9999FF;
              --brand-bg-accent-light: #E6E6FF;
              --brand-bg-primary: white;
              --brand-bg-secondary: #f8f7fa;
              --brand-text-primary: #1a1a1a;
              --brand-text-secondary: #666666;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              -webkit-tap-highlight-color: transparent;
            }
            html {
              scroll-behavior: auto;
              overflow-x: hidden;
              -webkit-text-size-adjust: 100%;
              overscroll-behavior-y: none;
            }
            body {
              overflow-x: hidden;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
                'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              overscroll-behavior-y: none;
            }
            input, textarea, select {
              font-size: 16px !important;
            }
            .safe-area-top {
              padding-top: env(safe-area-inset-top);
            }
            ${isInConversation ? `body { overflow: hidden; }` : ''}
          `}</style>

        {!isInConversation && (
          <header
            className={cn(
              'fixed top-0 left-0 right-0 z-50 transition-all duration-200 hidden lg:block',
              scrolled ? 'bg-white shadow-md' : 'bg-white'
            )}
          >
            <div className='max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-12'>
              <div className='flex items-center justify-between h-16'>
                <div className='flex items-center gap-3 min-w-0 flex-1'>
                  {shouldShowBackButton() && (
                    <button
                      onClick={handleBackClick}
                      className='flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors group flex-shrink-0'
                      aria-label='Go back'
                      type='button'
                    >
                      <ChevronLeft
                        className={cn(
                          'w-5 h-5 text-gray-700 group-hover:text-gray-900',
                          language === 'ar' && 'rotate-180'
                        )}
                      />
                    </button>
                  )}
                  <Link
                    to={
                      isOfficeOnly
                        ? createPageUrl('OfficeDashboard')
                        : isHost
                          ? createPageUrl('HostDashboard')
                          : createPageUrl('Home')
                    }
                    className='flex items-center gap-3 group min-w-0'
                    aria-label='SAWA Homepage'
                  >
                    <div className='relative flex-shrink-0'>
                      <div className='w-10 h-10 rounded-2xl overflow-hidden shadow-lg group-hover:shadow-xl transition-all'>
                        <img
                          src='https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e8bf2aebfc9660599d11a9/e62457e5e_WhatsAppImage2025-10-16at235513_248ceca9.jpg'
                          alt='SAWA'
                          className='w-full h-full object-cover'
                          loading='eager'
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/40x40/330066/FFFFFF?text=S';
                          }}
                        />
                      </div>
                    </div>
                    <div className='hidden sm:block min-w-0'>
                      <span className='text-xl sm:text-2xl font-bold bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] bg-clip-text text-transparent truncate'>
                        SAWA
                      </span>
                      {isHost && (
                        <span className='mx-2 text-xs sm:text-sm font-medium text-gray-600'>
                          • Host
                        </span>
                      )}
                      {isOfficeOnly && (
                        <span className='mx-2 text-xs sm:text-sm font-medium text-gray-600'>
                          • Office Manager
                        </span>
                      )}
                      {hasAdminRole && (
                        <span className='mx-2 text-xs sm:text-sm font-medium text-red-600'>
                          • Admin
                        </span>
                      )}
                    </div>
                  </Link>
                </div>

                <nav className='hidden lg:flex items-center gap-1' aria-label='Main navigation'>
                  <DesktopNav
                    isHost={isHost}
                    isOfficeOnly={isOfficeOnly}
                    hasAdminRole={hasAdminRole}
                    isActivePage={isActivePage}
                    createPageUrl={createPageUrl}
                    t={t}
                    location={location}
                    officeDashboardBaseUrl={officeDashboardBaseUrl}
                    adminDashboardBaseUrl={adminDashboardBaseUrl}
                  />
                </nav>

                <div className='flex items-center gap-3 flex-shrink-0'>
                  {showLoadingSkeleton ? (
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-gray-100 rounded-full animate-pulse' />
                      <div className='w-10 h-10 bg-gray-100 rounded-full animate-pulse' />
                      <div className='w-32 h-10 bg-gray-100 rounded-full animate-pulse' />
                    </div>
                  ) : user ? (
                    <>
                      <NotificationBell className='w-10 h-10' />
                      <MessagesBadge />
                      {!isHost && !isOfficeOnly && !isMarketing && (
                        <Link to={createPageUrl('MyOffers')} className='hidden lg:block'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='rounded-full w-10 h-10 hover:bg-gray-100 transition-colors'
                          >
                            <Briefcase className='w-5 h-5 text-gray-700' />
                          </Button>
                        </Link>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            className='flex items-center gap-2 h-10 px-2 pr-3 rounded-full hover:shadow-md transition-all border border-gray-300 hover:shadow-gray-300'
                          >
                            <Menu className='w-4 h-4 text-gray-700 flex-shrink-0' />
                            <div className='relative group flex-shrink-0'>
                              {user.profile_photo && user.profile_photo.startsWith('http') ? (
                                <img
                                  src={user.profile_photo}
                                  alt={user.full_name || 'Profile'}
                                  className='w-8 h-8 rounded-full object-cover border-2 border-[var(--brand-primary)] group-hover:border-[var(--brand-secondary)] transition-all'
                                />
                              ) : (
                                <div className='w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center text-sm font-bold group-hover:scale-110 transition-transform'>
                                  {(
                                    (user.full_name || user.email || 'U').charAt(0) || ''
                                  ).toUpperCase()}
                                </div>
                              )}
                              <div className='absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center'>
                                <User className='w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity' />
                              </div>
                            </div>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align='end'
                          className='w-64 bg-white shadow-xl border border-gray-200 rounded-2xl p-2 mt-2'
                        >
                          <div className='px-4 py-3 border-b border-gray-100'>
                            <p className='text-sm font-bold text-gray-900 truncate'>
                              {user.full_name || 'User'}
                            </p>
                            <p className='text-xs text-gray-500 truncate'>{user.email || ''}</p>
                            {isHost && (
                              <p className='text-xs text-[var(--brand-primary)] font-semibold mt-1'>
                                🏢 Host
                              </p>
                            )}
                            {isOfficeOnly && (
                              <p className='text-xs text-[var(--brand-primary)] font-semibold mt-1'>
                                🏢 Office Manager
                              </p>
                            )}
                            {hasAdminRole && (
                              <p className='text-xs text-red-600 font-semibold mt-1'>⚙️ Admin</p>
                            )}
                            {isMarketing && (
                              <p className='text-xs text-purple-600 font-semibold mt-1'>
                                Marketing
                              </p>
                            )}
                          </div>
                          <DropdownMenuItem asChild>
                            <Link
                              to={createPageUrl('UserProfile')}
                              className='cursor-pointer flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 rounded-lg'
                            >
                              <User className='w-4 h-4' />
                              <span className='text-sm font-medium'>
                                {t('userMenu.my_profile')}
                              </span>
                            </Link>
                          </DropdownMenuItem>

                          {hasAdminRole && (
                            <DropdownMenuItem asChild>
                              <Link
                                to={createPageUrl('AdminDashboard')}
                                className='cursor-pointer flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 rounded-lg'
                              >
                                <LayoutDashboard className='w-4 h-4' />
                                <span className='text-sm font-medium'>
                                  {t('userMenu.admin_panel')}
                                </span>
                              </Link>
                            </DropdownMenuItem>
                          )}

                          {isMarketing && (
                            <DropdownMenuItem asChild>
                              <Link
                                to={createPageUrl('MarketingDashboard')}
                                className='cursor-pointer flex items-center gap-3 px-4 py-2.5 hover:bg-purple-50 rounded-lg'
                              >
                                <BarChart3 className='w-4 h-4 text-purple-600' />
                                <span className='text-sm font-medium text-purple-600'>
                                  Marketing Dashboard
                                </span>
                              </Link>
                            </DropdownMenuItem>
                          )}

                          {isOfficeOnly && (
                            <DropdownMenuItem asChild>
                              <Link
                                to={createPageUrl('OfficeDashboard')}
                                className='cursor-pointer flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 rounded-lg'
                              >
                                <LayoutDashboard className='w-4 h-4' />
                                <span className='text-sm font-medium'>
                                  {t('userMenu.office_dashboard')}
                                </span>
                              </Link>
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator className='my-2' />
                          <DropdownMenuItem
                            onClick={handleLogout}
                            className='cursor-pointer text-red-600 flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 rounded-lg'
                          >
                            <LogOut className='w-4 h-4' />
                            <span className='text-sm font-semibold'>{t('userMenu.logout')}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant='ghost'
                          className='flex items-center gap-2 h-10 px-2 pr-3 rounded-full hover:shadow-md transition-all border border-gray-300 hover:shadow-gray-300'
                        >
                          <Menu className='w-4 h-4 text-gray-700 flex-shrink-0' />
                          <div className='w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0'>
                            <User className='w-5 h-5 text-gray-600' />
                          </div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align='end'
                        className='w-56 bg-white shadow-xl border border-gray-200 rounded-2xl p-2 mt-2'
                      >
                        <DropdownMenuItem
                          onClick={openLoginModal}
                          className='cursor-pointer flex items-center gap-3 px-4 py-3 hover:bg-[var(--brand-bg-accent-light)] rounded-lg'
                        >
                          <User className='w-5 h-5 text-[var(--brand-primary)]' />
                          <span className='text-sm font-semibold text-[var(--brand-primary)]'>
                            {t('auth.login')}
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className='my-2' />
                        <DropdownMenuItem
                          onClick={openSignupModal}
                          className='cursor-pointer bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white flex items-center gap-3 px-4 py-3 rounded-lg hover:opacity-90'
                        >
                          <User className='w-5 h-5' />
                          <span className='text-sm font-semibold'>{t('auth.signup')}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>
          </header>
        )}

        {!isInConversation && (
          <header className='lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm safe-area-top'>
            <div className='flex items-center justify-between h-16 px-3'>
              <div className='flex items-center gap-1'>
                {shouldShowBackButton() && (
                  <button
                    onClick={handleBackClick}
                    className='flex items-center justify-center w-12 h-12 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors flex-shrink-0'
                    aria-label='Go back'
                    type='button'
                  >
                    <ChevronLeft
                      className={cn('w-8 h-8 text-gray-900', language === 'ar' && 'rotate-180')}
                    />
                  </button>
                )}

                <Link to={createPageUrl('Home')} className='flex items-center gap-2'>
                  <img
                    src='https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e8bf2aebfc9660599d11a9/e62457e5e_WhatsAppImage2025-10-16at235513_248ceca9.jpg'
                    alt='SAWA'
                    className='w-10 h-10 rounded-lg'
                    loading='eager'
                  />
                  <span className='text-xl font-bold bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] bg-clip-text text-transparent'>
                    SAWA
                  </span>
                </Link>
              </div>

              <div className='flex items-center gap-3'>
                {showLoadingSkeleton ? (
                  <div className='w-32 h-10 bg-gray-100 rounded-full animate-pulse' />
                ) : user ? (
                  <>
                    {isHost && !hasAdminRole && (
                      <Link to={createPageUrl('HostDashboard')}>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='rounded-full w-10 h-10 hover:bg-blue-50 transition-colors'
                          aria-label='Host Dashboard'
                        >
                          <LayoutDashboard className='w-5 h-5 text-blue-600' />
                        </Button>
                      </Link>
                    )}

                    {isOfficeOnly && (
                      <Link to={createPageUrl('OfficeDashboard')}>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='rounded-full w-10 h-10 hover:bg-indigo-50 transition-colors'
                          aria-label='Office Dashboard'
                        >
                          <LayoutDashboard className='w-5 h-5 text-indigo-600' />
                        </Button>
                      </Link>
                    )}

                    <Link to={createPageUrl('Destinations')}>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='rounded-full w-10 h-10 hover:bg-gray-100 transition-colors'
                        aria-label='Destinations'
                      >
                        <MapPin className='w-5 h-5 text-gray-700' />
                      </Button>
                    </Link>

                    {!isHost && !isOfficeOnly && !isMarketing && (
                      <Link to={createPageUrl('MyOffers')}>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='rounded-full w-10 h-10 hover:bg-gray-100 transition-colors'
                          aria-label='My Trips'
                        >
                          <Briefcase className='w-5 h-5 text-gray-700' />
                        </Button>
                      </Link>
                    )}

                    <MessagesBadge />

                    <NotificationBell className='w-10 h-10' />

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='rounded-full w-10 h-10 hover:bg-gray-100 transition-colors p-0'
                          aria-label='Profile menu'
                        >
                          {user.profile_photo && user.profile_photo.startsWith('http') ? (
                            <img
                              src={user.profile_photo}
                              alt={user.full_name || 'Profile'}
                              className='w-8 h-8 rounded-full object-cover border-2 border-purple-200'
                            />
                          ) : (
                            <div className='w-8 h-8 rounded-full bg-gradient-to-br from-[#9933CC] to-[#7C3AED] flex items-center justify-center text-sm font-bold'>
                              {(
                                (user.full_name || user.email || 'U').charAt(0) || ''
                              ).toUpperCase()}
                            </div>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align='end'
                        className='w-56 bg-white shadow-xl border border-gray-200 rounded-xl p-2 mt-2'
                      >
                        <div className='px-3 py-2 border-b border-gray-100'>
                          <p className='text-sm font-bold text-gray-900 truncate'>
                            {user.full_name || 'User'}
                          </p>
                          <p className='text-xs text-gray-500 truncate'>{user.email || ''}</p>
                        </div>

                        <DropdownMenuItem asChild>
                          <Link
                            to={createPageUrl('UserProfile')}
                            className='cursor-pointer flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg'
                          >
                            <User className='w-4 h-4' />
                            <span className='text-sm font-medium'>Profile</span>
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                          <Link
                            to={createPageUrl('ForumHome')}
                            className='cursor-pointer flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg'
                          >
                            <Users className='w-4 h-4' />
                            <span className='text-sm font-medium'>Community</span>
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                          <Link
                            to={createPageUrl('About')}
                            className='cursor-pointer flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg'
                          >
                            <Info className='w-4 h-4' />
                            <span className='text-sm font-medium'>About</span>
                          </Link>
                        </DropdownMenuItem>

                        {hasAdminRole && (
                          <DropdownMenuItem asChild>
                            <Link
                              to={createPageUrl('AdminDashboard')}
                              className='cursor-pointer flex items-center gap-3 px-3 py-2 hover:bg-purple-50 rounded-lg'
                            >
                              <LayoutDashboard className='w-4 h-4 text-purple-600' />
                              <span className='text-sm font-medium text-purple-600'>
                                Admin Panel
                              </span>
                            </Link>
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator className='my-1' />

                        <DropdownMenuItem
                          onClick={handleLogout}
                          className='cursor-pointer text-red-600 flex items-center gap-3 px-3 py-2 hover:bg-red-50 rounded-lg'
                        >
                          <LogOut className='w-4 h-4' />
                          <span className='text-sm font-semibold'>Logout</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <>
                    <Link to={createPageUrl('Destinations')}>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='rounded-full w-10 h-10 hover:bg-gray-100 transition-colors'
                        aria-label='Destinations'
                      >
                        <MapPin className='w-5 h-5 text-gray-700' />
                      </Button>
                    </Link>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant='ghost'
                          className='flex items-center gap-2 h-10 px-2 pr-3 rounded-full hover:shadow-md transition-all border border-gray-300'
                        >
                          <Menu className='w-4 h-4 text-gray-700' />
                          <div className='w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center'>
                            <User className='w-5 h-5 text-gray-600' />
                          </div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align='end'
                        className='w-56 bg-white shadow-xl border border-gray-200 rounded-2xl p-2 mt-2'
                      >
                        <DropdownMenuItem asChild>
                          <Link
                            to={createPageUrl('ForumHome')}
                            className='cursor-pointer flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg'
                          >
                            <Users className='w-5 h-5 text-gray-700' />
                            <span className='text-sm font-medium'>Community</span>
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className='my-2' />

                        <DropdownMenuItem
                          onClick={openLoginModal}
                          className='cursor-pointer flex items-center gap-3 px-4 py-3 hover:bg-[var(--brand-bg-accent-light)] rounded-lg'
                        >
                          <User className='w-5 h-5 text-[var(--brand-primary)]' />
                          <span className='text-sm font-semibold text-[var(--brand-primary)]'>
                            {t('auth.login')}
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className='my-2' />
                        <DropdownMenuItem
                          onClick={openSignupModal}
                          className='cursor-pointer bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white flex items-center gap-3 px-4 py-3 rounded-lg hover:opacity-90'
                        >
                          <User className='w-5 h-5' />
                          <span className='text-sm font-semibold'>{t('auth.signup')}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            </div>
          </header>
        )}

        <main
          className={cn(
            isInConversation ? '' : 'lg:pt-16',
            isInConversation ? '' : 'pt-[calc(4rem+env(safe-area-inset-bottom))]',
            'pb-8 lg:pb-0'
          )}
        >
          {children}
        </main>

        {!hideFooter && !isInConversation && !isHost && !isOfficeOnly && (
          <footer className='hidden lg:block bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-300 mt-16'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
              <div className='grid grid-cols-1 md:grid-cols-4 gap-8 mb-8'>
                <div className='md:col-span-1'>
                  <p className='text-sm text-gray-400 leading-relaxed'>
                    Discover unique local experiences and accommodations.
                  </p>
                </div>
                <div>
                  <h3 className='font-semibold text-white mb-4'>Company</h3>
                  <ul className='space-y-2'>
                    <li>
                      <Link
                        to={createPageUrl('About')}
                        className='hover:text-white transition-colors text-sm'
                      >
                        About Us
                      </Link>
                    </li>
                    <li>
                      <a
                        href={`${createPageUrl('Home')}#services-section`}
                        className='hover:text-white transition-colors text-sm'
                      >
                        Services
                      </a>
                    </li>
                    <li>
                      <Link
                        to={createPageUrl('BecomeAHost')}
                        className='hover:text-white transition-colors text-sm'
                      >
                        Become a Host
                      </Link>
                    </li>
                    <li>
                      <Link
                        to={createPageUrl('Partner')}
                        className='hover:text-white transition-colors text-sm'
                      >
                        Partners
                      </Link>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className='font-semibold text-white mb-4'>Support</h3>
                  <ul className='space-y-2'>
                    <li>
                      <Link
                        to={createPageUrl('CommunityGuidelines')}
                        className='hover:text-white transition-colors text-sm'
                      >
                        Community Guidelines
                      </Link>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className='font-semibold text-white mb-4'>Legal</h3>
                  <ul className='space-y-2'>
                    <li>
                      <Link
                        to={createPageUrl('CookiePolicy')}
                        className='hover:text-white transition-colors text-sm'
                      >
                        Cookie Policy
                      </Link>
                    </li>
                    <li>
                      <Link
                        to={createPageUrl('PrivacyPolicy')}
                        className='hover:text-white transition-colors text-sm'
                      >
                        Privacy Policy
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className='border-t border-gray-700 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center'>
                <p className='text-sm text-gray-400 mb-4 sm:mb-0'>
                  © 2024 SAWA. All rights reserved.
                </p>
                <div className='flex items-center gap-4'>
                  <a
                    href='https://www.youtube.com/@sawaapp_io'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-gray-400 hover:text-white transition-all duration-300'
                    aria-label='Visit SAWA on YouTube'
                  >
                    <Youtube className='w-6 h-6' />
                  </a>
                  <a
                    href='https://www.instagram.com/travel_sawaapp/#'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-gray-400 hover:text-white transition-all duration-300'
                    aria-label='Visit SAWA on Instagram'
                  >
                    <Instagram className='w-6 h-6' />
                  </a>
                </div>
              </div>
            </div>
          </footer>
        )}

        <ChatLauncher />
        <NotificationPrompt />
        <NotificationWelcomePrompt />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          defaultTab={authModalTab}
        />
      </div>
    </>
  );
});

AppContent.displayName = 'AppContent';

export default function Layout({ children, currentPageName }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <LanguageProvider>
            <FCMProvider>
              <AppContent currentPageName={currentPageName}>{children}</AppContent>
            </FCMProvider>
          </LanguageProvider>
        </AppProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
