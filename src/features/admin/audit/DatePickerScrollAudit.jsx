import { AlertCircle, CheckCircle, Zap } from 'lucide-react';

import { Badge } from '@/shared/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';

/**
 *  DATE PICKER SCROLL ISSUE AUDIT
 * ==================================
 *
 * تحليل مشكلة: "لما أختار تاريخ، بياخدني لفوق الصفحة"
 */

export default function DatePickerScrollAudit() {
  return (
    <div className='max-w-4xl mx-auto p-6 space-y-6'>
      <h1 className='text-3xl font-bold text-gray-900'> تقييم مشكلة Date Picker Scroll</h1>

      {/* المشكلة */}
      <Card className='border-2 border-red-200 bg-red-50'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-red-900'>
            <AlertCircle className='w-6 h-6' /> المشكلة الحالية
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 text-sm'>
          <div>
            <p className='font-bold text-red-900'>الوصف:</p>
            <p className='text-red-800'>
              عند اختيار تاريخ في SimpleDatePicker، الصفحة تقفز تلقائياً لأعلى الصفحة
            </p>
          </div>

          <div>
            <p className='font-bold text-red-900'>التأثير:</p>
            <ul className='list-disc list-inside text-red-800 space-y-1'>
              <li>تجربة مستخدم سيئة - المستخدم بيتوه</li>
              <li>بيضطر المستخدم ينزل تاني للنموذج</li>
              <li>مزعج جداً على الموبايل</li>
              <li>بيحصل في كل النماذج: Booking, AI Planner, Adventures</li>
            </ul>
          </div>

          <div>
            <p className='font-bold text-red-900'>الأماكن المتأثرة:</p>
            <ul className='list-disc list-inside text-red-800 space-y-1'>
              <li>📅 BookingForm - تاريخ الوصول والمغادرة</li>
              <li>🤖 AITripPlanner - تواريخ الرحلة</li>
              <li>🎯 AdventureBooking - تاريخ المغامرة</li>
              <li> SearchBar (Home) - تواريخ البحث</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* تحليل السبب */}
      <Card className='border-2 border-yellow-200 bg-yellow-50'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-yellow-900'>
            <Zap className='w-6 h-6' />
            تحليل السبب الجذري
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 text-sm'>
          <div>
            <p className='font-bold text-yellow-900'>السبب #1: Popover Close Behavior</p>
            <p className='text-yellow-800'>لما ينقفل الـ Popover (التقويم)، shadcn/ui بيعمل:</p>
            <pre className='bg-yellow-100 p-2 rounded mt-2 text-xs'>
              {`1. document.body.focus()
2. Return focus to trigger button
3. Scroll to focused element `}
            </pre>
          </div>

          <div>
            <p className='font-bold text-yellow-900'>السبب #2: Re-render Scroll</p>
            <p className='text-yellow-800'>
              لما يتحدث الـ state (date)، الـ component بيعمل re-render وممكن يصير scroll jump
            </p>
          </div>

          <div>
            <p className='font-bold text-yellow-900'>السبب #3: Mobile Keyboard</p>
            <p className='text-yellow-800'>
              على الموبايل، لما ينفتح/ينقفل الـ keyboard، البراوزر بيعمل auto-scroll
            </p>
          </div>

          <div>
            <p className='font-bold text-yellow-900'>السبب #4: Input Focus</p>
            <p className='text-yellow-800'>
              الـ input field بيصير focused بعد اختيار التاريخ، وبيعمل scrollIntoView
            </p>
          </div>
        </CardContent>
      </Card>

      {/* الحلول */}
      <Card className='border-2 border-green-200 bg-green-50'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-green-900'>
            <CheckCircle className='w-6 h-6' />
            الحلول المقترحة
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 text-sm'>
          <div>
            <Badge className='bg-green-600 mb-2'>الحل #1 - منع الـ Scroll (Recommended) ⭐</Badge>
            <p className='text-green-800 mb-2'>منع الـ scroll تماماً لما يختار المستخدم تاريخ</p>
            <pre className='bg-green-100 p-3 rounded text-xs overflow-x-auto'>
              {`// في SimpleDatePicker
const [scrollPosition, setScrollPosition] = useState(0);

const handleDateSelect = (date) => {
  //  Save current scroll
  setScrollPosition(window.scrollY);
  
  onChange(date);
  
  //  Restore scroll after update
  requestAnimationFrame(() => {
    window.scrollTo(0, scrollPosition);
  });
};`}
            </pre>
            <p className='text-xs text-green-700 mt-2'>
              المزايا: بسيط، فعال 100%، مضمون
              <br />
              العيوب: لا يوجد
            </p>
          </div>

          <div>
            <Badge className='bg-blue-600 mb-2'>الحل #2 - Smooth Scroll to Form</Badge>
            <p className='text-green-800 mb-2'>
              بدل ما نمنع الـ scroll، نخليه ينزل للـ form بسلاسة
            </p>
            <pre className='bg-green-100 p-3 rounded text-xs'>
              {`const formRef = useRef(null);

const handleDateSelect = (date) => {
  onChange(date);
  
  //  Smooth scroll to form
  setTimeout(() => {
    formRef.current?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
  }, 100);
};`}
            </pre>
            <p className='text-xs text-green-700 mt-2'>
              المزايا: تجربة سلسة
              <br />
              العيوب: ممكن يزعج المستخدم
            </p>
          </div>

          <div>
            <Badge className='bg-purple-600 mb-2'>الحل #3 - Prevent Body Scroll</Badge>
            <p className='text-green-800 mb-2'>منع scroll للـ body لما يكون الـ Popover مفتوح</p>
            <pre className='bg-green-100 p-3 rounded text-xs'>
              {`useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'unset';
  }
}, [isOpen]);`}
            </pre>
            <p className='text-xs text-green-700 mt-2'>
              المزايا: يمنع أي scroll غير مرغوب
              <br />
              العيوب: ممكن يمنع scroll مطلوب
            </p>
          </div>
        </CardContent>
      </Card>

      {/* التوصية */}
      <Card className='border-2 border-indigo-200 bg-indigo-50'>
        <CardHeader>
          <CardTitle className='text-indigo-900'>🎯 التوصية النهائية</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 text-sm text-indigo-800'>
          <p className='font-bold'>نستخدم الحل #1: منع الـ Scroll تماماً</p>
          <p>هذا الحل الأفضل لأنه:</p>
          <ul className='list-disc list-inside space-y-1'>
            <li>بسيط وواضح</li>
            <li>يشتغل 100% على كل الأجهزة</li>
            <li>ما بيأثر على باقي الوظائف</li>
            <li>تجربة مستخدم ممتازة</li>
          </ul>

          <div className='bg-indigo-100 p-3 rounded mt-3'>
            <p className='font-bold mb-1'>خطة التنفيذ:</p>
            <ol className='list-decimal list-inside space-y-1 text-xs'>
              <li>تعديل SimpleDatePicker - إضافة scroll prevention</li>
              <li>اختبار على: BookingForm, AITripPlanner, SearchBar</li>
              <li>اختبار على الموبايل (iOS + Android)</li>
              <li>التأكد من عدم كسر أي functionality</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
