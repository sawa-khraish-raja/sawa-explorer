import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, ArrowRight, Clock, Globe, Heart, CheckCircle } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

/**
 * 🤖 AI Trip Planner - COMPACT VERSION
 * ====================================
 * 
 * تصميم مختصر يركز على المعلومات والوظيفة
 */

export default function AITripPlannerSection() {
  const { language } = useTranslation();

  const handlePlanTrip = () => {
    const element = document.getElementById('ai-trip-plan-container');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-br from-[#330066] via-[#7B2CBF] to-[#9933CC] relative overflow-hidden">
      
      {/* ✨ Subtle Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-300 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-white/50 overflow-hidden">
          
          <div className="grid lg:grid-cols-[1fr,auto] gap-6 p-6 sm:p-8">
            
            {/* Left: Content */}
            <div className="space-y-4">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-purple-100 px-3 py-1.5 rounded-full">
                <Sparkles className="w-4 h-4 text-purple-600" fill="currentColor" />
                <span className="text-sm font-semibold text-purple-900">
                  {language === 'ar' ? 'ذكاء اصطناعي' : 'AI-Powered'}
                </span>
              </div>

              {/* Headline */}
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                {language === 'ar' ? (
                  <>
                    خطط رحلتك في <span className="text-purple-600">30 ثانية</span>
                  </>
                ) : (
                  <>
                    Plan Your Trip in <span className="text-purple-600">30 Seconds</span>
                  </>
                )}
              </h2>

              {/* Description */}
              <p className="text-gray-600 text-base">
                {language === 'ar' 
                  ? 'برنامج يومي كامل مع أماكن، مطاعم، أسعار ومواعيد - مخصص حسب اهتماماتك وميزانيتك' 
                  : 'Complete daily itinerary with places, restaurants, prices & times - personalized to your interests & budget'}
              </p>

              {/* Quick Features */}
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Zap className="w-4 h-4 text-purple-600" />
                  <span className="font-medium">
                    {language === 'ar' ? 'نتائج فورية' : 'Instant Results'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Heart className="w-4 h-4 text-purple-600" />
                  <span className="font-medium">
                    {language === 'ar' ? 'حسب اهتماماتك' : 'Personalized'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Globe className="w-4 h-4 text-purple-600" />
                  <span className="font-medium">
                    {language === 'ar' ? 'أماكن محلية مخفية' : 'Local Gems'}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 pt-2 border-t border-gray-200">
                <div>
                  <p className="text-2xl font-bold text-purple-600">10,000+</p>
                  <p className="text-xs text-gray-600">
                    {language === 'ar' ? 'رحلة تم تخطيطها' : 'Trips Planned'}
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">4.9/5</p>
                  <p className="text-xs text-gray-600">
                    {language === 'ar' ? 'تقييم المستخدمين' : 'User Rating'}
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  {language === 'ar' ? '🆓 مجاني 100%' : '🆓 100% Free'}
                </Badge>
              </div>
            </div>

            {/* Right: CTA + Preview */}
            <div className="flex flex-col justify-center items-center lg:items-end space-y-4 lg:min-w-[280px]">
              
              {/* Mini Preview Card */}
              <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-xl border-2 border-purple-200 w-full max-w-[280px] shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">
                      {language === 'ar' ? 'اليوم الأول في دمشق' : 'Day 1 in Damascus'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {language === 'ar' ? '3 معالم • وجبتان' : '3 attractions • 2 meals'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {[
                    { icon: '🕌', name: language === 'ar' ? 'الجامع الأموي' : 'Umayyad Mosque', time: '09:00' },
                    { icon: '🍽️', name: language === 'ar' ? 'غداء محلي' : 'Local Lunch', time: '12:30' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs bg-white p-2 rounded-lg border border-purple-100">
                      <span className="text-base">{item.icon}</span>
                      <span className="flex-1 font-medium text-gray-700">{item.name}</span>
                      <span className="text-gray-500">{item.time}</span>
                    </div>
                  ))}
                </div>
                
                <p className="text-[10px] text-center text-purple-600 font-semibold mt-3 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3" fill="currentColor" />
                  {language === 'ar' ? 'تم الإنشاء في 27 ثانية' : 'Generated in 27 seconds'}
                </p>
              </div>

              {/* CTA Button */}
              <Button
                onClick={handlePlanTrip}
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              >
                <Sparkles className="w-5 h-5 mr-2" fill="currentColor" />
                {language === 'ar' ? 'خطط رحلتي الآن' : 'Plan My Trip Now'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}