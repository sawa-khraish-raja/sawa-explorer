import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Users,
  MapPin,
  MessageSquare,
  Loader2,
  ChevronRight,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdventureBookingCard({ booking }) {
  const navigate = useNavigate();

  const { data: adventure, isLoading } = useQuery({
    queryKey: ['adventure', booking.adventure_id],
    queryFn: () => base44.entities.Adventure.get(booking.adventure_id),
    enabled: !!booking.adventure_id,
  });

  const { data: conversation } = useQuery({
    queryKey: ['conversation', booking.id],
    queryFn: async () => {
      const convos = await base44.entities.Conversation.filter({
        booking_id: booking.id,
      });
      return convos[0];
    },
    enabled: !!booking.id,
  });

  const { data: host } = useQuery({
    queryKey: ['adventureHost', adventure?.host_email],
    queryFn: async () => {
      const users = await base44.entities.User.filter({
        email: adventure.host_email,
      });
      return users[0];
    },
    enabled: !!adventure?.host_email && booking.status === 'confirmed',
  });

  if (isLoading || !adventure) {
    return (
      <Card className='animate-pulse bg-gradient-to-br from-purple-50 to-pink-50'>
        <CardContent className='p-6'>
          <div className='h-24 bg-purple-200 rounded'></div>
        </CardContent>
      </Card>
    );
  }

  const getStatusStyle = (status) => {
    const styles = {
      pending: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        iconBg: 'bg-blue-500',
        icon: Clock,
        text: 'Waiting for host confirmation',
      },
      confirmed: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        iconBg: 'bg-green-500',
        icon: CheckCircle,
        text: 'Confirmed - See you there!',
      },
      completed: {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        iconBg: 'bg-gray-500',
        icon: CheckCircle,
        text: 'Completed',
      },
      cancelled: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        iconBg: 'bg-red-500',
        icon: XCircle,
        text: 'Cancelled',
      },
    };
    return styles[status] || styles.pending;
  };

  const statusStyle = getStatusStyle(booking.status);
  const StatusIcon = statusStyle.icon;

  const handleCardClick = () => {
    if (booking.status === 'confirmed' && conversation && conversation.id) {
      window.location.href = `/Messages?conversation_id=${conversation.id}`;
    } else if (booking.status === 'confirmed' && host) {
      navigate(createPageUrl(`HostProfile?email=${host.email}`));
    } else {
      navigate(createPageUrl(`AdventureDetails?id=${adventure.id}`));
    }
  };

  return (
    <div
      className='bg-gradient-to-br from-purple-50 via-purple-100/50 to-pink-50 border-2 border-purple-300 rounded-2xl p-4 cursor-pointer hover:shadow-lg hover:border-purple-400 transition-all'
      onClick={handleCardClick}
    >
      <div className='flex items-start gap-4'>
        {/*  Adventure Icon */}
        <div className='bg-gradient-to-br from-purple-600 to-pink-600 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-md'>
          <Sparkles className='w-6 h-6 text-white' />
        </div>

        {/* Content */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 mb-1'>
            <h3 className='font-bold text-purple-900 text-lg'>{adventure.title}</h3>
            <Badge className='bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px]'>
              Adventure
            </Badge>
          </div>
          <p className='text-sm text-purple-700 mb-2'>{statusStyle.text}</p>

          {/* Show host info if confirmed */}
          {booking.status === 'confirmed' && host && (
            <div className='flex items-center gap-2 mb-2 p-2 bg-white/60 rounded-lg border border-purple-200'>
              {host.profile_photo ? (
                <img
                  src={host.profile_photo}
                  alt={host.full_name}
                  className='w-8 h-8 rounded-full object-cover border-2 border-purple-300'
                />
              ) : (
                <div className='w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-sm font-bold'>
                  {host.full_name?.charAt(0) || 'H'}
                </div>
              )}
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-semibold text-purple-900 truncate'>
                  Your Host: {host.full_name}
                </p>
                {host.rating && (
                  <p className='text-xs text-amber-600'>★ {host.rating.toFixed(1)}</p>
                )}
              </div>
            </div>
          )}

          <div className='flex flex-wrap gap-3 text-xs text-gray-600'>
            <span className='flex items-center gap-1'>
              <Calendar className='w-3 h-3' />
              {format(new Date(adventure.date), 'MMM d, yyyy')}
            </span>
            <span className='flex items-center gap-1'>
              <MapPin className='w-3 h-3' />
              {adventure.city}
            </span>
            <span className='flex items-center gap-1'>
              <Users className='w-3 h-3' />
              {booking.number_of_adults} {booking.number_of_adults === 1 ? 'guest' : 'guests'}
            </span>
          </div>

          {/* Show chat button if confirmed */}
          {booking.status === 'confirmed' && conversation && (
            <div className='mt-3'>
              <Button
                size='sm'
                variant='outline'
                className='border-purple-400 text-purple-700 hover:bg-purple-100'
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `/Messages?conversation_id=${conversation.id}`;
                }}
              >
                <MessageSquare className='w-4 h-4 mr-2' />
                Chat with Host
              </Button>
            </div>
          )}
        </div>

        {/* Arrow */}
        <ChevronRight className='w-5 h-5 text-purple-400 flex-shrink-0 mt-1' />
      </div>
    </div>
  );
}
