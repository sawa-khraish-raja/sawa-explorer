import { useQuery } from '@tanstack/react-query';
import { Sparkles, Bot } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';


import AITripPlannerModal from './AITripPlannerModal';

export default function AIPlannerLinkCard({ city }) {
  const { user } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

    retry: false,
  });

  if (!user) {
    return null; // Don't show the card if the user is not logged in
  }

  return (
    <>
      <Card className='bg-gradient-to-br from-[#330066] to-[#4c1d95] text-white p-6 rounded-2xl shadow-2xl my-8'>
        <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
          <div className='flex items-center gap-4'>
            <div className='bg-white/20 p-3 rounded-full'>
              <Bot className='w-8 h-8 text-white' />
            </div>
            <div>
              <h3 className='text-xl font-bold'>SAWA AI Planner</h3>
              <p className='text-white/80 text-sm'>
                Create a personalized itinerary for {city} in seconds.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className='bg-white text-[#330066] font-bold hover:bg-gray-100 w-full md:w-auto transition-transform hover:scale-105'
          >
            <Sparkles className='w-4 h-4 mr-2' />
            Plan My Trip
          </Button>
        </div>
      </Card>

      <AITripPlannerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} city={city} />
    </>
  );
}
