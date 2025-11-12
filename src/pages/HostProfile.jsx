import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MapPin,
  Star,
  Calendar,
  Users,
  MessageSquare,
  Award,
  Camera,
  ChefHat,
  BookOpen,
  Palette,
  Mountain,
  ShieldCheck,
  CheckCircle,
  Globe,
  Instagram,
  Facebook,
  Image as ImageIcon,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { createPageUrl } from '@/utils';
import { queryDocuments } from '@/utils/firestore';

import Lightbox from '@/features/shared/booking-components/Lightbox';
import { UseAppContext } from '@/shared/context/AppContext';
import ReviewsList from '@/features/traveler/reviews/components/ReviewsList';
import { normalizeText } from '@/shared/utils/textHelpers';
import { getUserDisplayName } from '@/shared/utils/userHelpers';

const EXPERTISE_ICONS = {
  Photography: Camera,
  'Cooking & Food': ChefHat,
  'Local History': BookOpen,
  Architecture: Palette,
  'Nature & Hiking': Mountain,
  'Art & Culture': Palette,
  Nightlife: Sparkles,
  Shopping: TrendingUp,
  'Family Activities': Users,
  'Adventure Sports': Mountain,
  'Religious Sites': Award,
  'Language Teaching': Globe,
};

export default function HostProfile() {
  const { user } = UseAppContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const urlParams = new URLSearchParams(window.location.search);
  const hostEmail = urlParams.get('email');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return user;
      } catch {
        return null;
      }
    },
  });

  const { data: host, isLoading } = useQuery({
    queryKey: ['hostProfile', hostEmail],
    queryFn: async () => {
      const hosts = await queryDocuments(
        'users',
        ['email', '==', hostEmail],
        ['host_approved', '==', true]
      );
      if (!hosts || hosts.length === 0) {
        throw new Error('Host not found');
      }
      return hosts[0];
    },
    enabled: !!hostEmail,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['hostReviews', hostEmail],
    queryFn: async () => {
      const allReviews = await queryDocuments('reviews', [
        ['reviewed_email', '==', hostEmail],
        ['status', '==', 'published'],
        ['review_type', '==', 'traveler_to_host'],
      ]);
      return allReviews.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!hostEmail,
  });

  const handleContactHost = () => {
    if (!currentUser) {
      toast.error('Please login to contact host');
      navigate('/login');
      return;
    }
    navigate(createPageUrl(`Messages?contact=${host.email}`));
  };

  const openGalleryLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center'>
        <div className='animate-pulse text-gray-600'>Loading host profile...</div>
      </div>
    );
  }

  if (!host) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center'>
        <Card className='max-w-md'>
          <CardContent className='p-8 text-center'>
            <h2 className='text-2xl font-bold mb-2'>Host Not Found</h2>
            <p className='text-gray-600 mb-4'>
              This host profile doesn't exist or is no longer available.
            </p>
            <Button onClick={() => navigate(createPageUrl('Home'))}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const galleryImages = host.experience_gallery || [];
  const avgRating = host.rating || 5.0;
  const totalReviews = reviews.length || 0;

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-white'>
      {/* Hero Section */}
      <section className='relative h-[40vh] bg-gradient-to-br from-purple-600 to-indigo-600 overflow-hidden'>
        {host.cover_photos && host.cover_photos[0] && (
          <img
            src={host.cover_photos[0]}
            alt='Cover'
            className='absolute inset-0 w-full h-full object-cover opacity-30'
          />
        )}

        <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-8'>
          <div className='flex items-end gap-6'>
            {/* Profile Photo */}
            <div className='relative'>
              {host.profile_photo ? (
                <img
                  src={host.profile_photo}
                  alt={getUserDisplayName(host)}
                  className='w-32 h-32 sm:w-40 sm:h-40 rounded-2xl object-cover border-4 border-white shadow-2xl'
                />
              ) : (
                <div className='w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-white flex items-center justify-center text-4xl sm:text-5xl font-bold text-purple-600 border-4 border-white shadow-2xl'>
                  {getUserDisplayName(host).charAt(0).toUpperCase()}
                </div>
              )}

              {/* Verified Badge */}
              <div className='absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-full shadow-lg'>
                <ShieldCheck className='w-6 h-6' />
              </div>
            </div>

            {/* Host Info */}
            <div className='flex-1 pb-4'>
              <h1 className='text-3xl sm:text-4xl font-bold text-white mb-2'>
                {getUserDisplayName(host)}
              </h1>
              <div className='flex flex-wrap items-center gap-4 text-white/90'>
                <div className='flex items-center gap-2'>
                  <MapPin className='w-5 h-5' />
                  <span className='font-medium'>{normalizeText(host.city)}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Star className='w-5 h-5 fill-yellow-400 text-yellow-400' />
                  <span className='font-bold'>{avgRating.toFixed(1)}</span>
                  <span className='text-sm'>({totalReviews} reviews)</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Calendar className='w-5 h-5' />
                  <span>{host.completed_bookings || 0} trips hosted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className='py-8 sm:py-12'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* Left Column - Main Content */}
            <div className='lg:col-span-2 space-y-6'>
              <Tabs defaultValue='about' className='w-full'>
                <TabsList className='grid w-full grid-cols-4'>
                  <TabsTrigger value='about'>About</TabsTrigger>
                  <TabsTrigger value='expertise'>Expertise</TabsTrigger>
                  <TabsTrigger value='gallery'>Gallery</TabsTrigger>
                  <TabsTrigger value='reviews'>Reviews</TabsTrigger>
                </TabsList>

                {/* About Tab */}
                <TabsContent value='about' className='space-y-6'>
                  <Card>
                    <CardHeader>
                      <CardTitle>About Me</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className='text-gray-700 leading-relaxed whitespace-pre-wrap'>
                        {host.about_me ||
                          host.bio ||
                          `${getUserDisplayName(host)} is a verified local host in ${normalizeText(host.city)}.`}
                      </p>

                      {host.fun_fact && (
                        <div className='mt-6 p-4 bg-purple-50 rounded-lg border-l-4 border-purple-600'>
                          <p className='text-sm font-semibold text-purple-900 mb-1'>✨ Fun Fact</p>
                          <p className='text-gray-700'>{host.fun_fact}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Languages */}
                  {host.languages && host.languages.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                          <Globe className='w-5 h-5 text-purple-600' />
                          Languages
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='flex flex-wrap gap-2'>
                          {host.languages.map((lang, idx) => (
                            <Badge key={idx} variant='outline' className='text-sm'>
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Expertise Tab */}
                <TabsContent value='expertise' className='space-y-6'>
                  {host.expertise_areas && host.expertise_areas.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Areas of Expertise</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
                          {host.expertise_areas.map((area, idx) => {
                            const Icon = EXPERTISE_ICONS[area] || Award;
                            return (
                              <div
                                key={idx}
                                className='flex items-center gap-3 p-3 bg-purple-50 rounded-lg'
                              >
                                <Icon className='w-5 h-5 text-purple-600 flex-shrink-0' />
                                <span className='text-sm font-medium text-gray-900'>{area}</span>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {host.skills && host.skills.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Skills & Specialties</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='flex flex-wrap gap-2'>
                          {host.skills.map((skill, idx) => (
                            <Badge
                              key={idx}
                              className='bg-indigo-100 text-indigo-900 hover:bg-indigo-200'
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {host.certifications && host.certifications.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                          <Award className='w-5 h-5 text-purple-600' />
                          Certifications & Badges
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='space-y-4'>
                          {host.certifications.map((cert, idx) => (
                            <div
                              key={idx}
                              className='flex items-start gap-4 p-4 bg-white border rounded-lg'
                            >
                              {cert.badge_url && (
                                <img
                                  src={cert.badge_url}
                                  alt={cert.name}
                                  className='w-16 h-16 object-contain'
                                />
                              )}
                              <div className='flex-1'>
                                <div className='flex items-center gap-2 mb-1'>
                                  <h4 className='font-semibold text-gray-900'>{cert.name}</h4>
                                  {cert.verified && (
                                    <CheckCircle className='w-4 h-4 text-green-600' />
                                  )}
                                </div>
                                <p className='text-sm text-gray-600'>{cert.issuer}</p>
                                {cert.year && (
                                  <p className='text-xs text-gray-500 mt-1'>{cert.year}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Gallery Tab */}
                <TabsContent value='gallery'>
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <ImageIcon className='w-5 h-5 text-purple-600' />
                        Experience Gallery
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {galleryImages.length > 0 ? (
                        <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
                          {galleryImages.map((img, idx) => (
                            <div
                              key={idx}
                              onClick={() => openGalleryLightbox(idx)}
                              className='relative aspect-square rounded-lg overflow-hidden cursor-pointer group'
                            >
                              <img
                                src={img.url}
                                alt={img.caption || `Gallery ${idx + 1}`}
                                className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-300'
                              />
                              {img.caption && (
                                <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity'>
                                  <p className='text-white text-sm font-medium'>{img.caption}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className='text-gray-500 text-center py-8'>No gallery images yet</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Reviews Tab */}
                <TabsContent value='reviews'>
                  <ReviewsList reviews={reviews} hostEmail={hostEmail} />
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Column - Sidebar */}
            <div className='space-y-6'>
              {/* Contact Card */}
              <Card className='sticky top-24'>
                <CardContent className='p-6 space-y-4'>
                  <Button
                    onClick={handleContactHost}
                    className='w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold'
                  >
                    <MessageSquare className='w-5 h-5 mr-2' />
                    Contact Host
                  </Button>

                  {host.response_time_hours && (
                    <p className='text-sm text-gray-600 text-center'>
                      ⚡ Usually responds within {host.response_time_hours} hours
                    </p>
                  )}

                  {/* Social Links */}
                  {(host.instagram_profile || host.facebook_profile) && (
                    <div className='pt-4 border-t'>
                      <p className='text-sm font-semibold text-gray-700 mb-3'>Connect</p>
                      <div className='flex gap-3'>
                        {host.instagram_profile && (
                          <a
                            href={host.instagram_profile}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all'
                          >
                            <Instagram className='w-4 h-4' />
                            <span className='text-sm font-medium'>Instagram</span>
                          </a>
                        )}
                        {host.facebook_profile && (
                          <a
                            href={host.facebook_profile}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 text-white rounded-lg hover:shadow-lg transition-all'
                          >
                            <Facebook className='w-4 h-4' />
                            <span className='text-sm font-medium'>Facebook</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Host Stats</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <span className='text-gray-600'>Trips Hosted</span>
                    <span className='font-bold text-gray-900'>{host.completed_bookings || 0}</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-gray-600'>Total Reviews</span>
                    <span className='font-bold text-gray-900'>{totalReviews}</span>
                  </div>
                  {host.years_of_experience && (
                    <div className='flex items-center justify-between'>
                      <span className='text-gray-600'>Experience</span>
                      <span className='font-bold text-gray-900'>
                        {host.years_of_experience} years
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cities */}
              {host.assigned_cities && host.assigned_cities.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className='text-lg'>Service Areas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-2'>
                      <div className='flex items-center gap-2 text-sm text-gray-900 font-medium'>
                        <MapPin className='w-4 h-4 text-purple-600' />
                        {normalizeText(host.city)}{' '}
                        <Badge variant='outline' className='text-xs'>
                          Primary
                        </Badge>
                      </div>
                      {host.assigned_cities.map((city, idx) => (
                        <div key={idx} className='flex items-center gap-2 text-sm text-gray-600'>
                          <MapPin className='w-4 h-4 text-gray-400' />
                          {normalizeText(city)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxOpen && galleryImages.length > 0 && (
        <Lightbox
          images={galleryImages.map((img) => img.url)}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
