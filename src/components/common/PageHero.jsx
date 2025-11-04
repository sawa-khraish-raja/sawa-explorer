import { cn } from '@/lib/utils';

import PageHeroVideo from './PageHeroVideo';

export default function PageHero({
  title,
  subtitle,
  backgroundImage,
  gradient = true,
  size = 'medium',
  align = 'left',
  badge,
  actions,
  overlay = 'dark',
  pageName, //  pageName to load correct videos
}) {
  const sizeClasses = {
    small: 'py-12 sm:py-16 lg:py-20',
    medium: 'py-16 sm:py-24 lg:py-32',
    large: 'py-24 sm:py-32 lg:py-40',
  };

  const overlayClasses = {
    dark: 'bg-gradient-to-br from-black/70 via-black/50 to-black/70',
    light: 'bg-gradient-to-br from-white/80 via-white/60 to-white/80',
    gradient: 'bg-gradient-to-br from-[#330066]/90 via-[#7B2CBF]/80 to-[#9933CC]/90',
  };

  return (
    <section className={cn('relative overflow-hidden', sizeClasses[size])}>
      {/*  Video support with proper page filtering */}
      {pageName && <PageHeroVideo pageType={pageName} />}

      {/*  Fallback to image if no pageName */}
      {!pageName && backgroundImage && (
        <div className='absolute inset-0'>
          <img src={backgroundImage} alt='' className='w-full h-full object-cover' loading='lazy' />
          <div className={cn('absolute inset-0', overlayClasses[overlay])} />
        </div>
      )}

      {!pageName && !backgroundImage && gradient && (
        <div className='absolute inset-0 bg-gradient-to-br from-[#E6E6FF] via-white to-[#CCCCFF]' />
      )}

      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-24 -right-24 w-96 h-96 bg-[#9933CC] opacity-10 rounded-full blur-3xl' />
        <div className='absolute -bottom-24 -left-24 w-96 h-96 bg-[#330066] opacity-10 rounded-full blur-3xl' />
      </div>

      <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-12'>
        <div className='flex flex-col gap-6 w-full'>
          {badge && (
            <div className='inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-[#D9B3FF] w-fit'>
              {badge.icon && <span className='text-[#9933CC]'>{badge.icon}</span>}
              <span className='text-sm font-semibold text-[#330066]'>{badge.text}</span>
            </div>
          )}

          <h1 className='text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight text-white'>
            {title}
          </h1>

          {subtitle && <p className='text-xl sm:text-2xl max-w-3xl text-white/90'>{subtitle}</p>}

          {actions && <div className='flex flex-wrap gap-4 mt-4'>{actions}</div>}
        </div>
      </div>

      <div className='absolute bottom-0 left-0 right-0 h-24'>
        <svg
          className='w-full h-full'
          viewBox='0 0 1440 120'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          preserveAspectRatio='none'
        >
          <path
            d='M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z'
            fill='white'
            fillOpacity='1'
          />
        </svg>
      </div>
    </section>
  );
}
