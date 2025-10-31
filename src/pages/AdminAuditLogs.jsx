import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '../components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Calendar, User, Loader2, Filter } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminAuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 100),
    refetchInterval: 10000,
  });

  const actionTypes = [
    'all',
    'status_changed',
    'price_updated',
    'host_reassigned',
    'approve_host',
    'revoke_host',
    'make_admin',
    'revoke_admin',
    'agency_created',
    'agency_updated',
    'permissions_updated'
  ];

  const getActionColor = (action) => {
    const colors = {
      approve_host: 'bg-green-100 text-green-800',
      revoke_host: 'bg-red-100 text-red-800',
      make_admin: 'bg-purple-100 text-purple-800',
      revoke_admin: 'bg-orange-100 text-orange-800',
      status_changed: 'bg-blue-100 text-blue-800',
      price_updated: 'bg-yellow-100 text-yellow-800',
      host_reassigned: 'bg-indigo-100 text-indigo-800',
      agency_created: 'bg-emerald-100 text-emerald-800',
      agency_updated: 'bg-cyan-100 text-cyan-800',
      permissions_updated: 'bg-pink-100 text-pink-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const formatAction = (action) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.admin_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.affected_user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterAction === 'all' || log.action === filterAction;
    
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-2xl">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-3">
              <FileText className="w-8 h-8" />
              Audit Logs ({logs.length})
            </CardTitle>
            <p className="text-white/90 mt-2">
              Track all administrative actions and system changes
            </p>
          </CardHeader>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by admin or affected user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="relative w-full md:w-64">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none appearance-none bg-white"
                >
                  {actionTypes.map(action => (
                    <option key={action} value={action}>
                      {action === 'all' ? 'All Actions' : formatAction(action)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <div className="space-y-3">
          {filteredLogs.map(log => {
            let details = null;
            try {
              details = log.details ? JSON.parse(log.details) : null;
            } catch (e) {
              details = null;
            }

            return (
              <Card key={log.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row gap-4 justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge className={getActionColor(log.action)}>
                          {formatAction(log.action)}
                        </Badge>
                        {log.created_date && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(log.created_date), 'MMM d, yyyy - h:mm a')}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">Admin:</span>
                          <span>{log.admin_email}</span>
                        </div>

                        {log.affected_user_email && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">Affected User:</span>
                            <span>{log.affected_user_email}</span>
                          </div>
                        )}

                        {log.notes && (
                          <div className="bg-gray-50 p-2 rounded-lg mt-2 text-gray-600 italic">
                            "{log.notes}"
                          </div>
                        )}

                        {details && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs text-purple-600 hover:text-purple-700 font-medium">
                              View Details
                            </summary>
                            <pre className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-700 overflow-x-auto border border-gray-200">
                              {JSON.stringify(details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredLogs.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No logs found</h3>
                <p className="text-gray-600">
                  {searchTerm || filterAction !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Audit logs will appear here as actions are performed'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}