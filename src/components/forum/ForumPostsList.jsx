import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryDocuments } from '@/utils/firestore';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { motion } from 'framer-motion';
import PostCard from './PostCard';

export default function ForumPostsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['forumPosts'],
    queryFn: async () => {
      const allPosts = await queryDocuments('forum_posts', [
        ['status', '==', 'published'],
        ['is_adventure_listing', '==', false],
      ], {
        orderBy: { field: 'created_date', direction: 'desc' }
      });
      return allPosts;
    },
    staleTime: 30000,
  });

  const filteredPosts = posts.filter((post) => {
    const searchMatch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content_html.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = selectedCategory === 'All' || post.category === selectedCategory;
    return searchMatch && categoryMatch;
  });

  if (isLoading) {
    return (
      <div className='flex justify-center py-16'>
        <Loader2 className='w-8 h-8 animate-spin text-[#9933CC]' />
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className='flex flex-col sm:flex-row gap-4 mb-8'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
          <Input
            type='text'
            placeholder='Search discussions...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='pl-10 h-12 border-2 border-[#E6E6FF] focus:border-[#9933CC]'
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className='w-full sm:w-48 h-12 border-2 border-[#E6E6FF]'>
            <SelectValue placeholder='Category' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='All'>All Categories</SelectItem>
            <SelectItem value='General'>General</SelectItem>
            <SelectItem value='Damascus'>Damascus</SelectItem>
            <SelectItem value='Amman'>Amman</SelectItem>
            <SelectItem value='Istanbul'>Istanbul</SelectItem>
            <SelectItem value='Cairo'>Cairo</SelectItem>
            <SelectItem value='Travel Tips'>Travel Tips</SelectItem>
            <SelectItem value='Food & Culture'>Food & Culture</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className='text-center py-16'>
          <p className='text-gray-600 text-lg'>
            No posts found. Be the first to start a discussion!
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
