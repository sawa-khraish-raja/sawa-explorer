import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Smartphone,
  Zap,
  Database,
  Eye,
  Ruler,
  Activity,
} from 'lucide-react';

import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { cn } from '@/shared/utils';

export default function NavbarAudit() {
  const audit = {
    // 1. حجم الـ Header
    headerSize: {
      score: 60,
      issues: [
        {
          severity: 'high',
          component: 'Mobile Header',
          current: 'h-20 (80px)',
          recommended: 'h-14 إلى h-16 (56-64px)',
          reason: 'يأخذ 15% من شاشة الموبايل الصغيرة',
          impact: 'مساحة أقل للمحتوى',
          fix: 'تصغير إلى h-16 (64px)',
        },
        {
          severity: 'medium',
          component: 'Desktop Header',
          current: 'h-16 sm:h-20',
          recommended: 'h-14 sm:h-16',
          reason: 'أكبر من المعايير الحديثة',
          impact: 'يبدو ثقيل',
          fix: 'تصغير قليلاً',
        },
      ],
      recommendations: [
        ' Standard: 56-64px للموبايل',
        ' Standard: 64-72px للديسكتوب',
        '📱 iPhone 14: 80px يأخذ 12% من الشاشة',
      ],
    },

    // 2. الأيقونات
    icons: {
      score: 55,
      issues: [
        {
          severity: 'high',
          component: 'Navigation Icons',
          current: 'w-6 h-6 (24px)',
          recommended: 'w-5 h-5 (20px)',
          reason: 'كبيرة جداً للـ navbar',
          impact: 'تشوش بصري',
          fix: 'className="w-5 h-5"',
        },
        {
          severity: 'high',
          component: 'Icon Buttons',
          current: 'w-12 h-12 (48px)',
          recommended: 'w-10 h-10 (40px)',
          reason: 'كبيرة للموبايل',
          impact: 'تزاحم',
          fix: 'className="w-10 h-10"',
        },
        {
          severity: 'medium',
          component: 'Logo',
          current: 'w-12 h-12',
          recommended: 'w-10 h-10',
          reason: 'كبير قليلاً',
          impact: 'عدم توازن',
          fix: 'className="w-10 h-10"',
        },
        {
          severity: 'medium',
          component: 'Profile Photo',
          current: 'w-10 h-10',
          recommended: 'w-8 h-8',
          reason: 'كبير للـ navbar',
          impact: 'يبرز كثيراً',
          fix: 'className="w-8 h-8"',
        },
      ],
      recommendations: [
        '🎯 Small Icons (badges, buttons): 16px (w-4 h-4)',
        '🎯 Medium Icons (navigation): 20px (w-5 h-5)',
        '🎯 Large Icons (logo): 24px (w-6 h-6)',
        '📐 Touch Target: 40px minimum (w-10 h-10)',
      ],
    },

    // 3. Spacing & Layout
    spacing: {
      score: 65,
      issues: [
        {
          severity: 'high',
          component: 'Icons Gap',
          current: 'gap-2 (8px)',
          recommended: 'gap-3 (12px)',
          reason: 'قريبين جداً - صعب النقر',
          impact: 'خطأ في النقر',
          fix: 'className="gap-3"',
        },
        {
          severity: 'medium',
          component: 'Horizontal Padding',
          current: 'px-4',
          recommended: 'px-3 على الموبايل',
          reason: 'يأخذ مساحة أفقية كبيرة',
          impact: 'تزاحم المحتوى',
          fix: 'className="px-3 sm:px-4"',
        },
        {
          severity: 'low',
          component: 'Logo-to-Icons Gap',
          current: 'justify-between',
          recommended: 'مناسب',
          reason: 'جيد',
          impact: 'none',
          fix: 'لا يحتاج تعديل',
        },
      ],
      recommendations: [
        '📏 Minimum tap target: 44px (Apple HIG)',
        '📏 Icon spacing: 12-16px',
        '📏 Section padding: 12px mobile, 16px desktop',
      ],
    },

    // 4. Performance - Re-renders
    performance: {
      score: 45,
      issues: [
        {
          severity: 'critical',
          component: 'User Query',
          current: 'staleTime: 30 * 60 * 1000 BUT userRef.current',
          recommended: 'استخدام React Query فقط',
          reason: 'userRef يسبب re-renders غير ضرورية',
          impact: 'Navbar يعيد الرسم كثيراً',
          fix: 'إزالة userRef.current',
        },
        {
          severity: 'high',
          component: 'useMemo للـ roles',
          current: 'موجود لكن depends على currentUser.email',
          recommended: 'depends على currentUser?.id فقط',
          reason: 'email نفس الـ id في التغيير',
          impact: 're-renders زيادة',
          fix: 'تبسيط dependencies',
        },
        {
          severity: 'medium',
          component: 'shouldShowBackButton',
          current: 'useCallback with location.pathname',
          recommended: 'مناسب',
          reason: 'مُحسّن',
          impact: 'none',
          fix: 'لا يحتاج تعديل',
        },
        {
          severity: 'low',
          component: 'Scroll listener',
          current: 'موجود',
          recommended: 'استخدام Intersection Observer',
          reason: 'أخف على الأداء',
          impact: 'تحسين بسيط',
          fix: 'تغيير إلى IntersectionObserver',
        },
      ],
      recommendations: [
        '⚡ استخدم React.memo للـ LanguageSwitcher',
        '⚡ استخدم useCallback للـ handlers',
        '⚡ تجنب inline functions في JSX',
        '⚡ استخدم useMemo للحسابات المعقدة',
      ],
    },

    // 5. Mobile Specific
    mobile: {
      score: 70,
      issues: [
        {
          severity: 'medium',
          component: 'Icon Count',
          current: '6-7 أيقونات',
          recommended: '4-5 أيقونات max',
          reason: 'تزاحم على الشاشات الصغيرة',
          impact: 'صعوبة الاستخدام',
          fix: 'نقل بعض الأيقونات للـ dropdown',
        },
        {
          severity: 'medium',
          component: 'Text Truncation',
          current: 'بعض النصوص بدون truncate',
          recommended: 'truncate على كل النصوص',
          reason: 'قد تتجاوز الحدود',
          impact: 'كسر التصميم',
          fix: 'إضافة className="truncate"',
        },
        {
          severity: 'low',
          component: 'Safe Area',
          current: 'safe-area-top موجود',
          recommended: 'ممتاز',
          reason: 'يدعم iPhone notch',
          impact: 'none',
          fix: 'لا يحتاج تعديل',
        },
      ],
      recommendations: [
        '📱 Test على iPhone SE (375px)',
        '📱 Test على iPhone 14 Pro Max (430px)',
        '📱 ضمان touch targets 44px+',
      ],
    },

    // 6. Accessibility
    accessibility: {
      score: 75,
      issues: [
        {
          severity: 'medium',
          component: 'aria-label',
          current: 'موجود على بعض الأزرار',
          recommended: 'على كل الأيقونات',
          reason: 'screen readers',
          impact: 'إمكانية الوصول',
          fix: 'إضافة aria-label',
        },
        {
          severity: 'low',
          component: 'Focus States',
          current: 'موجود',
          recommended: 'ممتاز',
          reason: 'keyboard navigation',
          impact: 'none',
          fix: 'لا يحتاج تعديل',
        },
      ],
      recommendations: [
        '♿ aria-label على كل icon button',
        '♿ role="navigation" على الـ nav',
        '♿ تأكد من keyboard navigation',
      ],
    },

    // 7. UX & Usability
    ux: {
      score: 80,
      issues: [
        {
          severity: 'low',
          component: 'Loading State',
          current: 'skeleton loader',
          recommended: 'ممتاز',
          reason: 'smooth transition',
          impact: 'none',
          fix: 'لا يحتاج تعديل',
        },
        {
          severity: 'low',
          component: 'Hover Effects',
          current: 'موجود',
          recommended: 'ممتاز',
          reason: 'visual feedback',
          impact: 'none',
          fix: 'لا يحتاج تعديل',
        },
      ],
      recommendations: [
        '✨ الـ transitions سلسة',
        '✨ الـ hover states واضحة',
        '✨ الـ active states مميزة',
      ],
    },

    // 8. Code Quality
    codeQuality: {
      score: 70,
      issues: [
        {
          severity: 'medium',
          component: 'Duplicate Logic',
          current: 'desktop و mobile منفصلين',
          recommended: 'مشاركة الـ logic',
          reason: 'code duplication',
          impact: 'maintenance',
          fix: 'extract shared components',
        },
        {
          severity: 'low',
          component: 'Component Size',
          current: '~400 lines',
          recommended: 'تقسيم إلى components أصغر',
          reason: 'easier maintenance',
          impact: 'readability',
          fix: 'extract sub-components',
        },
      ],
      recommendations: [
        '🔧 Extract DesktopNav component',
        '🔧 Extract MobileNav component',
        '🔧 Extract UserMenu component',
      ],
    },
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <XCircle className='w-4 h-4' />;
      case 'medium':
        return <AlertCircle className='w-4 h-4' />;
      case 'low':
        return <CheckCircle className='w-4 h-4' />;
      default:
        return <CheckCircle className='w-4 h-4' />;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const overallScore = Math.round(
    Object.values(audit).reduce((sum, section) => sum + section.score, 0) /
      Object.keys(audit).length
  );

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-7xl mx-auto space-y-6'>
        {/* Overall Score */}
        <Card className='border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white'>
          <CardHeader>
            <CardTitle className='flex items-center justify-between'>
              <span className='text-2xl'>🎯 Navbar Performance Audit</span>
              <div className='text-right'>
                <div className={cn('text-4xl font-bold', getScoreColor(overallScore))}>
                  {overallScore}/100
                </div>
                <p className='text-sm text-gray-600'>Overall Score</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              {Object.entries(audit).map(([key, section]) => (
                <div key={key} className='bg-white rounded-lg p-4 border'>
                  <div className={cn('text-2xl font-bold mb-1', getScoreColor(section.score))}>
                    {section.score}
                  </div>
                  <div className='text-xs text-gray-600 capitalize'>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Analysis */}
        {Object.entries(audit).map(([sectionKey, section]) => (
          <Card key={sectionKey}>
            <CardHeader>
              <CardTitle className='flex items-center justify-between'>
                <span className='capitalize flex items-center gap-2'>
                  {sectionKey === 'headerSize' && <Ruler className='w-5 h-5' />}
                  {sectionKey === 'icons' && <Eye className='w-5 h-5' />}
                  {sectionKey === 'spacing' && <Ruler className='w-5 h-5' />}
                  {sectionKey === 'performance' && <Zap className='w-5 h-5' />}
                  {sectionKey === 'mobile' && <Smartphone className='w-5 h-5' />}
                  {sectionKey === 'accessibility' && <Activity className='w-5 h-5' />}
                  {sectionKey === 'ux' && <Eye className='w-5 h-5' />}
                  {sectionKey === 'codeQuality' && <Database className='w-5 h-5' />}
                  {sectionKey.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <Badge className={cn('text-lg px-4 py-1', getScoreColor(section.score))}>
                  {section.score}/100
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Issues */}
              {section.issues && section.issues.length > 0 && (
                <div className='space-y-3'>
                  <h4 className='font-semibold text-sm text-gray-700'> Issues Found:</h4>
                  {section.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={cn('border rounded-lg p-4', getSeverityColor(issue.severity))}
                    >
                      <div className='flex items-start gap-3'>
                        {getSeverityIcon(issue.severity)}
                        <div className='flex-1'>
                          <div className='flex items-center justify-between mb-2'>
                            <h5 className='font-bold'>{issue.component}</h5>
                            <Badge variant='outline' className='text-xs capitalize'>
                              {issue.severity}
                            </Badge>
                          </div>
                          <div className='space-y-1 text-sm'>
                            <p>
                              <strong>Current:</strong> {issue.current}
                            </p>
                            <p>
                              <strong>Recommended:</strong> {issue.recommended}
                            </p>
                            <p>
                              <strong>Reason:</strong> {issue.reason}
                            </p>
                            <p>
                              <strong>Impact:</strong> {issue.impact}
                            </p>
                            <div className='mt-2 bg-white/50 rounded p-2'>
                              <strong>Fix:</strong> <code className='text-xs'>{issue.fix}</code>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {section.recommendations && section.recommendations.length > 0 && (
                <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                  <h4 className='font-semibold text-sm text-green-900 mb-2'>💡 Best Practices:</h4>
                  <ul className='space-y-1'>
                    {section.recommendations.map((rec, idx) => (
                      <li key={idx} className='text-sm text-green-800'>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Action Plan */}
        <Card className='border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white'>
          <CardHeader>
            <CardTitle>🎯 Priority Action Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='border-l-4 border-red-500 pl-4 bg-red-50 py-3 rounded-r'>
                <h4 className='font-bold text-red-900'>🔥 Critical (Fix Now)</h4>
                <ul className='mt-2 space-y-1 text-sm text-red-800'>
                  <li>1. تصغير height الـ mobile header من 80px إلى 64px</li>
                  <li>2. تصغير الأيقونات من 24px إلى 20px</li>
                  <li>3. إصلاح userRef في User Query</li>
                </ul>
              </div>

              <div className='border-l-4 border-orange-500 pl-4 bg-orange-50 py-3 rounded-r'>
                <h4 className='font-bold text-orange-900'> High Priority (This Week)</h4>
                <ul className='mt-2 space-y-1 text-sm text-orange-800'>
                  <li>1. زيادة gap بين الأيقونات من 8px إلى 12px</li>
                  <li>2. تصغير icon buttons من 48px إلى 40px</li>
                  <li>3. تحسين useMemo dependencies</li>
                </ul>
              </div>

              <div className='border-l-4 border-yellow-500 pl-4 bg-yellow-50 py-3 rounded-r'>
                <h4 className='font-bold text-yellow-900'>⏰ Medium Priority (Next Sprint)</h4>
                <ul className='mt-2 space-y-1 text-sm text-yellow-800'>
                  <li>1. تقليل عدد الأيقونات على الموبايل</li>
                  <li>2. extract shared components</li>
                  <li>3. إضافة aria-labels المفقودة</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
