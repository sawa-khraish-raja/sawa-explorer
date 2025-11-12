import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar, Users, DollarSign, MapPin, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { getAllDocuments } from '@/utils/firestore';



export default function AdventuresSection() {
  const navigate = useNavigate();

  const { data: adventures = [], isLoading } = useQuery({
    queryKey: ['adventures'],
    queryFn: async () => {
      const allAdventures = await getAllDocuments('adventures');
      const sortedAdventures = allAdventures.sort((a, b) =>
        new Date(b.date) - new Date(a.date)
      );
      return sortedAdventures.filter(
        (adv) => adv.status === 'upcoming' && new Date(adv.date) > new Date()
      );
    },
    staleTime: 0,
    cacheTime: 0,
    refetchInterval: 10000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className='flex justify-center items-center py-12'>
        <Loader2 className='w-8 h-8 animate-spin text-[var(--brand-primary)]' />
      </div>
    );
  }

  if (adventures.length === 0) {
    return (
      <div className='text-center py-12'>
        <p className='text-gray-500'>No upcoming adventures at the moment. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
      {adventures.map((adventure) => {
        const spotsLeft = adventure.max_participants - adventure.current_participants;
        const isFull = spotsLeft <= 0;

        return (
          <Card
            key={adventure.id}
            className='overflow-hidden hover:shadow-xl transition-shadow duration-300'
          >
            <div className='relative h-48'>
              <img
                src={
                  adventure.image_url ||
                  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800'
                }
                alt={adventure.title}
                className='w-full h-full object-cover'
              />
              <div className='absolute top-3 right-3 flex gap-2'>
                <Badge className='bg-white text-[var(--brand-primary)] font-semibold'>
                  {adventure.category}
                </Badge>
                {isFull && <Badge className='bg-red-500 text-white font-semibold'>Full</Badge>}
              </div>
            </div>

            <CardContent className='p-6'>
              <h3 className='text-xl font-bold text-gray-900 mb-3 line-clamp-2'>
                {adventure.title}
              </h3>

              <p className='text-gray-600 text-sm mb-4 line-clamp-2'>{adventure.description}</p>

              <div className='space-y-2 mb-4'>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <MapPin className='w-4 h-4 text-[var(--brand-primary)]' />
                  <span>{adventure.city}</span>
                </div>

                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Calendar className='w-4 h-4 text-[var(--brand-primary)]' />
                  <span>{format(new Date(adventure.date), 'MMM d, yyyy • h:mm a')}</span>
                </div>

                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Users className='w-4 h-4 text-[var(--brand-primary)]' />
                  <span>{spotsLeft} spots left</span>
                </div>

                <div className='flex items-center gap-2 text-lg font-bold text-[var(--brand-primary)]'>
                  <DollarSign className='w-5 h-5' />
                  <span>{adventure.price_per_person} per person</span>
                </div>
              </div>

              <Button
                onClick={() => navigate(`/AdventureDetails?id=${adventure.id}`)}
                className='w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white'
                disabled={isFull}
              >
                {isFull ? 'Fully Booked' : 'View Details'}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
