import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MarketingLayout from '../components/marketing/MarketingLayout';
import MarketingGuard from '../components/marketing/MarketingGuard';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollText, Loader2, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function MarketingLogs() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['marketing_logs'],
    queryFn: async () => {
      const allLogs = await base44.entities.AuditLog.filter({
        action: 'marketing_data_access',
      });
      return allLogs
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
        .slice(0, 100);
    },
  });

  return (
    <MarketingGuard>
      <MarketingLayout>
        <div className='space-y-6'>
          <div className='bg-gradient-to-r from-gray-700 to-gray-900 rounded-2xl p-8 text-white shadow-xl'>
            <h1 className='text-4xl font-bold mb-2 flex items-center gap-3'>
              <ScrollText className='w-10 h-10' />
              Access Logs
            </h1>
            <p className='text-gray-300 text-lg'>Audit trail of all marketing data access</p>
          </div>

          {isLoading ? (
            <div className='flex justify-center py-12'>
              <Loader2 className='w-8 h-8 animate-spin text-purple-600' />
            </div>
          ) : (
            <Card className='shadow-xl'>
              <CardContent className='p-0'>
                <div className='divide-y divide-gray-200'>
                  {logs.length > 0 ? (
                    logs.map((log) => {
                      const details = JSON.parse(log.details || '{}');
                      return (
                        <div key={log.id} className='p-4 hover:bg-gray-50 transition-colors'>
                          <div className='flex items-start gap-4'>
                            <div className='w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0'>
                              <Eye className='w-5 h-5 text-purple-600' />
                            </div>
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center justify-between mb-1'>
                                <p className='font-semibold text-gray-900'>{log.admin_email}</p>
                                <span className='text-sm text-gray-500'>
                                  {format(new Date(log.created_date), 'MMM d, yyyy HH:mm')}
                                </span>
                              </div>
                              <p className='text-sm text-gray-600'>
                                Action:{' '}
                                <span className='font-medium'>{details.action || 'N/A'}</span>
                                {details.entity && (
                                  <>
                                    {' '}
                                    • Entity: <span className='font-medium'>{details.entity}</span>
                                  </>
                                )}
                              </p>
                              {details.filters && (
                                <p className='text-xs text-gray-500 mt-1'>
                                  Filters: {JSON.stringify(details.filters)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className='p-12 text-center'>
                      <ScrollText className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                      <p className='text-gray-600'>No access logs yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </MarketingLayout>
    </MarketingGuard>
  );
}
