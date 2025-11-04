import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowLeft,
  Calendar,
  Loader2,
  CheckCircle2,
  Target,
  Users,
  Sparkles, // Added Sparkles icon
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { queryDocuments } from '@/utils/firestore';

import MarketingGuard from '../components/marketing/MarketingGuard';
import MarketingLayout from '../components/marketing/MarketingLayout';


export default function ReportView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reportId = searchParams.get('id');

  const { data: report, isLoading } = useQuery({
    queryKey: ['report_view', reportId],
    queryFn: async () => {
      if (!reportId) throw new Error('No report ID');
      const reports = await queryDocuments('aireportss', [['id', '==', reportId ]]);
      if (!reports || reports.length === 0) throw new Error('Report not found');
      return reports[0];
    },
    enabled: !!reportId,
    retry: 1,
  });

  const downloadPDF = () => {
    if (!report) return;

    try {
      const doc = new jsPDF();
      let yPos = 20;

      // Title
      doc.setFontSize(20);
      doc.setTextColor(51, 0, 102);
      doc.text(report.title || 'SAWA Marketing Report', 20, yPos);
      yPos += 10;

      // Date
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Generated: ${format(new Date(report.created_date || report.generated_at), 'PPpp')}`,
        20,
        yPos
      );
      yPos += 15;

      // Summary
      if (report.summary) {
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Executive Summary', 20, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        const summaryText = report.summary.en || report.summary;
        const summaryLines = doc.splitTextToSize(summaryText, 170);
        doc.text(summaryLines, 20, yPos);
        yPos += summaryLines.length * 5 + 10;
      }

      // Metrics
      if (report.metrics && yPos < 250) {
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Key Metrics', 20, yPos);
        yPos += 8;

        doc.setFontSize(10);
        Object.entries(report.metrics).forEach(([key, value]) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.setTextColor(100, 100, 100);
          doc.text(`${key.replace(/_/g, ' ').toUpperCase()}:`, 20, yPos);
          doc.setTextColor(51, 0, 102);
          doc.text(String(value), 100, yPos);
          yPos += 6;
        });
        yPos += 10;
      }

      // Marketing Strategies
      if (report.marketing_strategies && report.marketing_strategies.length > 0 && yPos < 240) {
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Marketing Strategies', 20, yPos);
        yPos += 8;

        doc.setFontSize(10);
        report.marketing_strategies.slice(0, 3).forEach((strategy, idx) => {
          if (yPos > 260) {
            doc.addPage();
            yPos = 20;
          }

          doc.setTextColor(51, 0, 102);
          doc.text(`${idx + 1}. ${strategy.strategy}`, 20, yPos);
          yPos += 5;

          doc.setTextColor(60, 60, 60);
          doc.text(`Target: ${strategy.target_audience}`, 25, yPos);
          yPos += 5;
          doc.text(`Channels: ${strategy.channels?.join(', ') || 'N/A'}`, 25, yPos);
          yPos += 5;
          doc.text(`Budget: ${strategy.budget_estimate}`, 25, yPos);
          yPos += 8;
        });
      }

      // Recommendations
      if (report.recommendations && report.recommendations.length > 0 && yPos < 240) {
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('AI Recommendations', 20, yPos);
        yPos += 8;

        doc.setFontSize(10);
        report.recommendations.slice(0, 5).forEach((rec, idx) => {
          if (yPos > 260) {
            doc.addPage();
            yPos = 20;
          }

          doc.setTextColor(100, 100, 100);
          doc.text(`${idx + 1}. ${rec.title_en || rec.title}`, 20, yPos);
          yPos += 5;

          doc.setTextColor(60, 60, 60);
          const descLines = doc.splitTextToSize(rec.description_en || rec.description || '', 170);
          doc.text(descLines, 25, yPos);
          yPos += descLines.length * 4 + 6;
        });
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`SAWA Marketing Report - Page ${i} of ${pageCount}`, 20, 285);
      }

      doc.save(`SAWA_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('PDF Downloaded!');
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const getTrendIcon = (direction) => {
    if (direction === 'up') return <TrendingUp className='w-4 h-4 text-green-600' />;
    if (direction === 'down') return <TrendingDown className='w-4 h-4 text-red-600' />;
    return <Minus className='w-4 h-4 text-gray-600' />;
  };

  const getTrendBadgeClass = (direction) => {
    if (direction === 'up') return 'bg-green-100 text-green-800';
    if (direction === 'down') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <MarketingGuard>
        <MarketingLayout>
          <div className='flex flex-col justify-center items-center h-96'>
            <Loader2 className='w-8 h-8 animate-spin text-purple-600 mb-4' />
            <p className='text-gray-600'>Loading report...</p>
          </div>
        </MarketingLayout>
      </MarketingGuard>
    );
  }

  if (!report) {
    return (
      <MarketingGuard>
        <MarketingLayout>
          <div className='flex flex-col justify-center items-center h-96'>
            <FileText className='w-16 h-16 text-gray-400 mb-4' />
            <p className='text-gray-600'>Report not found</p>
            <Button
              onClick={() => navigate('/MarketingReports')}
              className='mt-4'
              variant='outline'
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Back to Reports
            </Button>
          </div>
        </MarketingLayout>
      </MarketingGuard>
    );
  }

  return (
    <MarketingGuard>
      <MarketingLayout>
        <div className='space-y-6'>
          {/* Header */}
          <div className='bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 md:p-8 text-white shadow-xl'>
            <div className='flex items-start justify-between mb-4'>
              <Button
                onClick={() => navigate('/MarketingReports')}
                variant='ghost'
                className='text-white hover:bg-white/10'
              >
                <ArrowLeft className='w-5 h-5 mr-2' />
                Back
              </Button>
              <div className='flex gap-2'>
                <Badge className='bg-white/20 text-white border-0'>
                  <Calendar className='w-3 h-3 mr-1' />
                  {format(new Date(report.created_date), 'MMM dd, HH:mm')}
                </Badge>
                <Badge className='bg-green-500 text-white border-0'>
                  <CheckCircle2 className='w-3 h-3 mr-1' />
                  {report.status}
                </Badge>
              </div>
            </div>
            <h1 className='text-3xl md:text-4xl font-bold mb-2'>{report.title}</h1>
            <p className='text-purple-100 text-sm'>AI-Powered Marketing Intelligence Report</p>
          </div>

          {/* Download Button */}
          <Card className='border-2 border-purple-200'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='font-semibold text-gray-900 mb-1'>Export Report</h3>
                  <p className='text-sm text-gray-600'>
                    Download this report as a professional PDF document
                  </p>
                </div>
                <Button
                  onClick={downloadPDF}
                  className='bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                >
                  <Download className='w-4 h-4 mr-2' />
                  Download PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Executive Summary */}
          {report.summary && (
            <Card className='border-2 border-blue-200'>
              <CardHeader className='bg-gradient-to-r from-blue-50 to-white border-b'>
                <CardTitle className='flex items-center gap-2'>
                  <FileText className='w-5 h-5 text-blue-600' />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent className='p-6'>
                <div className='prose prose-sm max-w-none'>
                  <p className='text-gray-700 leading-relaxed'>
                    {report.summary.en || report.summary}
                  </p>
                  {report.summary.ar && (
                    <div className='mt-4 pt-4 border-t border-gray-200'>
                      <p className='text-gray-700 leading-relaxed' dir='rtl'>
                        {report.summary.ar}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Metrics */}
          {report.metrics && (
            <Card className='border-2 border-green-200'>
              <CardHeader className='bg-gradient-to-r from-green-50 to-white border-b'>
                <CardTitle className='flex items-center gap-2'>
                  <Target className='w-5 h-5 text-green-600' />
                  Key Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className='p-6'>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                  {Object.entries(report.metrics).map(([key, value]) => (
                    <div key={key} className='p-4 bg-green-50 rounded-lg'>
                      <p className='text-xs text-gray-600 mb-1 capitalize'>
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className='text-2xl font-bold text-green-600'>
                        {typeof value === 'number' ? value.toLocaleString() : value}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Marketing Strategies */}
          {report.marketing_strategies && report.marketing_strategies.length > 0 && (
            <Card className='border-2 border-emerald-200'>
              <CardHeader className='bg-gradient-to-r from-emerald-50 to-white border-b'>
                <CardTitle className='flex items-center gap-2'>
                  <Target className='w-5 h-5 text-emerald-600' />
                  Marketing Strategies
                </CardTitle>
              </CardHeader>
              <CardContent className='p-6'>
                <div className='space-y-4'>
                  {report.marketing_strategies.map((strategy, idx) => (
                    <div
                      key={idx}
                      className='p-5 bg-emerald-50 rounded-lg border-l-4 border-emerald-600'
                    >
                      <h4 className='font-bold text-gray-900 mb-3'>{strategy.strategy}</h4>
                      <div className='grid grid-cols-2 gap-3 text-sm'>
                        <div>
                          <p className='text-gray-600 font-semibold'>Target Audience:</p>
                          <p className='text-gray-900'>{strategy.target_audience}</p>
                        </div>
                        <div>
                          <p className='text-gray-600 font-semibold'>Channels:</p>
                          <p className='text-gray-900'>{strategy.channels?.join(', ')}</p>
                        </div>
                        <div>
                          <p className='text-gray-600 font-semibold'>Budget:</p>
                          <p className='text-gray-900'>{strategy.budget_estimate}</p>
                        </div>
                        <div>
                          <p className='text-gray-600 font-semibold'>Expected ROI:</p>
                          <p className='text-gray-900'>{strategy.expected_roi}</p>
                        </div>
                      </div>
                      <div className='mt-3 pt-3 border-t border-emerald-200'>
                        <p className='text-sm text-gray-700'>
                          <span className='font-semibold'>Timeline:</span> {strategy.timeline}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content Ideas */}
          {report.content_ideas && report.content_ideas.length > 0 && (
            <Card className='border-2 border-purple-200'>
              <CardHeader className='bg-gradient-to-r from-purple-50 to-white border-b'>
                <CardTitle className='flex items-center gap-2'>
                  <Sparkles className='w-5 h-5 text-purple-600' />
                  AI-Generated Content Ideas
                </CardTitle>
              </CardHeader>
              <CardContent className='p-6'>
                <div className='space-y-4'>
                  {report.content_ideas.map((idea, idx) => (
                    <div
                      key={idx}
                      className='p-5 bg-purple-50 rounded-lg border-2 border-purple-200'
                    >
                      <div className='flex items-start justify-between mb-3'>
                        <div>
                          <Badge className='bg-purple-600 text-white mb-2'>{idea.type}</Badge>
                          <h4 className='font-bold text-gray-900'>{idea.title}</h4>
                        </div>
                        <Badge className='bg-purple-100 text-purple-800'>
                          {idea.target_persona}
                        </Badge>
                      </div>
                      <p className='text-sm text-gray-700 mb-3'>{idea.description}</p>
                      {idea.suggested_copy && (
                        <div className='p-3 bg-white rounded-lg border border-purple-200 mb-3'>
                          <p className='text-xs text-gray-600 mb-1'>Ready-to-use copy:</p>
                          <p className='text-sm text-gray-900 italic'>"{idea.suggested_copy}"</p>
                        </div>
                      )}
                      {idea.hashtags && idea.hashtags.length > 0 && (
                        <div className='flex flex-wrap gap-2'>
                          {idea.hashtags.map((tag, tagIdx) => (
                            <Badge key={tagIdx} className='bg-purple-100 text-purple-700'>
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Insights */}
          {report.insights && (
            <Card className='border-2 border-indigo-200'>
              <CardHeader className='bg-gradient-to-r from-indigo-50 to-white border-b'>
                <CardTitle className='flex items-center gap-2'>
                  <Users className='w-5 h-5 text-indigo-600' />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className='p-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  {Object.entries(report.insights).map(([category, data]) => (
                    <div key={category} className='p-4 bg-indigo-50 rounded-lg'>
                      <h4 className='font-semibold text-indigo-900 mb-3 capitalize'>
                        {category.replace(/_/g, ' ')}
                      </h4>
                      <div className='space-y-2 text-sm'>
                        {typeof data === 'object' && data !== null ? (
                          Object.entries(data).map(([subKey, subValue]) => (
                            <div key={subKey} className='flex justify-between'>
                              <span className='text-gray-700 capitalize'>
                                {subKey.replace(/_/g, ' ')}:
                              </span>
                              <span className='font-semibold text-indigo-700'>
                                {typeof subValue === 'number'
                                  ? subValue.toLocaleString()
                                  : String(subValue)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className='text-gray-700'>{String(data)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trends */}
          {report.trends && report.trends.length > 0 && (
            <Card className='border-2 border-amber-200'>
              <CardHeader className='bg-gradient-to-r from-amber-50 to-white border-b'>
                <CardTitle className='flex items-center gap-2'>
                  <TrendingUp className='w-5 h-5 text-amber-600' />
                  Key Trends
                </CardTitle>
              </CardHeader>
              <CardContent className='p-6'>
                <div className='space-y-3'>
                  {report.trends.map((trend, idx) => (
                    <div key={idx} className='flex items-center gap-3 p-4 bg-amber-50 rounded-lg'>
                      {getTrendIcon(trend.direction)}
                      <div className='flex-1'>
                        <p className='font-medium text-gray-900'>{trend.category}</p>
                        <p className='text-sm text-gray-600'>{trend.description}</p>
                      </div>
                      <Badge className={getTrendBadgeClass(trend.direction)}>
                        {trend.percentage?.toFixed(1) || 0}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Recommendations */}
          {report.recommendations && report.recommendations.length > 0 && (
            <Card className='border-2 border-pink-200'>
              <CardHeader className='bg-gradient-to-r from-pink-50 to-white border-b'>
                <CardTitle className='flex items-center gap-2'>
                  <CheckCircle2 className='w-5 h-5 text-pink-600' />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className='p-6'>
                <div className='space-y-4'>
                  {report.recommendations.map((rec, idx) => (
                    <div key={idx} className='p-5 bg-pink-50 rounded-lg border-l-4 border-pink-600'>
                      <div className='flex items-start gap-3 mb-2'>
                        <Badge
                          className={`
                          ${
                            rec.priority === 'high'
                              ? 'bg-red-100 text-red-800'
                              : rec.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                          }
                        `}
                        >
                          {rec.priority} priority
                        </Badge>
                        <Badge className='bg-pink-100 text-pink-800'>{rec.category}</Badge>
                      </div>
                      <h4 className='font-bold text-gray-900 mb-2'>{rec.title_en || rec.title}</h4>
                      <p className='text-sm text-gray-700 mb-3'>
                        {rec.description_en || rec.description}
                      </p>
                      {rec.action_items && rec.action_items.length > 0 && (
                        <div className='mt-3 pt-3 border-t border-pink-200'>
                          <p className='text-xs font-semibold text-gray-700 mb-2'>Action Items:</p>
                          <ul className='text-sm text-gray-700 space-y-1'>
                            {rec.action_items.map((item, itemIdx) => (
                              <li key={itemIdx} className='flex items-start gap-2'>
                                <CheckCircle2 className='w-4 h-4 text-pink-600 flex-shrink-0 mt-0.5' />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
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
