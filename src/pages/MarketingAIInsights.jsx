import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Brain,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  RefreshCw,
  Users,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { getAllDocuments } from '@/utils/firestore';
import { invokeFunction } from '@/utils/functions';

import MarketingGuard from '@/shared/components/marketing/MarketingGuard';
import MarketingLayout from '@/shared/components/marketing/MarketingLayout';

export default function MarketingAIInsights() {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzingAudience, setIsAnalyzingAudience] = useState(false);

  const { data: latestReport, isLoading: reportsLoading } = useQuery({
    queryKey: ['latest_ai_report'],
    queryFn: async () => {
      try {
        const reports = await getAllDocuments('ai_reports', '-created_date', 1);
        return reports && reports.length > 0 ? reports[0] : null;
      } catch (error) {
        console.error('Failed to fetch AI reports:', error);
        return null;
      }
    },
    refetchInterval: 30000,
    retry: 1,
  });

  const { data: personas = [] } = useQuery({
    queryKey: ['marketing_personas'],
    queryFn: async () => {
      try {
        const allPersonas = await getAllDocuments('marketing_personas', '-user_count', 10);
        return allPersonas || [];
      } catch (error) {
        console.error('Failed to fetch personas:', error);
        return [];
      }
    },
    refetchInterval: 30000,
    retry: 1,
  });

  const { data: jobLogs = [] } = useQuery({
    queryKey: ['ai_jobs_log'],
    queryFn: async () => {
      try {
        const logs = await getAllDocuments('ai_jobs_log', '-created_date', 10);
        return logs || [];
      } catch (error) {
        console.error('Failed to fetch job logs:', error);
        return [];
      }
    },
    refetchInterval: 15000,
    retry: 1,
  });

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      const response = await invokeFunction('AI_Analyze_Data_V2', {});

      if (!response?.data?.ok) {
        throw new Error(response?.data?.error || 'Report generation failed');
      }

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['latest_ai_report'] });
      queryClient.invalidateQueries({ queryKey: ['ai_jobs_log'] });
      toast.success('AI Report Generated!', {
        description: `Analysis completed in ${(data.duration_ms / 1000).toFixed(1)}s`,
      });
    },
    onError: (error) => {
      console.error('Report generation error:', error);
      toast.error('Generation Failed', {
        description: error.message || 'Please try again',
      });
    },
    onSettled: () => {
      setIsGenerating(false);
    },
  });

  const analyzeAudienceMutation = useMutation({
    mutationFn: async () => {
      setIsAnalyzingAudience(true);
      const response = await invokeFunction('AI_Audience_Intelligence', {});

      if (!response?.data?.ok) {
        throw new Error(response?.data?.error || 'Audience analysis failed');
      }

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['audience_analytics'] });
      queryClient.invalidateQueries({ queryKey: ['marketing_personas'] });
      toast.success('Audience Analysis completed!', {
        description: `Analyzed ${data.users_analyzed} users, created ${data.personas_created} personas`,
      });
    },
    onError: (error) => {
      console.error('Audience analysis error:', error);
      toast.error('Analysis Failed', {
        description: error.message || 'Please try again',
      });
    },
    onSettled: () => {
      setIsAnalyzingAudience(false);
    },
  });

  const getTrendIcon = (direction) => {
    if (direction === 'up') return <TrendingUp className='w-4 h-4 text-green-600' />;
    if (direction === 'down') return <TrendingDown className='w-4 h-4 text-red-600' />;
    return <Minus className='w-4 h-4 text-gray-600' />;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendBadgeClass = (direction) => {
    if (direction === 'up') return 'bg-green-100 text-green-800';
    if (direction === 'down') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (reportsLoading) {
    return (
      <MarketingGuard>
        <MarketingLayout>
          <div className='flex flex-col justify-center items-center h-96'>
            <Loader2 className='w-8 h-8 animate-spin text-purple-600 mb-4' />
            <p className='text-gray-600'>Loading AI insights...</p>
          </div>
        </MarketingLayout>
      </MarketingGuard>
    );
  }

  const totalUsers = personas.reduce((sum, p) => sum + (p.user_count || 0), 0);

  return (
    <MarketingGuard>
      <MarketingLayout>
        <div className='space-y-6'>
          <div className='bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 md:p-8 text-white shadow-xl'>
            <div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-4'>
              <div>
                <h1 className='text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3'>
                  <Brain className='w-8 h-8 md:w-10 md:h-10' />
                  AI Insights Hub
                </h1>
                <p className='text-purple-100 text-base md:text-lg'>
                  Intelligent analytics powered by advanced AI
                </p>
              </div>
              <div className='flex gap-2 w-full md:w-auto flex-wrap'>
                <Button
                  onClick={() => analyzeAudienceMutation.mutate()}
                  disabled={isAnalyzingAudience}
                  className='bg-white text-purple-600 hover:bg-purple-50 flex-1 md:flex-initial'
                >
                  {isAnalyzingAudience ? (
                    <>
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Users className='w-4 h-4 mr-2' />
                      Analyze Audience
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => generateReportMutation.mutate()}
                  disabled={isGenerating}
                  className='bg-white text-purple-600 hover:bg-purple-50 flex-1 md:flex-initial'
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className='w-4 h-4 mr-2' />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Empty State */}
          {!latestReport && personas.length === 0 && (
            <Card className='border-2 border-orange-200 bg-orange-50'>
              <CardContent className='p-8 text-center'>
                <Brain className='w-16 h-16 text-orange-600 mx-auto mb-4' />
                <h3 className='text-xl font-bold text-gray-900 mb-2'>No AI Analysis Yet</h3>
                <p className='text-gray-700 mb-4'>
                  Get started by syncing data and running AI analysis
                </p>
                <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                  <Button
                    onClick={() => analyzeAudienceMutation.mutate()}
                    disabled={isAnalyzingAudience}
                    className='bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  >
                    {isAnalyzingAudience ? (
                      <>
                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Users className='w-4 h-4 mr-2' />
                        Start Audience Analysis
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audience Overview */}
          {personas.length > 0 && (
            <Card className='border-2 border-indigo-200'>
              <CardHeader className='bg-gradient-to-r from-indigo-50 to-white'>
                <CardTitle className='flex items-center gap-2'>
                  <Users className='w-5 h-5 text-indigo-600' />
                  Audience Overview
                </CardTitle>
              </CardHeader>
              <CardContent className='p-6'>
                <div className='grid grid-cols-2 md:grid-cols-3 gap-4 mb-6'>
                  {personas.slice(0, 6).map((persona) => (
                    <div
                      key={persona.id}
                      className='p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow'
                    >
                      <h4 className='font-semibold text-gray-900 mb-1 text-sm'>
                        {persona.persona_type}
                      </h4>
                      <div className='flex items-baseline gap-2'>
                        <p className='text-2xl font-bold text-indigo-600'>
                          {persona.user_count || 0}
                        </p>
                        <p className='text-xs text-gray-600'>
                          {totalUsers > 0
                            ? ((persona.user_count / totalUsers) * 100).toFixed(0)
                            : 0}
                          %
                        </p>
                      </div>
                      <p className='text-xs text-gray-500 mt-1'>
                        ${persona.avg_spending?.toFixed(0) || 0} avg
                      </p>
                    </div>
                  ))}
                </div>

                <div className='text-center'>
                  <p className='text-sm text-gray-600'>
                    Total users analyzed: <span className='font-bold'>{totalUsers}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI-Generated Personas */}
          {personas.length > 0 && (
            <Card className='border-2 border-pink-200'>
              <CardHeader className='bg-gradient-to-r from-pink-50 to-white'>
                <CardTitle className='flex items-center gap-2'>
                  <Sparkles className='w-5 h-5 text-pink-600' />
                  AI-Generated Personas
                </CardTitle>
              </CardHeader>
              <CardContent className='p-6'>
                <div className='space-y-4'>
                  {personas.slice(0, 3).map((persona) => (
                    <div
                      key={persona.id}
                      className='p-4 bg-gradient-to-br from-pink-50 to-white rounded-lg border-2 border-pink-200 hover:shadow-lg transition-shadow'
                    >
                      <div className='flex items-start justify-between mb-3'>
                        <div>
                          <h4 className='font-bold text-gray-900 text-lg'>
                            {persona.persona_name}
                          </h4>
                          <Badge className='mt-1 bg-pink-100 text-pink-800'>
                            {persona.user_count || 0} users
                          </Badge>
                        </div>
                        <Badge
                          className={`${
                            persona.growth_trend === 'growing'
                              ? 'bg-green-100 text-green-800'
                              : persona.growth_trend === 'declining'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {persona.growth_trend}
                        </Badge>
                      </div>

                      <p className='text-sm text-gray-700 mb-3'>{persona.description}</p>

                      <div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-xs'>
                        <div>
                          <p className='text-gray-600 font-semibold mb-1'>Travel Behavior:</p>
                          <p className='text-gray-700'>{persona.travel_behavior}</p>
                        </div>
                        <div>
                          <p className='text-gray-600 font-semibold mb-1'>Content:</p>
                          <p className='text-gray-700'>{persona.preferred_content}</p>
                        </div>
                      </div>

                      {persona.top_cities && persona.top_cities.length > 0 && (
                        <div className='mt-3 pt-3 border-t border-pink-100'>
                          <p className='text-xs text-gray-600 font-semibold mb-2'>Top Cities:</p>
                          <div className='flex gap-2 flex-wrap'>
                            {persona.top_cities.map((city, idx) => (
                              <Badge key={idx} className='bg-blue-100 text-blue-800 text-xs'>
                                {city}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Latest AI Report */}
          {latestReport && (
            <Card className='border-2 border-blue-200'>
              <CardHeader className='bg-gradient-to-r from-blue-50 to-white'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='flex items-center gap-2'>
                    <FileText className='w-5 h-5 text-blue-600' />
                    Latest AI Report
                  </CardTitle>
                  <Badge className='bg-blue-100 text-blue-800'>
                    <Calendar className='w-3 h-3 mr-1' />
                    {format(new Date(latestReport.created_date), 'MMM dd, HH:mm')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className='p-6'>
                <h3 className='text-xl font-bold text-gray-900 mb-4'>{latestReport.title}</h3>

                {latestReport.summary && (
                  <div className='mb-6'>
                    <h4 className='font-semibold text-gray-900 mb-2'>Executive Summary:</h4>
                    <p className='text-gray-700 text-sm leading-relaxed'>
                      {latestReport.summary.en || latestReport.summary}
                    </p>
                  </div>
                )}

                {latestReport.metrics && (
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
                    {Object.entries(latestReport.metrics)
                      .slice(0, 4)
                      .map(([key, value]) => (
                        <div key={key} className='p-3 bg-blue-50 rounded-lg'>
                          <p className='text-xs text-gray-600 mb-1 capitalize'>
                            {key.replace(/_/g, ' ')}
                          </p>
                          <p className='text-xl font-bold text-blue-600'>
                            {typeof value === 'number' ? value.toLocaleString() : value}
                          </p>
                        </div>
                      ))}
                  </div>
                )}

                {latestReport.trends && latestReport.trends.length > 0 && (
                  <div>
                    <h4 className='font-semibold text-gray-900 mb-3'>Key Trends:</h4>
                    <div className='space-y-2'>
                      {latestReport.trends.slice(0, 3).map((trend, idx) => (
                        <div
                          key={idx}
                          className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'
                        >
                          {getTrendIcon(trend.direction)}
                          <div className='flex-1'>
                            <p className='font-medium text-gray-900 text-sm'>{trend.category}</p>
                            <p className='text-xs text-gray-600'>{trend.description}</p>
                          </div>
                          <Badge className={getTrendBadgeClass(trend.direction)}>
                            {trend.percentage?.toFixed(1) || 0}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* AI Jobs Log */}
          {jobLogs.length > 0 && (
            <Card className='border-2 border-gray-200'>
              <CardHeader className='bg-gradient-to-r from-gray-50 to-white'>
                <CardTitle className='flex items-center gap-2'>
                  <Clock className='w-5 h-5 text-gray-600' />
                  Recent AI Jobs
                </CardTitle>
              </CardHeader>
              <CardContent className='p-6'>
                <div className='space-y-2'>
                  {jobLogs.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className='flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'
                    >
                      <div className='flex items-center gap-3 min-w-0 flex-1'>
                        {log.status === 'completed' ? (
                          <CheckCircle2 className='w-5 h-5 text-green-600 flex-shrink-0' />
                        ) : log.status === 'failed' ? (
                          <AlertCircle className='w-5 h-5 text-red-600 flex-shrink-0' />
                        ) : (
                          <Loader2 className='w-5 h-5 text-blue-600 animate-spin flex-shrink-0' />
                        )}
                        <div className='min-w-0 flex-1'>
                          <p className='font-medium text-gray-900 text-sm truncate'>
                            {log.job_name}
                          </p>
                          <p className='text-xs text-gray-600'>
                            {format(new Date(log.created_date), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center gap-2 ml-2'>
                        {log.duration_ms && (
                          <span className='text-xs text-gray-600'>
                            {(log.duration_ms / 1000).toFixed(1)}s
                          </span>
                        )}
                        <Badge className={getStatusColor(log.status)}>{log.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </MarketingLayout>
    </MarketingGuard>
  );
}
