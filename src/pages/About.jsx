import React from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Shield,
  Globe,
  Users,
  Award,
  Sparkles,
  Target,
  Eye,
  CheckCircle,
  MapPin,
  Info,
  Star,
} from 'lucide-react';
import { normalizeText } from '../components/utils/textHelpers';
import PageHeroVideo from '../components/common/PageHeroVideo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function About() {
  const navigate = useNavigate();

  const { data: cities = [], isLoading: citiesLoading } = useQuery({
    queryKey: ['activeCities'],
    queryFn: async () => {
      const allCities = await base44.entities.City.list();
      const activeCities = allCities.filter((city) => city.is_active !== false && city.page_slug);
      const uniqueCities = activeCities.reduce((acc, city) => {
        if (!acc.find((c) => c.name === city.name)) {
          acc.push(city);
        }
        return acc;
      }, []);
      return uniqueCities;
    },
    staleTime: 15 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });

  const values = [
    {
      icon: Heart,
      title: 'Authentic Connections',
      description:
        'We believe in creating genuine relationships between travelers and local hosts, fostering cultural exchange and mutual respect',
    },
    {
      icon: Shield,
      title: 'Trust & Safety',
      description:
        'Every host is carefully verified and every experience is designed with your safety and comfort in mind',
    },
    {
      icon: Globe,
      title: 'Community First',
      description:
        'We empower local communities by creating sustainable tourism opportunities that benefit everyone',
    },
    {
      icon: Users,
      title: 'Personalized Experiences',
      description:
        'No two journeys are alike. We match you with hosts who understand your interests and travel style',
    },
  ];

  const stats = [
    { number: '5000+', label: 'Happy Travelers', icon: Users },
    { number: '200+', label: 'Verified Hosts', icon: Award },
    { number: '4', label: 'Cities', icon: MapPin },
    { number: '4.9★', label: 'Average Rating', icon: Star },
  ];

  const howItWorks = [
    {
      step: '1',
      title: 'Choose Your Destination',
      description: "Browse our curated cities and discover where you'd like to explore",
    },
    {
      step: '2',
      title: 'Meet Your Host',
      description: 'Connect with verified local hosts who match your interests and travel style',
    },
    {
      step: '3',
      title: 'Book Your Experience',
      description: 'Choose your services, set your dates, and confirm your personalized journey',
    },
    {
      step: '4',
      title: 'Travel Like a Local',
      description: 'Enjoy authentic experiences, insider knowledge, and unforgettable memories',
    },
  ];

  return (
    <div className='min-h-screen bg-white'>
      {/*  Hero Section - Video Only */}
      <section className='relative h-[70vh] sm:h-[75vh] overflow-hidden bg-black'>
        <PageHeroVideo pageType='about' />

        <div className='relative z-10 flex flex-col items-center justify-center h-full w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <div className='inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/30'>
              <Info className='w-4 h-4 text-white' />
              <span className='text-sm font-semibold text-white'>Our Story</span>
            </div>
            <h1 className='text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-2xl'>
              About SAWA
            </h1>
            <p className='text-lg sm:text-xl lg:text-2xl text-white/95 font-medium drop-shadow-lg max-w-3xl mx-auto'>
              Connecting travelers with authentic local experiences across the Middle East
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className='section-padding bg-gradient-to-br from-white via-[#F5F3FF] to-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid md:grid-cols-2 gap-12 lg:gap-16'>
            {/* Mission */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className='inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full mb-6 shadow-md border border-[#E6CCFF]'>
                <Target className='w-5 h-5 text-[#9933CC}' />
                <span className='text-[#330066] font-semibold'>Our Mission</span>
              </div>
              <h2 className='text-3xl lg:text-4xl font-bold text-gray-900 mb-6'>
                Making Travel{' '}
                <span className='bg-gradient-to-r from-[#330066] to-[#9933CC] bg-clip-text text-transparent'>
                  Personal & Authentic
                </span>
              </h2>
              <p className='text-lg text-gray-600 leading-relaxed mb-6'>
                We believe the best way to experience a destination is through the eyes of those who
                call it home. SAWA connects travelers with verified local hosts who share their
                culture, stories, and insider knowledge.
              </p>
              <p className='text-lg text-gray-600 leading-relaxed'>
                Our platform empowers communities while creating meaningful connections between
                travelers and the places they visit.
              </p>
            </motion.div>

            {/* Vision */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className='inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full mb-6 shadow-md border border-[#E6CCFF]'>
                <Eye className='w-5 h-5 text-[#9933CC}' />
                <span className='text-[#330066] font-semibold'>Our Vision</span>
              </div>
              <h2 className='text-3xl lg:text-4xl font-bold text-gray-900 mb-6'>
                A World Where{' '}
                <span className='bg-gradient-to-r from-[#330066] to-[#9933CC] bg-clip-text text-transparent'>
                  Every Journey Connects
                </span>
              </h2>
              <p className='text-lg text-gray-600 leading-relaxed mb-6'>
                We envision a future where travel creates lasting bonds between cultures, where
                every visitor becomes a friend, and where tourism benefits local communities
                sustainably.
              </p>
              <p className='text-lg text-gray-600 leading-relaxed'>
                Through technology and human connection, we're building bridges across the Middle
                East and beyond.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className='section-padding bg-gradient-to-br from-[#330066] via-[#7B2CBF] to-[#9933CC] text-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='text-center mb-12'
          >
            <h2 className='text-slate-100 mb-4 text-3xl font-bold lg:text-4xl'>Growing Together</h2>
            <p className='text-white/90 text-lg max-w-2xl mx-auto'>
              Join thousands who have discovered authentic travel through SAWA
            </p>
          </motion.div>

          <div className='grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8'>
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className='text-center'
              >
                <Card className='bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all'>
                  <CardContent className='p-6'>
                    <stat.icon className='w-12 h-12 mx-auto mb-4 text-white' />
                    <div className='text-4xl lg:text-5xl font-bold mb-2'>{stat.number}</div>
                    <div className='text-white/80 text-sm lg:text-base'>{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className='section-padding bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='text-center mb-12 lg:mb-16'
          >
            <div className='inline-flex items-center gap-2 bg-gradient-to-r from-[#CCCCFF] to-[#E6E6FF] px-4 py-2 rounded-full mb-4'>
              <Award className='w-5 h-5 text-[#9933CC]' />
              <span className='text-[#330066] font-semibold'>Our Values</span>
            </div>
            <h2 className='text-3xl lg:text-4xl font-bold text-gray-900 mb-4'>
              What Drives Us Forward
            </h2>
            <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
              The principles that guide every decision we make and every connection we facilitate
            </p>
          </motion.div>

          <div className='grid md:grid-cols-2 gap-8'>
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className='h-full border-2 border-[#E6E6FF] hover:border-[#9933CC] hover:shadow-2xl transition-all duration-300 group'>
                  <CardContent className='p-8'>
                    <div className='flex items-start gap-6'>
                      <div className='w-16 h-16 bg-gradient-to-br from-[#330066] to-[#9933CC] rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform'>
                        <value.icon className='w-8 h-8 text-white' />
                      </div>
                      <div>
                        <h3 className='text-xl font-bold text-gray-900 mb-3'>{value.title}</h3>
                        <p className='text-gray-600 leading-relaxed'>{value.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className='section-padding bg-gradient-to-br from-[#F5F3FF] via-white to-[#EDE9FE]'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='text-center mb-12 lg:mb-16'
          >
            <div className='inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full mb-4 shadow-md border border-[#E6CCFF]'>
              <CheckCircle className='w-5 h-5 text-[#9933CC]' />
              <span className='text-[#330066] font-semibold'>How It Works</span>
            </div>
            <h2 className='text-3xl lg:text-4xl font-bold text-gray-900 mb-4'>
              Your Journey in{' '}
              <span className='bg-gradient-to-r from-[#330066] to-[#9933CC] bg-clip-text text-transparent'>
                Four Simple Steps
              </span>
            </h2>
          </motion.div>

          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8'>
            {howItWorks.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className='relative'
              >
                <Card className='h-full border-2 border-[#E6E6FF] hover:border-[#9933CC] hover:shadow-xl transition-all duration-300'>
                  <CardContent className='p-6 text-center'>
                    <div className='w-16 h-16 bg-gradient-to-br from-[#330066] to-[#9933CC] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg'>
                      <span className='text-2xl font-bold text-white'>{item.step}</span>
                    </div>
                    <h3 className='text-lg font-bold text-gray-900 mb-3'>{item.title}</h3>
                    <p className='text-sm text-gray-600 leading-relaxed'>{item.description}</p>
                  </CardContent>
                </Card>

                {index < howItWorks.length - 1 && (
                  <div className='hidden lg:block absolute top-8 -right-4 w-8 h-0.5 bg-gradient-to-r from-[#9933CC] to-[#330066]' />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Cities Showcase */}
      <section className='section-padding bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='text-center mb-12 lg:mb-16'
          >
            <div className='inline-flex items-center gap-2 bg-gradient-to-r from-[#CCCCFF] to-[#E6E6FF] px-4 py-2 rounded-full mb-4'>
              <Globe className='w-5 h-5 text-[#9933CC]' />
              <span className='text-[#330066] font-semibold'>Our Cities</span>
            </div>
            <h2 className='text-3xl lg:text-4xl font-bold text-gray-900 mb-4'>
              Explore Amazing Destinations
            </h2>
            <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
              Each city offers unique experiences, rich culture, and welcoming hosts
            </p>
          </motion.div>

          {citiesLoading ? (
            <div className='flex justify-center items-center py-12'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#9933CC]'></div>
            </div>
          ) : cities.length === 0 ? (
            <div className='text-center py-12'>
              <Globe className='w-16 h-16 text-gray-300 mx-auto mb-4' />
              <p className='text-gray-500 text-lg'>No cities available yet</p>
            </div>
          ) : (
            <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {cities.map((city, index) => (
                <motion.div
                  key={city.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className='group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer'
                  onClick={() => {
                    if (city.page_slug) {
                      navigate(createPageUrl(city.page_slug));
                    }
                  }}
                >
                  <div className='aspect-[4/3] overflow-hidden'>
                    <img
                      src={
                        city.cover_image ||
                        'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800'
                      }
                      alt={city.name}
                      className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
                    />
                  </div>
                  <div className='absolute inset-0 bg-gradient-to-t from-[#330066] via-[#330066]/60 to-transparent'></div>
                  <div className='absolute bottom-0 left-0 right-0 p-6 text-white'>
                    <h3 className='text-2xl font-bold mb-1'>{city.name}</h3>
                    <p className='text-white/80 text-sm mb-2'>{city.country}</p>
                    {city.description && (
                      <p className='text-white/90 text-sm line-clamp-2'>{city.description}</p>
                    )}
                  </div>

                  {city.is_featured && (
                    <div className='absolute top-4 right-4'>
                      <div className='bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1'>
                        <Star className='w-3 h-3' />
                        Featured
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className='section-padding bg-gradient-to-br from-[#330066] via-[#7B2CBF] to-[#9933CC] text-white relative overflow-hidden'>
        <div className='absolute inset-0 overflow-hidden pointer-events-none'>
          <div className='absolute -top-24 -right-24 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl' />
          <div className='absolute -bottom-24 -left-24 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl' />
        </div>

        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Sparkles className='w-16 h-16 mx-auto mb-6 text-white' />
            <h2 className='text-3xl lg:text-5xl font-bold mb-6'>Ready to Start Your Journey?</h2>
            <p className='text-lg lg:text-xl text-white/90 mb-8 max-w-2xl mx-auto'>
              Join thousands of travelers discovering the Middle East through authentic local
              experiences
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Button
                onClick={() => navigate(createPageUrl('Adventures'))}
                className='bg-white text-[#330066] hover:bg-gray-100 px-8 py-6 text-lg font-semibold rounded-xl shadow-xl'
              >
                <Globe className='w-6 h-6 mr-2' />
                Explore Adventures
              </Button>
              <Button
                onClick={() => navigate(createPageUrl('BecomeAHost'))}
                variant='outline'
                className='border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg font-semibold rounded-xl'
              >
                <Users className='w-6 h-6 mr-2' />
                Become a Host
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
