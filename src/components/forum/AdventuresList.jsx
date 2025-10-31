
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Search, MapPin, Compass } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import AdventureCard from './AdventureCard';

export default function AdventuresList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const { data: adventurePosts = [], isLoading } = useQuery({
    queryKey: ['adventurePosts'],
    queryFn: async () => {
      const allPosts = await base44.entities.ForumPost.filter({
        status: 'published',
        is_adventure_listing: true
      }, '-created_date');
      return allPosts;
    },
    staleTime: 30000,
  });

  const filteredAdventures = adventurePosts.filter(post => {
    const searchMatch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       post.content_html.toLowerCase().includes(searchTerm.toLowerCase());
    const cityMatch = selectedCity === 'All' || post.adventure_summary?.city === selectedCity;
    const categoryMatch = selectedCategory === 'All' || post.adventure_summary?.category === selectedCategory;
    return searchMatch && cityMatch && categoryMatch;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-[#9933CC]" />
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search adventures..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 border-2 border-[#E6E6FF] focus:border-[#9933CC]"
          />
        </div>
        
        <Select value={selectedCity} onValueChange={setSelectedCity}>
          <SelectTrigger className="w-full sm:w-48 h-12 border-2 border-[#E6E6FF]">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <SelectValue placeholder="City" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Cities</SelectItem>
            <SelectItem value="Damascus">Damascus</SelectItem>
            <SelectItem value="Amman">Amman</SelectItem>
            <SelectItem value="Istanbul">Istanbul</SelectItem>
            <SelectItem value="Cairo">Cairo</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48 h-12 border-2 border-[#E6E6FF]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            <SelectItem value="Cultural">Cultural</SelectItem>
            <SelectItem value="Food & Dining">Food & Dining</SelectItem>
            <SelectItem value="Nature">Nature</SelectItem>
            <SelectItem value="Adventure">Adventure</SelectItem>
            <SelectItem value="Historical">Historical</SelectItem>
            <SelectItem value="Nightlife">Nightlife</SelectItem>
            <SelectItem value="Shopping">Shopping</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Adventures Grid */}
      {filteredAdventures.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg border-2 border-[#E6E6FF]">
          <div className="w-24 h-24 bg-gradient-to-br from-[#CCCCFF] to-[#E6E6FF] rounded-full flex items-center justify-center mx-auto mb-6">
            <Compass className="w-12 h-12 text-[#9933CC]" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No adventures found</h3>
          <p className="text-gray-600">
            Check back soon for new exciting experiences!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAdventures.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <AdventureCard post={post} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
