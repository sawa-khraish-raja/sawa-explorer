import React, { useState, useEffect } from 'react';
import { useAppContext } from '../components/context/AppContext';
import { useQuery } from '@tanstack/react-query';
import { getAllDocuments, queryDocuments, getDocument, addDocument, updateDocument, deleteDocument } from '@/utils/firestore';
import { uploadImage, uploadVideo } from '@/utils/storage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Calendar, Send, MessageSquare, Loader2 } from 'lucide-react';
import PartnerLayout from '../components/partner/PartnerLayout';

export default function PartnerRequests() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const currentUser = await useAppContext().user;
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to fetch user');
      }
    }
    fetchUser();
  }, []);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['partnerRequests', user?.city],
    queryFn: () =>
      queryDocuments('bookings', 
        {
          city: user?.city,
          status: 'pending',
        },
        '-created_date'
      ),
    enabled: !!user?.city,
  });

  return (
    <PartnerLayout>
      <h1 className='text-3xl font-bold text-gray-900 mb-8'>Booking Requests</h1>
      {isLoading ? (
        <div className='flex justify-center items-center h-full'>
          <Loader2 className='w-8 h-8 animate-spin text-purple-600' />
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className='p-12 text-center text-gray-500'>
            No pending requests for your city right now.
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-6'>
          {requests.map((booking) => (
            <Card key={booking.id}>
              <CardContent className='p-6'>
                <div className='grid md:grid-cols-3 gap-6'>
                  <div className='space-y-4'>
                    <h3 className='font-semibold text-lg text-gray-900'>Traveler Request</h3>
                    <p className='text-sm text-gray-600'>From: {booking.traveler_email}</p>
                    <div className='flex items-center gap-2 text-sm'>
                      <Calendar className='w-4 h-4 text-gray-500' />
                      <span>
                        {format(new Date(booking.start_date), 'MMM d, yyyy')} -{' '}
                        {format(new Date(booking.end_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  <div className='space-y-3'>
                    <h3 className='font-semibold text-lg text-gray-900'>Requested Services</h3>
                    {booking.selected_services && booking.selected_services.length > 0 ? (
                      <div className='flex flex-wrap gap-2'>
                        {booking.selected_services.map((service) => (
                          <Badge key={service} variant='outline'>
                            {service}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className='text-sm text-gray-500'>No specific services requested.</p>
                    )}
                  </div>
                  <div className='flex md:flex-col items-center justify-center gap-4 md:border-l md:pl-6'>
                    <Button className='w-full bg-purple-600 hover:bg-purple-700'>
                      <Send className='w-4 h-4 mr-2' />
                      Make Offer
                    </Button>
                    <Button variant='outline' className='w-full'>
                      <MessageSquare className='w-4 h-4 mr-2' />
                      Message
                    </Button>
                    <Button variant='ghost' className='w-full text-sm text-gray-500'>
                      Skip
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PartnerLayout>
  );
}
