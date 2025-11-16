import { CheckCircle, XCircle, Zap, TrendingUp, MapPin } from 'lucide-react';

import { Badge } from '@/shared/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';

/**
 * 🤖 AI TRIP PLANNER AUDIT
 * =========================
 *
 * تقييم شامل لموقع وتصميم AI Trip Planner
 */

export default function AIPlannerAudit() {
  return (
    <div className='max-w-6xl mx-auto p-6 space-y-6'>
      <div className='text-center mb-8'>
        <h1 className='text-4xl font-bold text-gray-900 mb-3'>🤖 تقييم AI Trip Planner</h1>
        <p className='text-lg text-gray-600'>تحليل الموقع والتصميم + خطة تطوير</p>
      </div>

      {/*  CRITICAL ISSUES */}
      <Card className='border-2 border-red-200 bg-red-50'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-red-900'>
            <XCircle className='w-6 h-6' /> المشاكل الحرجة
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 text-sm'>
          <div>
            <Badge className='bg-red-600 mb-2'>مشكلة #1: Design Issues</Badge>
            <div className='bg-white p-4 rounded-lg border border-red-200'>
              <ul className='space-y-2 text-red-800'>
                <li className='flex items-start gap-2'>
                  <XCircle className='w-4 h-4 text-red-500 flex-shrink-0 mt-0.5' />
                  <div>
                    <strong>Card صغير جداً:</strong> ما بيجذب الانتباه - يبدو عادي جداً
                  </div>
                </li>
                <li className='flex items-start gap-2'>
                  <XCircle className='w-4 h-4 text-red-500 flex-shrink-0 mt-0.5' />
                  <div>
                    <strong>No visual appeal:</strong> ما في صور أو icons كبيرة - مجرد text
                  </div>
                </li>
                <li className='flex items-start gap-2'>
                  <XCircle className='w-4 h-4 text-red-500 flex-shrink-0 mt-0.5' />
                  <div>
                    <strong>Weak CTA:</strong> زر "Try" صغير وما بيشجع على الضغط
                  </div>
                </li>
                <li className='flex items-start gap-2'>
                  <XCircle className='w-4 h-4 text-red-500 flex-shrink-0 mt-0.5' />
                  <div>
                    <strong>Lost in page:</strong> ضايع بين الـ hero والـ destinations
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <Badge className='bg-red-600 mb-2'>مشكلة #2: Placement Issues</Badge>
            <div className='bg-white p-4 rounded-lg border border-red-200'>
              <ul className='space-y-2 text-red-800'>
                <li className='flex items-start gap-2'>
                  <XCircle className='w-4 h-4 text-red-500 flex-shrink-0 mt-0.5' />
                  <div>
                    <strong>Wrong position:</strong> مكانه غريب - قبل الـ destinations مباشرة
                  </div>
                </li>
                <li className='flex items-start gap-2'>
                  <XCircle className='w-4 h-4 text-red-500 flex-shrink-0 mt-0.5' />
                  <div>
                    <strong>Breaks flow:</strong> يقطع تدفق الصفحة بشكل غير طبيعي
                  </div>
                </li>
                <li className='flex items-start gap-2'>
                  <XCircle className='w-4 h-4 text-red-500 flex-shrink-0 mt-0.5' />
                  <div>
                    <strong>No context:</strong> المستخدم لسه ما شاف أي شي عن المنصة
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <Badge className='bg-red-600 mb-2'>مشكلة #3: Content Issues</Badge>
            <div className='bg-white p-4 rounded-lg border border-red-200'>
              <ul className='space-y-2 text-red-800'>
                <li className='flex items-start gap-2'>
                  <XCircle className='w-4 h-4 text-red-500 flex-shrink-0 mt-0.5' />
                  <div>
                    <strong>Weak messaging:</strong> "Instant itinerary" مش واضح كفاية
                  </div>
                </li>
                <li className='flex items-start gap-2'>
                  <XCircle className='w-4 h-4 text-red-500 flex-shrink-0 mt-0.5' />
                  <div>
                    <strong>No examples:</strong> ما في preview أو أمثلة على الخطط
                  </div>
                </li>
                <li className='flex items-start gap-2'>
                  <XCircle className='w-4 h-4 text-red-500 flex-shrink-0 mt-0.5' />
                  <div>
                    <strong>No benefits:</strong> ما بيوضح ليش المستخدم لازم يجربه
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PLACEMENT ANALYSIS */}
      <Card className='border-2 border-yellow-200 bg-yellow-50'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-yellow-900'>
            <MapPin className='w-6 h-6' />
            تحليل الموقع الحالي vs المقترح
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 text-sm'>
          <div className='grid md:grid-cols-2 gap-4'>
            {/* Current */}
            <div className='bg-red-50 p-4 rounded-lg border-2 border-red-200'>
              <h4 className='font-bold text-red-900 mb-3 flex items-center gap-2'>
                <XCircle className='w-4 h-4' /> الموقع الحالي
              </h4>
              <div className='space-y-2 text-xs text-red-800'>
                <div className='bg-white p-3 rounded border border-red-200'>
                  <strong>Position:</strong> بعد الـ Hero مباشرة
                </div>
                <div>
                  <strong>Problems:</strong>
                  <ul className='list-disc list-inside mt-1 space-y-1'>
                    <li>المستخدم لسه ما فهم المنصة</li>
                    <li>بيقطع تدفق "اكتشف الوجهات"</li>
                    <li>ما في context ليش يجربه</li>
                    <li>Conversion rate منخفض</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Proposed */}
            <div className='bg-green-50 p-4 rounded-lg border-2 border-green-200'>
              <h4 className='font-bold text-green-900 mb-3 flex items-center gap-2'>
                <CheckCircle className='w-4 h-4' />
                الموقع المقترح
              </h4>
              <div className='space-y-2 text-xs text-green-800'>
                <div className='bg-white p-3 rounded border border-green-200'>
                  <strong>Position:</strong> بعد Destinations + Services
                </div>
                <div>
                  <strong>Benefits:</strong>
                  <ul className='list-disc list-inside mt-1 space-y-1'>
                    <li>المستخدم شاف الوجهات</li>
                    <li>فهم الخدمات المتاحة</li>
                    <li>جاهز لتجربة AI planning</li>
                    <li>Conversion rate أعلى</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className='bg-white p-4 rounded-lg border border-yellow-200'>
            <h4 className='font-bold text-yellow-900 mb-2'>ترتيب الصفحة المقترح:</h4>
            <ol className='space-y-1 text-yellow-800 text-xs'>
              <li className='flex items-center gap-2'>
                <Badge className='bg-purple-600'>1</Badge>
                <span>
                  <strong>Hero + Search Bar</strong> - أول انطباع
                </span>
              </li>
              <li className='flex items-center gap-2'>
                <Badge className='bg-purple-600'>2</Badge>
                <span>
                  <strong>Destinations</strong> - يشوف الأماكن المتاحة
                </span>
              </li>
              <li className='flex items-center gap-2'>
                <Badge className='bg-purple-600'>3</Badge>
                <span>
                  <strong>Services</strong> - يفهم الخدمات
                </span>
              </li>
              <li className='flex items-center gap-2'>
                <Badge className='bg-purple-600'>4</Badge>
                <span>
                  <strong>Adventures</strong> - يشوف التجارب
                </span>
              </li>
              <li className='flex items-center gap-2'>
                <Badge className='bg-green-600'>5</Badge>
                <span>
                  <strong>✨ AI Trip Planner ✨</strong> - الآن جاهز لتجربة التخطيط!
                </span>
              </li>
              <li className='flex items-center gap-2'>
                <Badge className='bg-purple-600'>6</Badge>
                <span>
                  <strong>Why SAWA</strong> - يعزز الثقة
                </span>
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/*  SOLUTION */}
      <Card className='border-2 border-green-200 bg-green-50'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-green-900'>
            <TrendingUp className='w-6 h-6' />
            الحل الاحترافي
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 text-sm'>
          <div>
            <Badge className='bg-green-600 mb-2'>Enhancement #1: Redesign</Badge>
            <div className='bg-white p-4 rounded-lg border border-green-200'>
              <h4 className='font-bold text-green-900 mb-2'>تحسينات التصميم:</h4>
              <ul className='space-y-2 text-green-800'>
                <li className='flex items-start gap-2'>
                  <CheckCircle className='w-4 h-4 text-green-600 flex-shrink-0 mt-0.5' />
                  <div>
                    <strong>Larger hero card:</strong> section كامل مع background gradient
                  </div>
                </li>
                <li className='flex items-start gap-2'>
                  <CheckCircle className='w-4 h-4 text-green-600 flex-shrink-0 mt-0.5' />
                  <div>
                    <strong>Visual examples:</strong> صور لخطط سفر تم إنشاؤها
                  </div>
                </li>
                <li className='flex items-start gap-2'>
                  <CheckCircle className='w-4 h-4 text-green-600 flex-shrink-0 mt-0.5' />
                  <div>
                    <strong>Better CTA:</strong> زر كبير واضح "Plan My Trip Now"
                  </div>
                </li>
                <li className='flex items-start gap-2'>
                  <CheckCircle className='w-4 h-4 text-green-600 flex-shrink-0 mt-0.5' />
                  <div>
                    <strong>Features list:</strong> نقاط توضح المزايا (personalized, instant, free)
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <Badge className='bg-green-600 mb-2'>Enhancement #2: Reposition</Badge>
            <div className='bg-white p-4 rounded-lg border border-green-200'>
              <h4 className='font-bold text-green-900 mb-2'>نقل الموقع:</h4>
              <ul className='space-y-2 text-green-800'>
                <li className='flex items-start gap-2'>
                  <CheckCircle className='w-4 h-4 text-green-600 flex-shrink-0 mt-0.5' />
                  <div>
                    <strong>After Adventures section:</strong> المستخدم شاف كل شي
                  </div>
                </li>
                <li className='flex items-start gap-2'>
                  <CheckCircle className='w-4 h-4 text-green-600 flex-shrink-0 mt-0.5' />
                  <div>
                    <strong>Before Why SAWA:</strong> natural flow - من الاستكشاف للتخطيط للثقة
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <Badge className='bg-green-600 mb-2'>Enhancement #3: Better Content</Badge>
            <div className='bg-white p-4 rounded-lg border border-green-200'>
              <h4 className='font-bold text-green-900 mb-2'>تحسين المحتوى:</h4>
              <ul className='space-y-2 text-green-800'>
                <li className='flex items-start gap-2'>
                  <CheckCircle className='w-4 h-4 text-green-600 flex-shrink-0 mt-0.5' />
                  <div>
                    <strong>Clear headline:</strong> "Plan Your Perfect Trip in 30 Seconds"
                  </div>
                </li>
                <li className='flex items-start gap-2'>
                  <CheckCircle className='w-4 h-4 text-green-600 flex-shrink-0 mt-0.5' />
                  <div>
                    <strong>Benefits:</strong> "🎯 Personalized • ⚡ Instant • 🆓 Free"
                  </div>
                </li>
                <li className='flex items-start gap-2'>
                  <CheckCircle className='w-4 h-4 text-green-600 flex-shrink-0 mt-0.5' />
                  <div>
                    <strong>Social proof:</strong> "10,000+ trips planned"
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 🎯 ACTION PLAN */}
      <Card className='border-2 border-blue-200 bg-blue-50'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-blue-900'>
            <Zap className='w-6 h-6' />
            🎯 خطة التنفيذ
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 text-sm'>
          <div className='grid md:grid-cols-3 gap-3'>
            <div className='bg-white p-3 rounded-lg border border-blue-200'>
              <Badge className='bg-blue-600 mb-2'>Step 1</Badge>
              <h4 className='font-bold text-blue-900 text-xs mb-1'>Redesign Component</h4>
              <p className='text-xs text-blue-800'>إنشاء component جديد أكبر وأجمل</p>
            </div>

            <div className='bg-white p-3 rounded-lg border border-blue-200'>
              <Badge className='bg-blue-600 mb-2'>Step 2</Badge>
              <h4 className='font-bold text-blue-900 text-xs mb-1'>Reposition</h4>
              <p className='text-xs text-blue-800'>نقل الـ section بعد Adventures</p>
            </div>

            <div className='bg-white p-3 rounded-lg border border-blue-200'>
              <Badge className='bg-blue-600 mb-2'>Step 3</Badge>
              <h4 className='font-bold text-blue-900 text-xs mb-1'>A/B Test</h4>
              <p className='text-xs text-blue-800'>قياس التحسين في الـ conversion</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
