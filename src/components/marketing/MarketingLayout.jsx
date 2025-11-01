import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Brain,
  BarChart3,
  Activity,
  Settings,
  Sparkles,
  TrendingUp,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMarketingAuth } from './MarketingGuard';

export default function MarketingLayout({ children }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { user } = useMarketingAuth();

  const menuItems = [
    {
      name: 'Dashboard',
      page: 'MarketingDashboard',
      icon: <LayoutDashboard className='w-5 h-5' />,
    },
    {
      name: 'Reports',
      page: 'MarketingReports',
      icon: <FileText className='w-5 h-5' />,
    },
    {
      name: 'AI Insights',
      page: 'MarketingAIInsights',
      icon: <Brain className='w-5 h-5' />,
    },
    {
      name: 'Analytics',
      page: 'MarketingAnalytics',
      icon: <BarChart3 className='w-5 h-5' />,
    },
    {
      name: 'Smart Campaigns',
      page: 'SmartCampaigns',
      icon: <Sparkles className='w-5 h-5' />,
    },
    {
      name: 'Growth Plan',
      page: 'SmartGrowthPlan',
      icon: <TrendingUp className='w-5 h-5' />,
    },
    {
      name: 'Logs',
      page: 'MarketingLogs',
      icon: <Activity className='w-5 h-5' />,
    },
    {
      name: 'Settings',
      page: 'MarketingSettings',
      icon: <Settings className='w-5 h-5' />,
    },
  ];

  const isActivePage = (pageName) => {
    return location.pathname === createPageUrl(pageName);
  };

  return (
    <div className='flex min-h-screen bg-gray-50'>
      {/* Desktop Sidebar */}
      <aside className='hidden lg:block w-64 bg-white border-r border-gray-200 sticky top-0 h-screen overflow-y-auto'>
        <div className='p-6 border-b border-gray-200'>
          <h2 className='text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>
            SAWA Marketing
          </h2>
          <p className='text-sm text-gray-600 mt-1'>Intelligence Hub</p>
        </div>

        <nav className='p-4 space-y-2'>
          {menuItems.map((item) => (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                isActivePage(item.page)
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              {item.icon}
              <span className='font-medium'>{item.name}</span>
            </Link>
          ))}
        </nav>

        {user && (
          <div className='p-4 border-t border-gray-200 mt-auto'>
            <p className='text-xs text-gray-600 mb-1'>Logged in as</p>
            <p className='text-sm font-semibold text-gray-900 truncate'>
              {user.full_name || user.email}
            </p>
          </div>
        )}
      </aside>

      {/* Mobile Header */}
      <div className='lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>
            SAWA Marketing
          </h2>
          <Button variant='ghost' size='icon' onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className='w-6 h-6' /> : <Menu className='w-6 h-6' />}
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div
            className='lg:hidden fixed inset-0 bg-black/50 z-40'
            onClick={() => setSidebarOpen(false)}
          />
          <aside className='lg:hidden fixed top-14 left-0 bottom-0 w-64 bg-white z-40 overflow-y-auto'>
            <nav className='p-4 space-y-2'>
              {menuItems.map((item) => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                    isActivePage(item.page)
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  {item.icon}
                  <span className='font-medium'>{item.name}</span>
                </Link>
              ))}
            </nav>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className='flex-1 p-4 lg:p-8 pt-20 lg:pt-8'>{children}</main>
    </div>
  );
}
