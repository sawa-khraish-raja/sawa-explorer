import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MarketingLayout from '../components/marketing/MarketingLayout';
import MarketingGuard from '../components/marketing/MarketingGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Download,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Loader2,
  Sparkles,
  BarChart3,
  Target,
  Brain,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function MarketingReports() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [generatingReport, setGeneratingReport] = useState(null);

  // ✅ Fetch all reports
  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['all_ai_reports'],
    queryFn: async () => {
      try {
        const allReports = await base44.entities.AIReports.list('-created_date', 20);
        return allReports || [];
      } catch (error) {
        console.error('Failed to fetch reports:', error);
        return [];
      }
    },
    refetchInterval: 30000,
    retry: 1
  });

  // ✅ Fetch sync data for stats
  const { data: syncData } = useQuery({
    queryKey: ['marketing_sync_reports'],
    queryFn: async () => {
      try {
        const meta = await base44.entities.SystemMeta.filter({ key: 'marketing_last_sync' });
        if (meta && meta.length > 0) {
          return JSON.parse(meta[0].value);
        }
        return null;
      } catch (error) {
        return null;
      }
    },
    staleTime: 60000,
  });

  // ✅ Generate Report Mutation - WITH REPORT TYPE
  const generateReportMutation = useMutation({
    mutationFn: async (reportType) => {
      setGeneratingReport(reportType.id);
      
      // ✅ Pass report type to function
      const response = await base44.functions.invoke('AI_Analyze_Data_V2', {
        report_type: reportType.id,
        report_title: reportType.title,
        report_focus: reportType.focus
      });
      
      if (!response?.data?.ok) {
        throw new Error(response?.data?.error || 'Report generation failed');
      }
      
      return { ...response.data, reportType: reportType.id };
    },
    onSuccess: (data, reportType) => {
      queryClient.invalidateQueries({ queryKey: ['all_ai_reports'] });
      toast.success(`${reportType.title} Generated!`, {
        description: `Completed in ${(data.duration_ms / 1000).toFixed(1)}s`,
        duration: 4000
      });
    },
    onError: (error, reportType) => {
      console.error('Report generation error:', error);
      toast.error('Generation Failed', {
        description: error.message || 'Please try again'
      });
    },
    onSettled: () => {
      setGeneratingReport(null);
    }
  });

  const reportTypes = [
    {
      id: 'user_growth',
      icon: Users,
      title: 'User Growth Report',
      description: 'Detailed analysis of user acquisition and growth trends over time',
      color: 'from-blue-600 to-cyan-600',
      badge: 'Growth',
      focus: 'user_acquisition_retention_growth_trends'
    },
    {
      id: 'booking_analytics',
      icon: Calendar,
      title: 'Booking Analytics',
      description: 'Complete booking statistics, conversion rates, and revenue trends',
      color: 'from-purple-600 to-pink-600',
      badge: 'Analytics',
      focus: 'booking_conversion_revenue_trends'
    },
    {
      id: 'revenue_report',
      icon: DollarSign,
      title: 'Revenue Report',
      description: 'Financial overview, revenue breakdown by city, and commission analysis',
      color: 'from-green-600 to-emerald-600',
      badge: 'Revenue',
      focus: 'revenue_commission_financial_breakdown'
    },
    {
      id: 'marketing_insights',
      icon: Target,
      title: 'Marketing Insights',
      description: 'AI-powered insights on audience behavior, campaigns, and content strategy',
      color: 'from-orange-600 to-red-600',
      badge: 'AI Insights',
      focus: 'audience_behavior_campaign_optimization'
    },
    {
      id: 'audience_report',
      icon: Brain,
      title: 'Audience Intelligence',
      description: 'Deep dive into user personas, engagement patterns, and retention metrics',
      color: 'from-indigo-600 to-purple-600',
      badge: 'Personas',
      focus: 'persona_segmentation_engagement_patterns'
    },
    {
      id: 'content_suggestions',
      icon: Sparkles,
      title: 'Content Strategy',
      description: 'AI-generated content ideas, campaign suggestions, and marketing copy',
      color: 'from-pink-600 to-rose-600',
      badge: 'AI Content',
      focus: 'content_ideas_social_media_campaigns'
    }
  ];

  // ✅ View Report
  const viewReport = (report) => {
    navigate(createPageUrl('ReportView') + `?id=${report.id}`);
  };

  if (reportsLoading) {
    return (
      <MarketingGuard>
        <MarketingLayout>
          <div className="flex flex-col justify-center items-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-4" />
            <p className="text-gray-600">Loading reports...</p>
          </div>
        </MarketingLayout>
      </MarketingGuard>
    );
  }

  const stats = syncData?.analytics || {};
  const totalUsers = stats.users?.total_users || 0;
  const totalBookings = stats.bookings?.total_bookings || 0;
  const totalRevenue = stats.bookings?.total_revenue || 0;

  return (
    <MarketingGuard>
      <MarketingLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-6 md:p-8 text-white shadow-xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <FileText className="w-8 h-8 md:w-10 md:h-10" />
              Reports & Insights
            </h1>
            <p className="text-purple-100 text-base md:text-lg mb-4">
              Generate comprehensive reports and AI-powered marketing insights
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-white/80 text-xs mb-1">Platform Users</p>
                <p className="text-2xl font-bold">{totalUsers.toLocaleString()}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-white/80 text-xs mb-1">Total Bookings</p>
                <p className="text-2xl font-bold">{totalBookings.toLocaleString()}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-white/80 text-xs mb-1">Total Revenue</p>
                <p className="text-2xl font-bold">${(totalRevenue / 1000).toFixed(1)}k</p>
              </div>
            </div>
          </div>

          {/* Report Types Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reportTypes.map((reportType) => {
              const Icon = reportType.icon;
              const isGenerating = generatingReport === reportType.id;
              
              return (
                <Card 
                  key={reportType.id}
                  className="border-2 border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  <CardHeader className={`bg-gradient-to-r ${reportType.color} text-white rounded-t-lg`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                          <Icon className="w-7 h-7" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{reportType.title}</CardTitle>
                          <Badge className="mt-1 bg-white/20 text-white border-0">
                            {reportType.badge}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                      {reportType.description}
                    </p>
                    
                    <Button
                      onClick={() => generateReportMutation.mutate(reportType)}
                      disabled={isGenerating}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Report
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Reports */}
          {reports.length > 0 && (
            <Card className="border-2 border-gray-200">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-gray-700" />
                  Recent Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {reports.slice(0, 10).map((report) => (
                    <div
                      key={report.id}
                      onClick={() => viewReport(report)}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:shadow-md transition-all cursor-pointer hover:scale-[1.01]"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {report.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-gray-600">
                              {format(new Date(report.created_date), 'MMM dd, yyyy • HH:mm')}
                            </p>
                            {report.status === 'generated' && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Ready
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewReport(report);
                        }}
                        variant="outline"
                        size="sm"
                        className="ml-4 flex-shrink-0"
                      >
                        View Report
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {reports.length === 0 && (
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-12 text-center">
                <FileText className="w-20 h-20 text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No Reports Yet</h3>
                <p className="text-gray-700 mb-6">
                  Generate your first AI-powered report to get insights about your platform
                </p>
                <Button
                  onClick={() => generateReportMutation.mutate(reportTypes[0])}
                  disabled={generatingReport !== null}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                >
                  {generatingReport ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate First Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-2">AI-Powered Analysis</h3>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    Our reports use advanced AI to analyze your data and provide actionable insights for:
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>User behavior patterns and engagement metrics</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>Revenue optimization and pricing strategies</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>Marketing campaign recommendations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>Content creation ideas and social media strategy</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </MarketingLayout>
    </MarketingGuard>
  );
}