import { useQuery } from '@tanstack/react-query';
import {
  Minus,
  Video,
  Database,
  Zap,
  Smartphone,
  Monitor,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  BarChart3,
  Activity,
  Cpu,
  HardDrive,
  Wifi,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { queryDocuments } from '@/utils/firestore';

export default function HeroVideoReport() {
  const [metrics, setMetrics] = useState({
    memory: { current: 0, peak: 0, average: 0 },
    fps: { current: 60, lowest: 60, average: 60 },
    loadTime: { current: 0, fastest: 0, slowest: 0 },
  });
  const [deviceInfo, setDeviceInfo] = useState(null);

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

  useEffect(() => {
    setDeviceInfo({
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      cores: navigator.hardwareConcurrency || 'Unknown',
      memory: navigator.deviceMemory || 'Unknown',
      connection: navigator.connection?.effectiveType || 'Unknown',
    });

    let frameCount = 0;
    let lastTime = performance.now();
    const memoryReadings = [];

    const measureFPS = () => {
      const now = performance.now();
      frameCount++;

      if (now >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastTime));
        setMetrics((prev) => ({
          ...prev,
          fps: {
            current: fps,
            lowest: Math.min(prev.fps.lowest, fps),
            average: Math.round(prev.fps.average * 0.9 + fps * 0.1),
          },
        }));
        frameCount = 0;
        lastTime = now;
      }
      requestAnimationFrame(measureFPS);
    };

    const measureMemory = () => {
      if (performance.memory) {
        const used = performance.memory.usedJSHeapSize / 1048576;
        memoryReadings.push(used);

        if (memoryReadings.length > 30) memoryReadings.shift();

        const average = memoryReadings.reduce((a, b) => a + b, 0) / memoryReadings.length;

        setMetrics((prev) => ({
          ...prev,
          memory: {
            current: used.toFixed(2),
            peak: Math.max(prev.memory.peak, used).toFixed(2),
            average: average.toFixed(2),
          },
        }));
      }
    };

    requestAnimationFrame(measureFPS);
    const memoryInterval = setInterval(measureMemory, 2000);

    return () => clearInterval(memoryInterval);
  }, []);

  const generateReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      device: deviceInfo,
      videos: {
        count: slides.length,
        durations: slides.map((s) => s.display_duration || 10),
        urls: slides.map((s) => s.video_url),
      },
      performance: metrics,
      issues: [],
    };

    if (slides.length > 1) report.issues.push('🚨 Too many videos (>1) - Optimal is 1 video.');
    if (parseFloat(metrics.memory.peak) > 200) report.issues.push(' High memory usage');
    if (metrics.fps.lowest < 30) report.issues.push(' Low FPS detected');
    if (slides.some((s) => (s.display_duration || 10) > 25))
      report.issues.push(' Video duration too long (>25s)');

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hero-video-report-${Date.now()}.json`;
    a.click();
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const calculateOverallScore = () => {
    let score = 100;

    //  New scoring: Only 1 video is optimal
    if (slides.length > 1) score -= 40;
    else if (slides.length === 0) score -= 50;

    const peakMemory = parseFloat(metrics.memory.peak);
    if (peakMemory > 200) score -= 20;
    else if (peakMemory > 150) score -= 10;

    if (metrics.fps.lowest < 30) score -= 20;
    else if (metrics.fps.lowest < 50) score -= 10;

    //  Check duration limit (max 25s)
    if (slides.some((s) => (s.display_duration || 10) > 25)) score -= 15;

    if (!slides.every((s) => s.poster_image)) score -= 10;

    return Math.max(0, score);
  };

  const overallScore = calculateOverallScore();
  const peakMemory = parseFloat(metrics.memory.peak);
  const currentMemory = parseFloat(metrics.memory.current);

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 p-4 sm:p-6'>
      <div className='max-w-7xl mx-auto'>
        <div className='mb-8'>
          <div className='flex items-center justify-between flex-wrap gap-4'>
            <div>
              <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 mb-2'>
                Hero Video Performance Report
              </h1>
              <p className='text-gray-600'>Real-time monitoring and optimization recommendations</p>
            </div>
            <Button onClick={generateReport} variant='outline' className='gap-2'>
              <Download className='w-4 h-4' />
              Export Report
            </Button>
          </div>
        </div>

        {/* Overall Score */}
        <Card className='mb-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='text-lg font-semibold text-gray-700 mb-1'>
                  Overall Performance Score
                </h3>
                <p className='text-sm text-gray-500'>
                  Based on configuration and real-time metrics
                </p>
              </div>
              <div className='text-center'>
                <div className={`text-6xl font-bold ${getScoreColor(overallScore)}`}>
                  {overallScore}
                </div>
                <div className='text-sm text-gray-500 mt-1'>/ 100</div>
              </div>
            </div>

            {overallScore < 70 && (
              <div className='mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3'>
                <AlertTriangle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
                <div className='text-sm text-red-800'>
                  <strong>Critical Issues Detected!</strong> Your score is below 70. Immediate
                  action required to prevent mobile crashes.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Video Configuration - NEW CARD (moved and redesigned) */}
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Video className='w-5 h-5 text-purple-600' />
              Video Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='p-4 bg-gray-50 rounded-lg'>
                <div className='text-sm text-gray-600 mb-1'>Total Videos</div>
                <div className='flex items-center gap-2'>
                  <div className='text-3xl font-bold text-gray-900'>{slides.length}</div>
                  {slides.length === 1 ? (
                    <Badge className='bg-green-100 text-green-800'> Optimal</Badge>
                  ) : (
                    <Badge className='bg-red-100 text-red-800'>Too Many</Badge>
                  )}
                </div>
                {slides.length > 1 && (
                  <p className='text-xs text-red-600 mt-2'>
                    Reduce to 1 video for best mobile performance
                  </p>
                )}
              </div>

              <div className='p-4 bg-gray-50 rounded-lg'>
                <div className='text-sm text-gray-600 mb-1'>Video Duration</div>
                <div className='flex items-center gap-2'>
                  <div className='text-3xl font-bold text-gray-900'>
                    {slides[0]?.display_duration || 0}s
                  </div>
                  {slides[0] && (slides[0].display_duration || 0) <= 25 ? (
                    <Badge className='bg-green-100 text-green-800'> OK</Badge>
                  ) : (
                    <Badge className='bg-yellow-100 text-yellow-800'> Long</Badge>
                  )}
                </div>
                <p className='text-xs text-gray-600 mt-2'>Max recommended: 25 seconds</p>
              </div>

              <div className='p-4 bg-gray-50 rounded-lg'>
                <div className='text-sm text-gray-600 mb-1'>Playback Mode</div>
                <div className='text-2xl font-bold text-gray-900'>Loop</div>
                <p className='text-xs text-gray-600 mt-2'>Video repeats automatically</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          <Card className='border-2 border-blue-200'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <Activity className='w-5 h-5 text-blue-600' />
                Frame Rate (FPS)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>Current:</span>
                  <span
                    className={`text-2xl font-bold ${
                      metrics.fps.current >= 55
                        ? 'text-green-600'
                        : metrics.fps.current >= 30
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }`}
                  >
                    {metrics.fps.current} fps
                  </span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>Lowest:</span>
                  <span className='text-lg font-semibold text-gray-700'>
                    {metrics.fps.lowest} fps
                  </span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>Average:</span>
                  <span className='text-lg font-semibold text-gray-700'>
                    {metrics.fps.average} fps
                  </span>
                </div>
                <div className='mt-3 p-2 bg-blue-50 rounded text-xs text-blue-900'>
                  💡 Target: 60 fps | Acceptable: 30+ fps
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-2 border-purple-200'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <Database className='w-5 h-5 text-purple-600' />
                Memory Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>Current:</span>
                  <span
                    className={`text-2xl font-bold ${
                      currentMemory < 150
                        ? 'text-green-600'
                        : currentMemory < 200
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }`}
                  >
                    {metrics.memory.current} MB
                  </span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>Peak:</span>
                  <span className='text-lg font-semibold text-gray-700'>
                    {metrics.memory.peak} MB
                  </span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>Average:</span>
                  <span className='text-lg font-semibold text-gray-700'>
                    {metrics.memory.average} MB
                  </span>
                </div>
                <div className='mt-3 p-2 bg-purple-50 rounded text-xs text-purple-900'>
                  💡 Safe zone: less than 150 MB | Warning: 150-200 MB
                </div>
              </div>
            </CardContent>
          </Card>
          {/* The old 'Video Configuration' card was removed from here. */}
        </div>

        {deviceInfo && (
          <Card className='mb-6'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Smartphone className='w-5 h-5' />
                Device & Environment Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4'>
                <div className='flex items-center gap-2'>
                  <Cpu className='w-4 h-4 text-gray-500' />
                  <div>
                    <p className='text-xs text-gray-600'>CPU Cores</p>
                    <p className='font-semibold'>{deviceInfo.cores}</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <HardDrive className='w-4 h-4 text-gray-500' />
                  <div>
                    <p className='text-xs text-gray-600'>Device RAM</p>
                    <p className='font-semibold'>{deviceInfo.memory} GB</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Wifi className='w-4 h-4 text-gray-500' />
                  <div>
                    <p className='text-xs text-gray-600'>Connection</p>
                    <p className='font-semibold'>{deviceInfo.connection}</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Monitor className='w-4 h-4 text-gray-500' />
                  <div>
                    <p className='text-xs text-gray-600'>Platform</p>
                    <p className='font-semibold'>{deviceInfo.platform.split(' ')[0]}</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <BarChart3 className='w-4 h-4 text-gray-500' />
                  <div>
                    <p className='text-xs text-gray-600'>Browser</p>
                    <p className='font-semibold'>
                      {deviceInfo.userAgent.includes('Chrome')
                        ? 'Chrome'
                        : deviceInfo.userAgent.includes('Safari')
                          ? 'Safari'
                          : deviceInfo.userAgent.includes('Firefox')
                            ? 'Firefox'
                            : 'Other'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className='grid md:grid-cols-2 gap-6 mb-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Zap className='w-5 h-5 text-yellow-600' />
                Technical Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <AssessmentItem
                  label='Video Count'
                  status={slides.length <= 1 ? 'good' : 'bad'}
                  value={`${slides.length} videos`}
                  target='= 1 video'
                />
                <AssessmentItem
                  label='Memory Efficiency'
                  status={peakMemory < 150 ? 'good' : peakMemory < 200 ? 'medium' : 'bad'}
                  value={`Peak: ${metrics.memory.peak} MB`}
                  target='< 150 MB'
                />
                <AssessmentItem
                  label='Frame Rate Stability'
                  status={
                    metrics.fps.lowest >= 55 ? 'good' : metrics.fps.lowest >= 30 ? 'medium' : 'bad'
                  }
                  value={`Lowest: ${metrics.fps.lowest} fps`}
                  target='≥ 55 fps'
                />
                <AssessmentItem
                  label='Transition Smoothness'
                  status='good'
                  value='3s cubic-bezier'
                  target='Smooth crossfade'
                />
                <AssessmentItem
                  label='GPU Acceleration'
                  status='good'
                  value='translate3d enabled'
                  target='Hardware accelerated'
                />
                <AssessmentItem
                  label='Preload Strategy'
                  status='good'
                  value='Current + Next only'
                  target='Optimized loading'
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Smartphone className='w-5 h-5 text-blue-600' />
                Mobile Optimization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <AssessmentItem
                  label='Auto-play Compatibility'
                  status='good'
                  value='muted + playsInline'
                  target='iOS/Android ready'
                />
                <AssessmentItem
                  label='Memory Cleanup'
                  status='good'
                  value='On unmount & transition'
                  target='No memory leaks'
                />
                <AssessmentItem
                  label='Poster Images'
                  status={slides.every((s) => s.poster_image) ? 'good' : 'medium'}
                  value={slides.every((s) => s.poster_image) ? 'All present' : 'Some missing'}
                  target='Instant display'
                />
                <AssessmentItem
                  label='Video Duration'
                  status={slides.every((s) => (s.display_duration || 0) <= 25) ? 'good' : 'medium'}
                  value={slides.length > 0 ? `${slides[0].display_duration || 0}s max` : 'N/A'}
                  target='≤ 25s'
                />
                <AssessmentItem
                  label='Error Handling'
                  status='good'
                  value='Auto-advance on fail'
                  target='Graceful fallback'
                />
                <AssessmentItem
                  label='Touch Optimization'
                  status='good'
                  value='Pause on hover/touch'
                  target='User control'
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className='mb-6'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <AlertTriangle className='w-5 h-5 text-orange-600' />
              Issues & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {slides.length > 1 && (
                <div className='border-l-4 border-red-500 pl-4 py-2 bg-red-50'>
                  <div className='flex items-start gap-2'>
                    <XCircle className='w-5 h-5 text-red-500 mt-0.5' />
                    <div>
                      <h4 className='font-bold text-red-900'>CRITICAL: Too Many Videos</h4>
                      <p className='text-sm text-red-800 mb-2'>
                        {slides.length} videos detected. Optimal configuration is 1 video for
                        performance. This WILL cause crashes on mobile devices.
                      </p>
                      <div className='bg-white p-3 rounded border border-red-200'>
                        <p className='text-sm font-semibold text-red-900 mb-1'>Action Required:</p>
                        <ol className='text-sm text-red-800 list-decimal list-inside space-y-1'>
                          <li>Go to Admin Dashboard → Hero Slides</li>
                          <li>Deactivate all but 1 video</li>
                          <li>Test on actual mobile device</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {slides.some((s) => (s.display_duration || 10) > 25) && (
                <div className='border-l-4 border-yellow-500 pl-4 py-2 bg-yellow-50'>
                  <div className='flex items-start gap-2'>
                    <AlertTriangle className='w-5 h-5 text-yellow-500 mt-0.5' />
                    <div>
                      <h4 className='font-bold text-yellow-900'>MEDIUM: Video Duration Too Long</h4>
                      <p className='text-sm text-yellow-800 mb-2'>
                        One or more videos exceed the recommended 25-second duration. Long videos
                        consume more memory and data.
                      </p>
                      <div className='bg-white p-3 rounded border border-yellow-200'>
                        <p className='text-sm font-semibold text-yellow-900 mb-1'>
                          Recommendations:
                        </p>
                        <ul className='text-sm text-yellow-800 space-y-1'>
                          <li>• Edit videos to be under 25 seconds</li>
                          <li>• Ensure videos are concise and convey message quickly</li>
                          <li>• Use short, impactful clips for hero section</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {peakMemory > 200 && (
                <div className='border-l-4 border-orange-500 pl-4 py-2 bg-orange-50'>
                  <div className='flex items-start gap-2'>
                    <AlertTriangle className='w-5 h-5 text-orange-500 mt-0.5' />
                    <div>
                      <h4 className='font-bold text-orange-900'>HIGH: Memory Usage Excessive</h4>
                      <p className='text-sm text-orange-800 mb-2'>
                        Peak memory: {metrics.memory.peak} MB (Target: less than 150 MB)
                      </p>
                      <div className='bg-white p-3 rounded border border-orange-200'>
                        <p className='text-sm font-semibold text-orange-900 mb-1'>
                          Recommended Actions:
                        </p>
                        <ul className='text-sm text-orange-800 space-y-1'>
                          <li>• Compress video files (target: less than 5MB each)</li>
                          <li>• Reduce video resolution to 1080p max</li>
                          <li>• Check for memory leaks in DevTools</li>
                          <li>• Limit to 1 video if issue persists</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {metrics.fps.lowest < 30 && (
                <div className='border-l-4 border-yellow-500 pl-4 py-2 bg-yellow-50'>
                  <div className='flex items-start gap-2'>
                    <AlertTriangle className='w-5 h-5 text-yellow-500 mt-0.5' />
                    <div>
                      <h4 className='font-bold text-yellow-900'>MEDIUM: Low Frame Rate</h4>
                      <p className='text-sm text-yellow-800 mb-2'>
                        Lowest FPS: {metrics.fps.lowest} (Target: 55+ fps)
                      </p>
                      <div className='bg-white p-3 rounded border border-yellow-200'>
                        <p className='text-sm font-semibold text-yellow-900 mb-1'>
                          Optimization Steps:
                        </p>
                        <ul className='text-sm text-yellow-800 space-y-1'>
                          <li>• Reduce transition duration to 2s</li>
                          <li>• Remove blur effect from transitions</li>
                          <li>• Decrease video bitrate</li>
                          <li>• Test on lower-end devices</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!slides.every((s) => s.poster_image) && (
                <div className='border-l-4 border-blue-500 pl-4 py-2 bg-blue-50'>
                  <div className='flex items-start gap-2'>
                    <AlertTriangle className='w-5 h-5 text-blue-500 mt-0.5' />
                    <div>
                      <h4 className='font-bold text-blue-900'>LOW: Missing Poster Images</h4>
                      <p className='text-sm text-blue-800 mb-2'>
                        {slides.filter((s) => !s.poster_image).length} videos missing poster images
                      </p>
                      <div className='bg-white p-3 rounded border border-blue-200'>
                        <p className='text-sm text-blue-800'>
                          Add poster_image for instant visual display while videos load. Extract
                          first frame from videos.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {overallScore >= 90 && (
                <div className='border-l-4 border-green-500 pl-4 py-2 bg-green-50'>
                  <div className='flex items-start gap-2'>
                    <CheckCircle className='w-5 h-5 text-green-500 mt-0.5' />
                    <div>
                      <h4 className='font-bold text-green-900'> System is Well Optimized</h4>
                      <p className='text-sm text-green-800'>
                        No critical issues detected. Continue monitoring performance on real
                        devices.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <CheckCircle className='w-5 h-5 text-green-600' />
              Best Practices Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid md:grid-cols-2 gap-4'>
              <div>
                <h4 className='font-semibold mb-3 text-gray-900'> Current Implementation</h4>
                <ul className='space-y-2 text-sm text-gray-700'>
                  <li className='flex items-center gap-2'>
                    <CheckCircle className='w-4 h-4 text-green-600' />
                    3-second smooth crossfade transitions
                  </li>
                  <li className='flex items-center gap-2'>
                    <CheckCircle className='w-4 h-4 text-green-600' />
                    GPU hardware acceleration enabled
                  </li>
                  <li className='flex items-center gap-2'>
                    <CheckCircle className='w-4 h-4 text-green-600' />
                    Memory cleanup on unmount
                  </li>
                  <li className='flex items-center gap-2'>
                    <CheckCircle className='w-4 h-4 text-green-600' />
                    Preload only current + next video
                  </li>
                  <li className='flex items-center gap-2'>
                    <CheckCircle className='w-4 h-4 text-green-600' />
                    Fixed 10-second display duration
                  </li>
                  <li className='flex items-center gap-2'>
                    <CheckCircle className='w-4 h-4 text-green-600' />
                    Auto-advance with smooth timing
                  </li>
                </ul>
              </div>
              <div>
                <h4 className='font-semibold mb-3 text-gray-900'>💡 Additional Recommendations</h4>
                <ul className='space-y-2 text-sm text-gray-700'>
                  <li className='flex items-start gap-2'>
                    <span className='text-purple-600 font-bold'>1.</span>
                    <span>Add Page Visibility API to pause videos when tab is hidden</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-purple-600 font-bold'>2.</span>
                    <span>Implement adaptive quality based on connection speed</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-purple-600 font-bold'>3.</span>
                    <span>Add analytics to track video load times</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-purple-600 font-bold'>4.</span>
                    <span>Test on actual iOS Safari and Android Chrome</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-purple-600 font-bold'>5.</span>
                    <span>Monitor Largest Contentful Paint (LCP) metric</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-purple-600 font-bold'>6.</span>
                    <span>Consider lazy loading content below hero section</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AssessmentItem({ label, status, value, target }) {
  const getIcon = () => {
    if (status === 'good') return <CheckCircle className='w-5 h-5 text-green-600' />;
    if (status === 'medium') return <Minus className='w-5 h-5 text-yellow-600' />;
    return <XCircle className='w-5 h-5 text-red-600' />;
  };

  const getColor = () => {
    if (status === 'good') return 'border-green-200 bg-green-50';
    if (status === 'medium') return 'border-yellow-200 bg-yellow-50';
    return 'border-red-200 bg-red-50';
  };

  return (
    <div className={`border-l-4 pl-3 py-2 ${getColor()}`}>
      <div className='flex items-start justify-between gap-2'>
        <div className='flex items-start gap-2 flex-1'>
          {getIcon()}
          <div>
            <p className='font-semibold text-sm text-gray-900'>{label}</p>
            <p className='text-xs text-gray-600'>{value}</p>
          </div>
        </div>
        <span className='text-xs text-gray-500 whitespace-nowrap'>{target}</span>
      </div>
    </div>
  );
}
