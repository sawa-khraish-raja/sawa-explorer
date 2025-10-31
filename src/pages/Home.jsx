import React, { lazy, Suspense, useEffect } from "react";
import SearchBar from "../components/home/SearchBar";
import PageHeroVideo from "../components/common/PageHeroVideo";
import { useTranslation } from "../components/i18n/LanguageContext";
import { normalizeText } from "../components/utils/textHelpers";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const DestinationIcons = lazy(() => import("../components/home/DestinationIcons"));
const AITripPlanner = lazy(() => import("../components/home/AITripPlanner"));
const WhyChooseSawa = lazy(() => import("../components/home/WhyChooseSawa"));
const ServicesSection = lazy(() => import("../components/home/ServicesSection"));
const AdventuresHomeSection = lazy(() => import("../components/home/AdventuresHomeSection"));

const LoadingFallback = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="w-8 h-8 animate-spin text-[#9933CC]" />
  </div>
);

export default function Home() {
  const { t, language } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const scrollToAIPlanner = () => {
    const element = document.getElementById('ai-trip-plan-container');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="bg-white overflow-x-hidden">
      {/* ✅ HERO SECTION - Video Only */}
      <section id="search-bar-home" className="relative h-[85vh] sm:h-[90vh] lg:h-[95vh] overflow-hidden bg-black">
        <PageHeroVideo pageType="home" />
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Hero Title */}
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight mb-4 sm:mb-6">
              {language === 'ar' ? (
                <span className="text-white drop-shadow-2xl">
                  بهجة الحياة المحلية
                </span>
              ) : (
                <span className="text-white drop-shadow-2xl">
                  Local Life's Joy
                </span>
              )}
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-white/95 font-medium drop-shadow-lg max-w-2xl mx-auto">
              {language === 'ar' 
                ? 'اكتشف تجارب أصيلة مع مضيفين محليين موثوقين' 
                : 'Discover authentic experiences with trusted local hosts'}
            </p>
          </div>

          {/* Search Bar + AI Button */}
          <div className="w-full max-w-4xl space-y-4">
            <SearchBar />
            
            {/* AI Planner Button */}
            <div className="flex justify-center">
              <Button
                onClick={scrollToAIPlanner}
                variant="ghost"
                className="group bg-white/95 backdrop-blur-md hover:bg-white border-2 border-white/50 hover:border-[#9933CC]/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-6 py-3 h-auto"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden bg-white p-0.5 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <img
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e8bf2aebfc9660599d11a9/e62457e5e_WhatsAppImage2025-10-16at235513_248ceca9.jpg"
                      alt="SAWA AI"
                      className="w-full h-full object-cover rounded-full"
                      loading="eager"
                    />
                  </div>
                  <span className="text-sm sm:text-base font-semibold bg-gradient-to-r from-[#330066] to-[#9933CC] bg-clip-text text-transparent">
                    {language === 'ar' ? 'خطط رحلتك بالذكاء الاصطناعي' : 'Plan Your Trip with AI'}
                  </span>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ✨ DESTINATIONS */}
      <Suspense fallback={<LoadingFallback />}>
        <section id="destinations" className="py-16 sm:py-20 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
                {normalizeText(t('home.destinations_title'))}
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl">
                {language === 'ar' 
                  ? 'استكشف مدن الشرق الأوسط مع مضيفين محليين' 
                  : 'Explore Middle Eastern cities with local hosts'}
              </p>
            </div>
            <DestinationIcons />
          </div>
        </section>
      </Suspense>

      {/* ✨ SERVICES */}
      <Suspense fallback={<LoadingFallback />}>
        <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
                {language === 'ar' ? 'الخدمات التي نقدمها' : 'Services We Offer'}
              </h2>
              <p className="text-lg sm:text-xl text-gray-600">
                {language === 'ar' ? 'كل ما تحتاجه لرحلة لا تُنسى' : 'Everything you need for an unforgettable journey'}
              </p>
            </div>
            <ServicesSection />
          </div>
        </section>
      </Suspense>

      {/* ✨ ADVENTURES */}
      <Suspense fallback={<LoadingFallback />}>
        <section className="py-16 sm:py-20 lg:py-24 bg-white">
          <AdventuresHomeSection />
        </section>
      </Suspense>

      {/* ✨ WHY CHOOSE SAWA */}
      <Suspense fallback={<LoadingFallback />}>
        <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-purple-50 via-white to-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
                {t('home.why_sawa_title')}
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                {t('home.why_sawa_subtitle')}
              </p>
            </div>
            <WhyChooseSawa />
          </div>
        </section>
      </Suspense>

      {/* ✨ AI TRIP PLANNER */}
      <Suspense fallback={<LoadingFallback />}>
        <section id="ai-trip-plan-container" className="py-16 sm:py-20 lg:py-24 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <AITripPlanner />
          </div>
        </section>
      </Suspense>
    </div>
  );
}