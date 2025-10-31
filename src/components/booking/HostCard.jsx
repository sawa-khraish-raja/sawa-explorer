import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Star, CheckCircle, Building2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function HostCard({ host }) {
  const navigate = useNavigate();
  const hostInitial = (host.display_name || host.full_name || host.email || '?').charAt(0).toUpperCase();

  const handleClick = () => {
    navigate(createPageUrl(`HostProfile?email=${host.email}`));
  };

  return (
    <Card 
      onClick={handleClick}
      className="w-full bg-white shadow-lg border-2 border-transparent hover:border-purple-300 hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer"
    >
      <CardContent className="p-0">
        <div className="relative h-40">
          <img 
            src={host.cover_photos?.[0] || host.profile_photo || `https://source.unsplash.com/400x300/?travel,${host.city || 'destination'}`} 
            alt={`Cover for ${host.display_name || host.full_name}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-3 left-4">
            <h3 className="text-white text-lg font-bold drop-shadow-md">
              {host.display_name || host.full_name}
            </h3>
          </div>
          {/* Host Type Badge */}
          {host.host_type === 'office' && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-purple-600 text-white shadow-lg">
                <Building2 className="w-3 h-3 mr-1" />
                Office
              </Badge>
            </div>
          )}
          {host.host_type === 'freelancer' && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-blue-600 text-white shadow-lg">
                <Sparkles className="w-3 h-3 mr-1" />
                Freelancer
              </Badge>
            </div>
          )}
        </div>
        
        <div className="p-4 pt-10 relative">
          <Avatar className="w-20 h-20 absolute -top-10 left-1/2 -translate-x-1/2 border-4 border-white shadow-lg">
            <AvatarImage src={host.profile_photo} alt={host.display_name || host.full_name} loading="lazy" />
            <AvatarFallback className="bg-purple-500 text-white font-bold text-2xl">
              {hostInitial}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex justify-center items-center gap-2 mb-3">
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="font-bold text-sm text-gray-800">{host.rating?.toFixed(1) || '5.0'}</span>
            </div>
            <span className="text-gray-400">•</span>
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="font-semibold text-sm text-gray-800">Verified</span>
            </div>
          </div>
          
          <p className="text-gray-600 text-center text-sm h-10 overflow-hidden">
            {host.bio?.substring(0, 70) || `Your friendly local guide in ${host.city || 'the city'}.`}
            {host.bio && host.bio.length > 70 ? '...' : ''}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}