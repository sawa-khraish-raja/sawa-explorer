import {
  Palette,
  Type,
  Maximize2,
  Layout,
  CheckCircle,
  AlertCircle,
  XCircle,
  Ruler,
  Eye,
  Smartphone,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function DesignAudit() {
  const [activeTab, setActiveTab] = useState('overview');

  // Design System Analysis
  const audit = {
    // 1. Typography Scale
    typography: {
      score: 65,
      issues: [
        {
          severity: 'high',
          page: 'Header Mobile',
          issue: 'h-20 كبير جداً للموبايل - المعيار h-14 إلى h-16',
          fix: 'تصغير إلى h-16',
        },
        {
          severity: 'high',
          page: 'Header Icons',
          issue: 'الأيقونات w-6 h-6 كبيرة - المعيار w-5 h-5',
          fix: 'تصغير إلى w-5 h-5',
        },
        {
          severity: 'medium',
          page: 'Profile Photo',
          issue: 'w-10 h-10 كبيرة للـ header - المعيار w-8 h-8',
          fix: 'تصغير إلى w-8 h-8',
        },
        {
          severity: 'medium',
          page: 'Home Hero',
          issue: 'Hero title كبير جداً على الموبايل',
          fix: 'استخدم text-2xl بدل text-3xl',
        },
        {
          severity: 'low',
          page: 'Cards',
          issue: 'بعض الـ card titles غير متناسقة',
          fix: 'توحيد بين text-lg و text-xl',
        },
      ],
      goodPractices: [
        ' استخدام font-bold للعناوين',
        ' text-sm للنصوص الثانوية',
        ' truncate للنصوص الطويلة',
      ],
      recommendations: [
        'استخدم scale ثابت: xs(10px) - sm(12px) - base(14px) - lg(16px) - xl(18px) - 2xl(20px)',
        'Headers: 2xl للـ Desktop, xl للـ Mobile',
        'Body: base(14px) للـ Desktop, sm(12px) للـ Mobile',
      ],
    },

    // 2. Spacing & Layout
    spacing: {
      score: 70,
      issues: [
        {
          severity: 'high',
          page: 'Mobile Header',
          issue: 'h-20 (80px) كبير - يأخذ مساحة كبيرة من الشاشة',
          fix: 'تصغير إلى h-16 (64px)',
        },
        {
          severity: 'high',
          page: 'Header Icons Gap',
          issue: 'gap-2 بين الأيقونات قليل جداً - صعب النقر',
          fix: 'gap-3 أو gap-4',
        },
        {
          severity: 'medium',
          page: 'Cards Padding',
          issue: 'بعض الكروت p-6 وبعضها p-4',
          fix: 'توحيد بين p-4 و p-5',
        },
        {
          severity: 'medium',
          page: 'Section Spacing',
          issue: 'py-12 و py-8 غير متناسقين',
          fix: 'py-8 للموبايل، py-12 للـ Desktop',
        },
        {
          severity: 'low',
          page: 'Button Padding',
          issue: 'بعض الأزرار px-4 وبعضها px-6',
          fix: 'توحيد px-4 للصغير، px-6 للكبير',
        },
      ],
      goodPractices: [
        ' استخدام gap-* للـ flex/grid',
        ' استخدام max-w-* للـ containers',
        ' responsive padding',
      ],
      recommendations: [
        'Scale: 2px(0.5rem) - 4px(1rem) - 6px(1.5rem) - 8px(2rem)',
        'Mobile: px-4, py-8',
        'Desktop: px-6 lg:px-8, py-12',
      ],
    },

    // 3. Icon Sizes
    iconSizes: {
      score: 60,
      issues: [
        {
          severity: 'high',
          page: 'Header Mobile',
          issue: 'w-6 h-6 للأيقونات كبيرة - المعيار w-5 h-5',
          fix: 'تصغير إلى w-5 h-5',
        },
        {
          severity: 'high',
          page: 'Logo Size',
          issue: 'Logo w-12 h-12 كبير للموبايل - المعيار w-10 h-10',
          fix: 'تصغير إلى w-10 h-10',
        },
        {
          severity: 'medium',
          page: 'Button Icons',
          issue: 'أيقونات الأزرار غير متناسقة - بعضها w-4 وبعضها w-5',
          fix: 'توحيد w-4 h-4',
        },
        {
          severity: 'medium',
          page: 'Dashboard Icons',
          issue: 'w-6 h-6 للـ dashboard - يفضل w-5 h-5',
          fix: 'تصغير قليلاً',
        },
      ],
      goodPractices: [' استخدام w-* h-* بدل size-*', ' تناسق في الأحجام داخل نفس الـ component'],
      recommendations: [
        'Small Icons: w-4 h-4 (16px) - للأزرار والـ badges',
        'Medium Icons: w-5 h-5 (20px) - للـ navigation',
        'Large Icons: w-6 h-6 (24px) - للـ headers والـ features',
        'Hero Icons: w-8 h-8 (32px+) - للصفحات الرئيسية',
      ],
    },

    // 4. Button Sizes
    buttons: {
      score: 75,
      issues: [
        {
          severity: 'medium',
          page: 'Header Buttons',
          issue: 'w-12 h-12 كبيرة - المعيار w-10 h-10',
          fix: 'تصغير إلى w-10 h-10',
        },
        {
          severity: 'medium',
          page: 'Primary CTAs',
          issue: 'بعض الأزرار h-12 وبعضها h-11',
          fix: 'توحيد h-10 أو h-11',
        },
        {
          severity: 'low',
          page: 'Secondary Buttons',
          issue: 'rounded-full و rounded-xl مختلط',
          fix: 'توحيد rounded-xl',
        },
      ],
      goodPractices: [' hover states واضحة', ' disabled states موجودة', ' loading states موجودة'],
      recommendations: [
        'Small: h-8 px-3 text-sm',
        'Medium (Default): h-10 px-4 text-base',
        'Large: h-12 px-6 text-lg',
        'Icon Buttons: w-10 h-10 rounded-full',
      ],
    },

    // 5. Colors & Contrast
    colors: {
      score: 85,
      issues: [
        {
          severity: 'low',
          page: 'Text Colors',
          issue: 'text-gray-600 و text-gray-700 مختلطين',
          fix: 'text-gray-700 للأساسي، text-gray-600 للثانوي',
        },
        {
          severity: 'low',
          page: 'Borders',
          issue: 'border-gray-200 و border-gray-100 غير متناسقين',
          fix: 'border-gray-200 للحدود الواضحة',
        },
      ],
      goodPractices: [
        ' Primary: #330066 و #9933CC متناسقين',
        ' gradients جميلة وواضحة',
        ' hover states بألوان مناسبة',
        ' error/success colors واضحة',
      ],
      recommendations: [
        'Primary Text: text-gray-900',
        'Secondary Text: text-gray-600',
        'Muted Text: text-gray-500',
        'Borders: border-gray-200',
        'Backgrounds: bg-gray-50 / bg-gray-100',
      ],
    },

    // 6. Responsive Design
    responsive: {
      score: 80,
      issues: [
        {
          severity: 'medium',
          page: 'Header Height',
          issue: 'h-20 على الموبايل يأخذ مساحة كبيرة',
          fix: 'h-16 أفضل للموبايل',
        },
        {
          severity: 'medium',
          page: 'Text Sizes',
          issue: 'بعض النصوص كبيرة على الموبايل',
          fix: 'استخدم text-xl sm:text-2xl lg:text-3xl',
        },
        {
          severity: 'low',
          page: 'Spacing',
          issue: 'بعض الـ sections padding كبير على الموبايل',
          fix: 'py-8 sm:py-12 lg:py-16',
        },
      ],
      goodPractices: [
        ' استخدام sm: و lg: breakpoints',
        ' mobile-first approach',
        ' grid cols responsive',
        ' safe-area-inset للـ iPhone',
      ],
      recommendations: [
        'Mobile: px-4, text-base, gap-4',
        'Tablet (sm:): px-6, text-lg, gap-6',
        'Desktop (lg:): px-8, text-xl, gap-8',
      ],
    },

    // 7. Cards & Containers
    containers: {
      score: 75,
      issues: [
        {
          severity: 'medium',
          page: 'Card Shadows',
          issue: 'shadow-lg و shadow-xl مختلطين',
          fix: 'shadow-md للعادي، shadow-lg للـ hover',
        },
        {
          severity: 'medium',
          page: 'Border Radius',
          issue: 'rounded-xl و rounded-2xl غير متناسقين',
          fix: 'rounded-xl للكروت',
        },
        {
          severity: 'low',
          page: 'Card Padding',
          issue: 'p-4 و p-6 مختلطين',
          fix: 'p-4 sm:p-6',
        },
      ],
      goodPractices: [' hover:shadow-* للتفاعل', ' bg-white للكروت', ' border للتمييز'],
      recommendations: [
        'Default: rounded-xl shadow-sm border',
        'Hover: shadow-md scale-[1.02]',
        'Active: shadow-lg',
        'Padding: p-4 sm:p-6',
      ],
    },
  };

  // Calculate overall score
  const overallScore = Math.round(
    Object.values(audit).reduce((acc, cat) => acc + cat.score, 0) / Object.keys(audit).length
  );

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getSeverityBadge = (severity) => {
    const config = {
      high: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
      low: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    };
    const classes = config[severity] || config.low;
    return `${classes.bg} ${classes.text} ${classes.border}`;
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-50 to-white py-8 px-4'>
      <div className='max-w-7xl mx-auto space-y-8'>
        {/* Overview Score Card */}
        <Card className='shadow-2xl border-2 border-purple-100'>
          <CardHeader className='bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-t-xl'>
            <CardTitle className='text-3xl font-bold text-center'>تقييم نظام التصميم</CardTitle>
          </CardHeader>
          <CardContent className='p-8'>
            <div className='flex flex-col md:flex-row items-center justify-between gap-8 mb-8'>
              <div
                className={cn(
                  'w-40 h-40 rounded-full flex flex-col items-center justify-center border-4',
                  getScoreColor(overallScore)
                )}
              >
                <div className='text-5xl font-bold'>{overallScore}</div>
                <div className='text-xs font-medium mt-1'>من 100</div>
              </div>
              <div>
                <h2 className='text-2xl font-bold text-gray-900 mb-2'>
                  {overallScore >= 85 && '🎉 تصميم ممتاز!'}
                  {overallScore >= 70 && overallScore < 85 && '👍 تصميم جيد'}
                  {overallScore < 70 && ' يحتاج تحسينات'}
                </h2>
                <p className='text-gray-600 text-sm'>
                  {overallScore >= 85 && 'التناسق عالي وجودة التصميم ممتازة'}
                  {overallScore >= 70 && overallScore < 85 && 'تصميم جيد لكن في مجال للتحسين'}
                  {overallScore < 70 && 'التصميم يحتاج تحسينات جوهرية'}
                </p>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='text-center p-4 bg-red-50 rounded-xl border border-red-200'>
                  <div className='text-3xl font-bold text-red-600'>
                    {Object.values(audit).reduce(
                      (acc, cat) => acc + cat.issues.filter((i) => i.severity === 'high').length,
                      0
                    )}
                  </div>
                  <div className='text-xs text-red-700 font-medium'>مشاكل عالية</div>
                </div>
                <div className='text-center p-4 bg-yellow-50 rounded-xl border border-yellow-200'>
                  <div className='text-3xl font-bold text-yellow-600'>
                    {Object.values(audit).reduce(
                      (acc, cat) => acc + cat.issues.filter((i) => i.severity === 'medium').length,
                      0
                    )}
                  </div>
                  <div className='text-xs text-yellow-700 font-medium'>مشاكل متوسطة</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <div className='grid gap-6 md:grid-cols-2'>
          {Object.entries(audit).map(([key, data]) => {
            const icons = {
              typography: Type,
              spacing: Ruler,
              iconSizes: Zap,
              buttons: Maximize2,
              colors: Palette,
              responsive: Smartphone,
              containers: Layout,
            };
            const Icon = icons[key] || Eye;

            return (
              <Card key={key} className='hover:shadow-xl transition-all'>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-xl flex items-center gap-2'>
                      <Icon className='w-5 h-5 text-purple-600' />
                      {key === 'typography' && 'النصوص والخطوط'}
                      {key === 'spacing' && 'المسافات والتباعد'}
                      {key === 'iconSizes' && 'أحجام الأيقونات'}
                      {key === 'buttons' && 'الأزرار'}
                      {key === 'colors' && 'الألوان والتباين'}
                      {key === 'responsive' && 'التصميم المتجاوب'}
                      {key === 'containers' && 'الكروت والحاويات'}
                    </CardTitle>
                    <div
                      className={cn(
                        'w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold border-2',
                        getScoreColor(data.score)
                      )}
                    >
                      {data.score}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {/* Issues */}
                  {data.issues.length > 0 && (
                    <div className='space-y-2'>
                      <p className='text-sm font-bold text-gray-900 flex items-center gap-2'>
                        <XCircle className='w-4 h-4 text-red-500' />
                        المشاكل ({data.issues.length})
                      </p>
                      <div className='space-y-2'>
                        {data.issues.map((issue, idx) => (
                          <div
                            key={idx}
                            className='p-3 bg-gray-50 rounded-lg border border-gray-200'
                          >
                            <div className='flex items-start gap-2 mb-2'>
                              <Badge className={getSeverityBadge(issue.severity)}>
                                {issue.severity === 'high' && 'عالي'}
                                {issue.severity === 'medium' && 'متوسط'}
                                {issue.severity === 'low' && 'منخفض'}
                              </Badge>
                              <span className='text-xs font-semibold text-purple-700'>
                                {issue.page}
                              </span>
                            </div>
                            <p className='text-sm text-gray-700 mb-1'>{issue.issue}</p>
                            <p className='text-xs text-green-700 font-medium'> الحل: {issue.fix}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Good Practices */}
                  {data.goodPractices && (
                    <div className='space-y-2'>
                      <p className='text-sm font-bold text-gray-900 flex items-center gap-2'>
                        <CheckCircle className='w-4 h-4 text-green-500' />
                        ممارسات جيدة
                      </p>
                      <ul className='space-y-1'>
                        {data.goodPractices.map((practice, idx) => (
                          <li key={idx} className='text-xs text-gray-700 flex items-start gap-2'>
                            <span className='text-green-600 font-bold mt-0.5'>•</span>
                            <span>{practice}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div className='space-y-2'>
                    <p className='text-sm font-bold text-gray-900 flex items-center gap-2'>
                      <AlertCircle className='w-4 h-4 text-blue-500' />
                      التوصيات
                    </p>
                    <ul className='space-y-1'>
                      {data.recommendations.map((rec, idx) => (
                        <li key={idx} className='text-xs text-gray-700 flex items-start gap-2'>
                          <span className='text-blue-600 font-bold mt-0.5'>•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Priority Fixes */}
        <Card className='border-2 border-red-300 bg-gradient-to-br from-white to-red-50'>
          <CardHeader>
            <CardTitle className='text-2xl flex items-center gap-2 text-red-700'>
              <AlertCircle className='w-6 h-6' />
              🔥 أولويات التصميم (يجب إصلاحها أولاً)
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='p-4 bg-red-50 rounded-xl border border-red-200'>
              <div className='flex items-start gap-3'>
                <span className='text-3xl'>1️⃣</span>
                <div>
                  <p className='font-bold text-red-900 mb-1'>تصغير Header الموبايل</p>
                  <p className='text-sm text-red-700 mb-2'>h-20 كبير جداً ويأخذ مساحة من الشاشة</p>
                  <code className='text-xs bg-white px-2 py-1 rounded'>h-16 بدلاً من h-20</code>
                </div>
              </div>
            </div>

            <div className='p-4 bg-orange-50 rounded-xl border border-orange-200'>
              <div className='flex items-start gap-3'>
                <span className='text-3xl'>2️⃣</span>
                <div>
                  <p className='font-bold text-orange-900 mb-1'>توحيد أحجام الأيقونات</p>
                  <p className='text-sm text-orange-700 mb-2'>
                    الأيقونات w-6 h-6 كبيرة - المعيار w-5 h-5
                  </p>
                  <code className='text-xs bg-white px-2 py-1 rounded'>w-5 h-5 للـ navigation</code>
                </div>
              </div>
            </div>

            <div className='p-4 bg-yellow-50 rounded-xl border border-yellow-200'>
              <div className='flex items-start gap-3'>
                <span className='text-3xl'>3️⃣</span>
                <div>
                  <p className='font-bold text-yellow-900 mb-1'>تصغير حجم الصورة الشخصية</p>
                  <p className='text-sm text-yellow-700 mb-2'>w-10 h-10 كبيرة - المعيار w-8 h-8</p>
                  <code className='text-xs bg-white px-2 py-1 rounded'>
                    w-8 h-8 للـ header avatar
                  </code>
                </div>
              </div>
            </div>

            <div className='p-4 bg-blue-50 rounded-xl border border-blue-200'>
              <div className='flex items-start gap-3'>
                <span className='text-3xl'>4️⃣</span>
                <div>
                  <p className='font-bold text-blue-900 mb-1'>زيادة المسافة بين الأيقونات</p>
                  <p className='text-sm text-blue-700 mb-2'>gap-2 قليل - صعب النقر على الموبايل</p>
                  <code className='text-xs bg-white px-2 py-1 rounded'>gap-3 أو gap-4 للراحة</code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Design System Guide */}
        <Card className='border-2 border-green-300 bg-gradient-to-br from-white to-green-50'>
          <CardHeader>
            <CardTitle className='text-2xl flex items-center gap-2 text-green-700'>
              <CheckCircle className='w-6 h-6' />
              📐 دليل التصميم الموصى به
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid md:grid-cols-2 gap-6'>
              <div>
                <h3 className='font-bold text-gray-900 mb-3 flex items-center gap-2'>
                  <Type className='w-5 h-5 text-green-600' />
                  أحجام النصوص
                </h3>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between p-2 bg-white rounded'>
                    <span className='text-gray-600'>Mobile Hero</span>
                    <code className='text-purple-700'>text-xl</code>
                  </div>
                  <div className='flex justify-between p-2 bg-white rounded'>
                    <span className='text-gray-600'>Desktop Hero</span>
                    <code className='text-purple-700'>text-3xl lg:text-4xl</code>
                  </div>
                  <div className='flex justify-between p-2 bg-white rounded'>
                    <span className='text-gray-600'>Card Title</span>
                    <code className='text-purple-700'>text-lg font-bold</code>
                  </div>
                  <div className='flex justify-between p-2 bg-white rounded'>
                    <span className='text-gray-600'>Body Text</span>
                    <code className='text-purple-700'>text-base (14px)</code>
                  </div>
                  <div className='flex justify-between p-2 bg-white rounded'>
                    <span className='text-gray-600'>Caption</span>
                    <code className='text-purple-700'>text-sm (12px)</code>
                  </div>
                </div>
              </div>

              <div>
                <h3 className='font-bold text-gray-900 mb-3 flex items-center gap-2'>
                  <Zap className='w-5 h-5 text-green-600' />
                  أحجام الأيقونات
                </h3>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between p-2 bg-white rounded'>
                    <span className='text-gray-600'>Small (Badges)</span>
                    <code className='text-purple-700'>w-4 h-4 (16px)</code>
                  </div>
                  <div className='flex justify-between p-2 bg-white rounded'>
                    <span className='text-gray-600'>Medium (Nav)</span>
                    <code className='text-purple-700'>w-5 h-5 (20px)</code>
                  </div>
                  <div className='flex justify-between p-2 bg-white rounded'>
                    <span className='text-gray-600'>Large (Headers)</span>
                    <code className='text-purple-700'>w-6 h-6 (24px)</code>
                  </div>
                  <div className='flex justify-between p-2 bg-white rounded'>
                    <span className='text-gray-600'>Hero Icons</span>
                    <code className='text-purple-700'>w-8 h-8 (32px)</code>
                  </div>
                </div>
              </div>

              <div>
                <h3 className='font-bold text-gray-900 mb-3 flex items-center gap-2'>
                  <Ruler className='w-5 h-5 text-green-600' />
                  المسافات
                </h3>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between p-2 bg-white rounded'>
                    <span className='text-gray-600'>Mobile Padding</span>
                    <code className='text-purple-700'>px-4 py-8</code>
                  </div>
                  <div className='flex justify-between p-2 bg-white rounded'>
                    <span className='text-gray-600'>Desktop Padding</span>
                    <code className='text-purple-700'>px-6 py-12</code>
                  </div>
                  <div className='flex justify-between p-2 bg-white rounded'>
                    <span className='text-gray-600'>Card Padding</span>
                    <code className='text-purple-700'>p-4 sm:p-6</code>
                  </div>
                  <div className='flex justify-between p-2 bg-white rounded'>
                    <span className='text-gray-600'>Gap</span>
                    <code className='text-purple-700'>gap-4 sm:gap-6</code>
                  </div>
                </div>
              </div>

              <div>
                <h3 className='font-bold text-gray-900 mb-3 flex items-center gap-2'>
                  <Maximize2 className='w-5 h-5 text-green-600' />
                  الأزرار
                </h3>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between p-2 bg-white rounded'>
                    <span className='text-gray-600'>Small Button</span>
                    <code className='text-purple-700'>h-8 px-3</code>
                  </div>
                  <div className='flex justify-between p-2 bg-white rounded'>
                    <span className='text-gray-600'>Medium Button</span>
                    <code className='text-purple-700'>h-10 px-4</code>
                  </div>
                  <div className='flex justify-between p-2 bg-white rounded'>
                    <span className='text-gray-600'>Large Button</span>
                    <code className='text-purple-700'>h-12 px-6</code>
                  </div>
                  <div className='flex justify-between p-2 bg-white rounded'>
                    <span className='text-gray-600'>Icon Button</span>
                    <code className='text-purple-700'>w-10 h-10</code>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
