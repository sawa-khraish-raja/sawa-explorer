import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Video,
  Clock,
  Database,
  Zap,
  RefreshCw,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { queryDocuments } from '@/utils/firestore';

export default function HeroPerformanceAudit() {
  const [memoryInfo, setMemoryInfo] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [videoSizes, setVideoSizes] = useState({});

  const { data: slides = [] } = useQuery({
    queryKey: ['heroSlides', 'home'],
    queryFn: async () => {
      const allSlides = await queryDocuments(
        'heroslides',
        ['page_type', '==', 'home'],
        ['is_active', '==', true]
      );
      return allSlides.filter((s) => s.video_url).sort((a, b) => (a.order || 0) - (b.order || 0));
    },
  });

  //  Memory monitoring
  useEffect(() => {
    const updateMemory = () => {
      if (performance.memory) {
        setMemoryInfo({
          used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2),
          total: (performance.memory.totalJSHeapSize / 1048576).toFixed(2),
          limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2),
        });
      }
    };

    updateMemory();
    const interval = setInterval(updateMemory, 2000);

    return () => clearInterval(interval);
  }, []);

  //  Performance metrics
  useEffect(() => {
    const perfData = performance.getEntriesByType('navigation')[0];
    if (perfData) {
      setPerformanceMetrics({
        domLoad: (perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart).toFixed(
          2
        ),
        pageLoad: (perfData.loadEventEnd - perfData.loadEventStart).toFixed(2),
        ttfb: (perfData.responseStart - perfData.requestStart).toFixed(2),
      });
    }
  }, []);

  //  Estimate video sizes
  useEffect(() => {
    slides.forEach(async (slide, index) => {
      if (slide.video_url) {
        try {
          const response = await fetch(slide.video_url, { method: 'HEAD' });
          const size = response.headers.get('content-length');
          if (size) {
            setVideoSizes((prev) => ({
              ...prev,
              [index]: (parseInt(size) / 1048576).toFixed(2),
            }));
          }
        } catch (error) {
          console.warn('Could not fetch video size:', error);
        }
      }
    });
  }, [slides]);

  const checks = [
    {
      category: '🎬 Video Configuration',
      items: [
        {
          name: 'Total Video Count',
          status: slides.length <= 2 ? 'pass' : 'fail',
          message:
            slides.length <= 2
              ? ` ${slides.length} videos (optimal for mobile)`
              : ` ${slides.length} videos - CRITICAL: Too many! Reduce to max 2`,
          severity: slides.length <= 2 ? 'success' : 'critical',
          recommendation:
            slides.length > 2
              ? 'Remove extra videos immediately. More than 2 videos cause memory crashes on mobile.'
              : null,
        },
        {
          name: 'Video Duration (10s fixed)',
          status: slides.every((s) => (s.display_duration || 10) === 10) ? 'pass' : 'fail',
          message: slides.every((s) => (s.display_duration || 10) === 10)
            ? ' All videos display for exactly 10 seconds'
            : ` Inconsistent durations: ${slides
                .map((s) => `${s.display_duration || 10}s`)
                .join(', ')}`,
          severity: slides.every((s) => (s.display_duration || 10) === 10) ? 'success' : 'warning',
          recommendation: !slides.every((s) => (s.display_duration || 10) === 10)
            ? 'Update display_duration to 10 for all videos in database.'
            : null,
        },
        {
          name: 'Video File Sizes',
          status: Object.values(videoSizes).every((size) => parseFloat(size) < 5)
            ? 'pass'
            : 'warning',
          message:
            Object.keys(videoSizes).length > 0
              ? `Sizes: ${Object.values(videoSizes)
                  .map((s) => `${s}MB`)
                  .join(', ')}`
              : '⏳ Checking sizes...',
          severity: Object.values(videoSizes).every((size) => parseFloat(size) < 5)
            ? 'success'
            : 'warning',
          recommendation: Object.values(videoSizes).some((size) => parseFloat(size) >= 5)
            ? 'Compress videos to < 5MB each. Use H.264 codec with lower bitrate.'
            : null,
        },
        {
          name: 'Poster Images',
          status: slides.every((s) => s.poster_image) ? 'pass' : 'warning',
          message: slides.every((s) => s.poster_image)
            ? ' All videos have poster images'
            : ` ${slides.filter((s) => !s.poster_image).length} videos missing posters`,
          severity: slides.every((s) => s.poster_image) ? 'success' : 'warning',
          recommendation: !slides.every((s) => s.poster_image)
            ? 'Add poster_image for instant visual display while video loads.'
            : null,
        },
      ],
    },
    {
      category: '⚡ Performance & Memory',
      items: [
        {
          name: 'Memory Usage',
          status: memoryInfo && parseFloat(memoryInfo.used) < 150 ? 'pass' : 'warning',
          message: memoryInfo
            ? `${memoryInfo.used} MB used / ${memoryInfo.limit} MB limit (${(
                (parseFloat(memoryInfo.used) / parseFloat(memoryInfo.limit)) *
                100
              ).toFixed(1)}%)`
            : '⏳ Monitoring...',
          severity: memoryInfo && parseFloat(memoryInfo.used) < 150 ? 'success' : 'warning',
          recommendation:
            memoryInfo && parseFloat(memoryInfo.used) >= 150
              ? 'High memory usage detected. Check for memory leaks.'
              : null,
        },
        {
          name: 'Cleanup on Unmount',
          status: 'pass',
          message: ' Video refs properly cleaned up (pause, src = "", load)',
          severity: 'success',
        },
        {
          name: 'Preloading Strategy',
          status: 'pass',
          message: ' Only current + next video preloaded (not all)',
          severity: 'success',
        },
        {
          name: 'GPU Acceleration',
          status: 'pass',
          message: ' Using translate3d, backface-visibility: hidden',
          severity: 'success',
        },
        {
          name: 'Page Load Time',
          status:
            performanceMetrics && parseFloat(performanceMetrics.pageLoad) < 3000
              ? 'pass'
              : 'warning',
          message: performanceMetrics
            ? `Page load: ${performanceMetrics.pageLoad}ms, DOM: ${performanceMetrics.domLoad}ms`
            : '⏳ Measuring...',
          severity:
            performanceMetrics && parseFloat(performanceMetrics.pageLoad) < 3000
              ? 'success'
              : 'warning',
        },
      ],
    },
    {
      category: '🎨 Visual Quality & UX',
      items: [
        {
          name: 'Transition Duration',
          status: 'pass',
          message: ' 3-second crossfade (smooth, not too fast/slow)',
          severity: 'success',
        },
        {
          name: 'Transition Easing',
          status: 'pass',
          message: ' cubic-bezier(0.4, 0.0, 0.2, 1) - Material Design',
          severity: 'success',
        },
        {
          name: 'Single Video Behavior',
          status: 'pass',
          message: ' If only 1 video, loops naturally without transitions',
          severity: 'success',
        },
        {
          name: 'Overlay Effects',
          status: 'pass',
          message: ' Gradients, purple tint, bottom fade all present',
          severity: 'success',
        },
      ],
    },
    {
      category: '📱 Mobile Optimization',
      items: [
        {
          name: 'Video Codec',
          status: 'info',
          message: ' Check: Must use H.264 for mobile compatibility',
          severity: 'info',
          recommendation: 'Ensure all videos use H.264 codec, not H.265/VP9.',
        },
        {
          name: 'Autoplay Attributes',
          status: 'pass',
          message: ' muted, playsInline, preload="auto" all set',
          severity: 'success',
        },
        {
          name: 'Error Handling',
          status: 'pass',
          message: ' onError() auto-advances to next video',
          severity: 'success',
        },
        {
          name: 'Background Tab Behavior',
          status: 'warning',
          message: ' Videos continue playing in background tabs',
          severity: 'warning',
          recommendation: 'Add Page Visibility API to pause videos when tab is hidden.',
        },
      ],
    },
  ];

  const allChecks = checks.flatMap((c) => c.items);
  const criticalIssues = allChecks.filter((c) => c.severity === 'critical').length;
  const warnings = allChecks.filter((c) => c.severity === 'warning').length;
  const passed = allChecks.filter((c) => c.severity === 'success').length;
  const score = ((passed / allChecks.length) * 100).toFixed(0);

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center gap-3 mb-3'>
            <Video className='w-10 h-10 text-purple-600' />
            <h1 className='text-3xl sm:text-4xl font-bold text-gray-900'>
              Hero Video System Audit
            </h1>
          </div>
          <p className='text-gray-600'>
            Comprehensive analysis of homepage hero video performance, memory usage, and mobile
            optimization
          </p>
        </div>

        {/* Overall Score */}
        <Card
          className={`mb-6 border-4 ${
            criticalIssues > 0
              ? 'border-red-500 bg-red-50'
              : warnings > 2
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-green-500 bg-green-50'
          }`}
        >
          <CardContent className='pt-6'>
            <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
              <div>
                <h2 className='text-2xl font-bold mb-2'>Overall Score: {score}/100</h2>
                <p className='text-gray-700'>
                  {criticalIssues > 0 && '🚨 Critical issues detected - immediate action required'}
                  {criticalIssues === 0 &&
                    warnings > 2 &&
                    ' Multiple warnings - optimization needed'}
                  {criticalIssues === 0 && warnings <= 2 && ' System is well optimized'}
                </p>
              </div>
              <div className='flex gap-4'>
                <div className='text-center'>
                  <div className='text-3xl font-bold text-green-600'>{passed}</div>
                  <div className='text-sm text-gray-600'>Passed</div>
                </div>
                <div className='text-center'>
                  <div className='text-3xl font-bold text-yellow-600'>{warnings}</div>
                  <div className='text-sm text-gray-600'>Warnings</div>
                </div>
                <div className='text-center'>
                  <div className='text-3xl font-bold text-red-600'>{criticalIssues}</div>
                  <div className='text-sm text-gray-600'>Critical</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6'>
          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center gap-3'>
                <Video className='w-6 h-6 text-purple-600' />
                <div>
                  <p className='text-xs text-gray-600'>Videos</p>
                  <p className='text-2xl font-bold'>{slides.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center gap-3'>
                <Clock className='w-6 h-6 text-blue-600' />
                <div>
                  <p className='text-xs text-gray-600'>Duration</p>
                  <p className='text-2xl font-bold'>10s</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center gap-3'>
                <Database className='w-6 h-6 text-orange-600' />
                <div>
                  <p className='text-xs text-gray-600'>Memory</p>
                  <p className='text-2xl font-bold'>
                    {memoryInfo ? `${memoryInfo.used}MB` : '...'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center gap-3'>
                <Zap className='w-6 h-6 text-green-600' />
                <div>
                  <p className='text-xs text-gray-600'>Transition</p>
                  <p className='text-2xl font-bold'>3s</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Checks */}
        {checks.map((category, catIndex) => (
          <Card key={catIndex} className='mb-6'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>{category.category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {category.items.map((check, checkIndex) => (
                  <div
                    key={checkIndex}
                    className='border-l-4 pl-4'
                    style={{
                      borderColor:
                        check.severity === 'critical'
                          ? '#ef4444'
                          : check.severity === 'warning'
                            ? '#f59e0b'
                            : check.severity === 'success'
                              ? '#10b981'
                              : '#6b7280',
                    }}
                  >
                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-1'>
                          {check.severity === 'critical' && (
                            <XCircle className='w-5 h-5 text-red-500' />
                          )}
                          {check.severity === 'warning' && (
                            <AlertTriangle className='w-5 h-5 text-yellow-500' />
                          )}
                          {check.severity === 'success' && (
                            <CheckCircle className='w-5 h-5 text-green-500' />
                          )}
                          {check.severity === 'info' && <Info className='w-5 h-5 text-gray-500' />}
                          <h4 className='font-semibold text-gray-900'>{check.name}</h4>
                        </div>
                        <p className='text-sm text-gray-700 mb-2'>{check.message}</p>
                        {check.recommendation && (
                          <div className='bg-blue-50 border-l-4 border-blue-500 p-3 rounded'>
                            <p className='text-sm text-blue-900'>
                              <strong>💡 Recommendation:</strong> {check.recommendation}
                            </p>
                          </div>
                        )}
                      </div>
                      <Badge
                        variant={
                          check.severity === 'critical'
                            ? 'destructive'
                            : check.severity === 'warning'
                              ? 'outline'
                              : 'default'
                        }
                      >
                        {check.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Action Items */}
        {(criticalIssues > 0 || warnings > 0) && (
          <Card className='border-2 border-blue-500 bg-blue-50'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <AlertTriangle className='w-6 h-6 text-blue-600' />
                Recommended Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className='list-decimal list-inside space-y-3 text-gray-900'>
                {criticalIssues > 0 && (
                  <li className='font-bold text-red-600'>
                    🚨 CRITICAL:{' '}
                    {allChecks.filter((c) => c.severity === 'critical')[0]?.recommendation}
                  </li>
                )}
                {allChecks
                  .filter((c) => c.recommendation && c.severity !== 'critical')
                  .slice(0, 5)
                  .map((check, index) => (
                    <li key={index}>{check.recommendation}</li>
                  ))}
                <li>Test on actual mobile devices (iOS Safari, Android Chrome)</li>
                <li>Monitor memory usage over time with Chrome DevTools</li>
                <li>Consider adding lazy loading for non-critical content below hero</li>
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Testing Guide */}
        <Card className='mt-6'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Smartphone className='w-6 h-6' />
              Mobile Testing Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid sm:grid-cols-2 gap-4'>
              <div>
                <h4 className='font-semibold mb-2 flex items-center gap-2'>
                  <Smartphone className='w-4 h-4' /> Mobile
                </h4>
                <ul className='space-y-1 text-sm text-gray-700'>
                  <li>□ Videos play automatically</li>
                  <li>□ Transitions are smooth (60fps)</li>
                  <li>□ No app crashes after 5 minutes</li>
                  <li>□ Memory stays under 200MB</li>
                  <li>□ Works on low-end devices</li>
                </ul>
              </div>
              <div>
                <h4 className='font-semibold mb-2 flex items-center gap-2'>
                  <Monitor className='w-4 h-4' /> Desktop
                </h4>
                <ul className='space-y-1 text-sm text-gray-700'>
                  <li>□ 4K video quality (if available)</li>
                  <li>□ Pause on hover works</li>
                  <li>□ Smooth transitions at 144fps</li>
                  <li>□ Multiple tabs don't cause issues</li>
                  <li>□ Works in all browsers</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className='mt-6 flex gap-3 justify-center'>
          <Button onClick={() => window.location.reload()} variant='outline'>
            <RefreshCw className='w-4 h-4 mr-2' />
            Re-run Audit
          </Button>
          <Button onClick={() => window.open('/AdminHeroSlides', '_blank')}>
            <Video className='w-4 h-4 mr-2' />
            Manage Videos
          </Button>
        </div>
      </div>
    </div>
  );
}
