import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  MapPin,
  Compass,
  Calendar,
  X,
  Users,
  Star,
  ChevronRight,
  Search,
  Tag,
} from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { queryDocuments } from '@/utils/firestore';
import { useTranslation } from '../components/i18n/LanguageContext';

export default function Adventures() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  //  Using Firestore for adventures
  const { data: adventures = [], isLoading: adventuresLoading } = useQuery({
    queryKey: ['adventures'],
    queryFn: async () => {
      console.log('🔍 Fetching adventures from Firestore...');
      // Get all active adventures from Firestore
      // Note: Removed orderBy to avoid needing composite index for development
      // Can add back later once index is created
      const allAdventures = await queryDocuments('adventures', [['is_active', '==', true]]);

      // Sort in JavaScript instead
      const sorted = allAdventures.sort((a, b) => {
        const dateA = a.created_at?.toDate?.() || new Date(a.created_at);
        const dateB = b.created_at?.toDate?.() || new Date(b.created_at);
        return dateB - dateA; // desc order
      });

      console.log('🔍 Found adventures:', sorted.length);
      // Log image data for debugging
      sorted.forEach((adv, idx) => {
        console.log(`🖼️ Adventure ${idx + 1} (${adv.title}):`, {
          id: adv.id,
          images: adv.images,
          image_url: adv.image_url,
          has_images_array: !!adv.images,
          has_image_url: !!adv.image_url
        });
      });
      return sorted;
    },
    staleTime: 0, // Disable cache during testing
    cacheTime: 0, // Force fresh data
  });

  // Note: AdventurePost is a separate feature (forum/social) - keeping Base44 for now
  const { data: adventurePosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['adventurePosts'],
    queryFn: async () => {
      // Keeping this as empty for now - can be migrated later if needed
      return [];
    },
    staleTime: 600000,
    cacheTime: 900000,
  });

  const isLoading = adventuresLoading || postsLoading;

  const filteredAdventures = adventures.filter((adv) => {
    // Use city_name field from Firestore schema
    const cityMatch =
      selectedCity === 'All' || adv.city_name === selectedCity || adv.city === selectedCity;
    const categoryMatch = selectedCategory === 'All' || adv.category === selectedCategory;
    const searchMatch = adv.title?.toLowerCase().includes(searchTerm.toLowerCase());
    return cityMatch && categoryMatch && searchMatch;
  });

  const filteredPosts = adventurePosts.filter((post) => {
    const cityMatch = selectedCity === 'All' || post.city === selectedCity;
    const categoryMatch = selectedCategory === 'All' || post.category === selectedCategory;
    const searchMatch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.caption && post.caption.toLowerCase().includes(searchTerm.toLowerCase()));
    return cityMatch && categoryMatch && searchMatch;
  });

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-white'>
      <section className='relative bg-gradient-to-br from-[#330066] via-[#7B2CBF] to-[#9933CC] py-16 sm:py-20 lg:py-24 overflow-hidden'>
        <div className='absolute inset-0'>
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200')] bg-cover bg-center opacity-20" />
          <div className='bg-gradient-to-br opacity-30 absolute inset-0 from-black/60 to-black/40' />
        </div>

        <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <div className='inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30 mb-6'>
              <Sparkles className='w-4 h-4 text-white' />
              <span className='text-sm font-semibold text-white'>Discover Adventures</span>
            </div>

            <h1 className='text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6'>
              Local Adventures
            </h1>

            <p className='text-xl text-white/90 max-w-2xl mx-auto'>
              Join unique experiences hosted by local experts
            </p>
          </div>
        </div>

        <div className='absolute bottom-0 left-0 right-0 h-16'>
          <svg
            className='w-full h-full'
            viewBox='0 0 1440 120'
            fill='none'
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

      <section className='py-12 bg-gradient-to-br from-gray-50 to-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg mb-12 border border-gray-200'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className='w-full h-12 text-base'>
                  <div className='flex items-center gap-2'>
                    <MapPin className='w-5 h-5 text-gray-500' />
                    <SelectValue placeholder='Filter by city' />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='All'>All Cities</SelectItem>
                  <SelectItem value='Damascus'>Damascus</SelectItem>
                  <SelectItem value='Amman'>Amman</SelectItem>
                  <SelectItem value='Istanbul'>Istanbul</SelectItem>
                  <SelectItem value='Cairo'>Cairo</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className='w-full h-12 text-base'>
                  <div className='flex items-center gap-2'>
                    <Tag className='w-5 h-5 text-gray-500' />
                    <SelectValue placeholder='Filter by category' />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='All'>All Categories</SelectItem>
                  <SelectItem value='Cultural'>Cultural</SelectItem>
                  <SelectItem value='Food & Dining'>Food & Dining</SelectItem>
                  <SelectItem value='Nature'>Nature</SelectItem>
                  <SelectItem value='Adventure'>Adventure</SelectItem>
                  <SelectItem value='Historical'>Historical</SelectItem>
                  <SelectItem value='Nightlife'>Nightlife</SelectItem>
                  <SelectItem value='Shopping'>Shopping</SelectItem>
                </SelectContent>
              </Select>

              <div className='relative'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                <Input
                  type='text'
                  placeholder='Search adventures and stories...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='w-full h-12 pl-10 text-base'
                />
              </div>
            </div>
          </div>

          {isLoading && (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className='animate-pulse'>
                  <div className='bg-gray-200 rounded-2xl h-80'></div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && filteredPosts.length > 0 && (
            <div className='mb-16'>
              <h2 className='text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3'>
                <Sparkles className='w-8 h-8 text-[#9933CC]' />
                Host Stories & Moments
              </h2>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
                {filteredPosts.map((post, index) => (
                  <Card
                    key={post.id}
                    onClick={() => navigate(`/AdventurePostDetails?id=${post.id}`)}
                    className='group cursor-pointer overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-[#CCCCFF] hover:border-[#9933CC] h-full'
                  >
                    <div className='relative aspect-square overflow-hidden'>
                      {post.media_urls &&
                        post.media_urls.length > 0 &&
                        (post.media_urls[0].type === 'video' ? (
                          <video
                            src={post.media_urls[0].url}
                            className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
                            muted
                            loop
                            playsInline
                            loading={index < 4 ? 'eager' : 'lazy'}
                          />
                        ) : (
                          <img
                            src={post.media_urls[0].url}
                            alt={post.title}
                            className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
                            loading={index < 4 ? 'eager' : 'lazy'}
                            decoding='async'
                            fetchPriority={index < 2 ? 'high' : 'auto'}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&q=80';
                            }}
                          />
                        ))}
                      <div className='absolute top-3 left-3 flex gap-2'>
                        <Badge className='bg-[#9933CC] text-white'>{post.category}</Badge>
                        {post.media_urls && post.media_urls.length > 1 && (
                          <Badge className='bg-white/90 text-gray-900'>
                            +{post.media_urls.length - 1}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <CardContent className='p-4'>
                      <h3 className='font-bold text-lg text-gray-900 mb-2 line-clamp-1'>
                        {post.title}
                      </h3>

                      <p className='text-sm text-gray-600 mb-3 line-clamp-2'>{post.caption}</p>

                      <div className='flex items-center justify-between text-xs text-gray-500 mt-auto pt-2 border-t border-gray-100'>
                        <div className='flex items-center gap-1'>
                          <MapPin className='w-3 h-3' />
                          {post.city}
                        </div>
                        <div>
                          Hosted by <span className='font-semibold'>{post.host_first_name}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!isLoading && filteredAdventures.length > 0 && (
            <div>
              <h2 className='text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3'>
                <Compass className='w-8 h-8 text-[#9933CC]' />
                Bookable Adventures
              </h2>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
                {filteredAdventures.map((adventure, index) => (
                  <Card
                    key={adventure.id}
                    onClick={() => navigate(`/AdventureDetails?id=${adventure.id}`)}
                    className='group cursor-pointer overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-[#CCCCFF] hover:border-[#9933CC]'
                  >
                    <div className='relative aspect-[4/3] overflow-hidden'>
                      {/*  Optimized Image */}
                      <img
                        src={
                          (adventure.images && adventure.images[0]) ||
                          adventure.image_url ||
                          'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800'
                        }
                        alt={adventure.title}
                        className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
                        loading={index < 4 ? 'eager' : 'lazy'}
                        decoding='async'
                        fetchPriority={index < 2 ? 'high' : 'auto'}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80';
                        }}
                      />
                      <div className='absolute top-4 left-4 flex gap-2'>
                        <Badge className='bg-gradient-to-r from-[#330066] to-[#9933CC] text-white border-0'>
                          {adventure.category}
                        </Badge>
                      </div>
                      <div className='absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1'>
                        <Users className='w-4 h-4 text-[#9933CC]' />
                        <span className='text-sm font-semibold text-gray-900'>
                          {adventure.current_participants || 0}/{adventure.max_participants}
                        </span>
                      </div>
                    </div>

                    <CardContent className='p-5'>
                      <div className='flex items-start justify-between mb-3'>
                        <div className='flex-1'>
                          <h3 className='text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#9933CC] transition-colors'>
                            {adventure.title}
                          </h3>
                          <div className='flex items-center gap-2 text-sm text-gray-600 mb-2'>
                            <MapPin className='w-4 h-4 text-[#9933CC]' />
                            {adventure.city}
                          </div>
                        </div>
                      </div>

                      <p className='text-gray-600 text-sm line-clamp-2 mb-4'>
                        {adventure.description}
                      </p>

                      <div className='flex items-center justify-between pt-4 border-t border-gray-100'>
                        <div className='flex items-center gap-2'>
                          <Calendar className='w-4 h-4 text-[#9933CC]' />
                          <span className='text-sm text-gray-600'>
                            {adventure.date ? format(new Date(adventure.date), 'MMM d, yyyy') : 'Date TBA'}
                          </span>
                        </div>
                        <div className='text-right'>
                          <div className='text-2xl font-bold bg-gradient-to-r from-[#330066] to-[#9933CC] bg-clip-text text-transparent'>
                            ${adventure.traveler_total_price || adventure.host_price || 0}
                          </div>
                          <div className='text-xs text-gray-500'>per person</div>
                        </div>
                      </div>

                      <Button className='w-full mt-4 bg-gradient-to-r from-[#330066] to-[#9933CC] hover:from-[#47008F] hover:to-[#AD5CD6] text-white rounded-xl h-11'>
                        View Details
                        <ChevronRight className='w-4 h-4 ml-2' />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!isLoading && filteredAdventures.length === 0 && filteredPosts.length === 0 && (
            <div className='text-center py-16 bg-white rounded-2xl shadow-lg'>
              <div className='w-24 h-24 bg-gradient-to-br from-[#CCCCFF] to-[#E6E6FF] rounded-full flex items-center justify-center mx-auto mb-6'>
                <Compass className='w-12 h-12 text-[#9933CC]' />
              </div>
              <h3 className='text-2xl font-bold text-gray-900 mb-3'>
                No adventures or stories found
              </h3>
              <p className='text-gray-600 mb-6'>
                {adventures.length === 0 && adventurePosts.length === 0
                  ? 'No adventures or stories available yet. Check back soon!'
                  : 'Try adjusting your filters or check back soon for new experiences and stories.'}
              </p>
              <Button
                onClick={() => {
                  setSelectedCity('All');
                  setSelectedCategory('All');
                  setSearchTerm('');
                }}
                className='bg-gradient-to-r from-[#330066] to-[#9933CC] hover:from-[#47008F] hover:to-[#AD5CD6] text-white rounded-xl'
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
