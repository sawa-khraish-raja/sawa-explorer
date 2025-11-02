import React from 'react';
import { Button } from '@/components/ui/button';
import { Utensils, Palette, Music, Briefcase, Users, Star, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORIES = [
  { name: 'All', icon: Star, color: 'from-purple-500 to-purple-600' },
  { name: 'Culture', icon: Palette, color: 'from-pink-500 to-rose-500' },
  { name: 'Food', icon: Utensils, color: 'from-orange-500 to-red-500' },
  { name: 'Music', icon: Music, color: 'from-blue-500 to-indigo-500' },
  { name: 'Business', icon: Briefcase, color: 'from-gray-600 to-gray-700' },
  { name: 'Community', icon: Users, color: 'from-green-500 to-emerald-500' },
];

const PRICE_RANGES = [
  { label: 'All Prices', value: null },
  { label: 'Free', value: 'free' },
  { label: 'Under $20', value: 'under_20' },
  { label: '$20-$50', value: '20_50' },
  { label: 'Over $50', value: 'over_50' },
];

export default function EventFilters({ filters, onFilterChange }) {
  return (
    <div className='space-y-6 mb-8'>
      {/* Category Filters */}
      <div>
        <h3 className='text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2'>
          <Star className='w-4 h-4 text-purple-600' />
          Categories
        </h3>
        <div className='flex flex-wrap gap-2'>
          {CATEGORIES.map((category, index) => {
            const Icon = category.icon;
            const isActive = filters.category === category.name;

            return (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  variant={isActive ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => onFilterChange({ ...filters, category: category.name })}
                  className={`
                    rounded-full px-4 py-2 transition-all duration-300
                    ${
                      isActive
                        ? `bg-gradient-to-r ${category.color} text-white shadow-lg hover:shadow-xl`
                        : 'border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }
                  `}
                >
                  <Icon className='w-4 h-4 mr-2' />
                  {category.name}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Price Range Filters */}
      <div>
        <h3 className='text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2'>
          <DollarSign className='w-4 h-4 text-green-600' />
          Price Range
        </h3>
        <div className='flex flex-wrap gap-2'>
          {PRICE_RANGES.map((range, index) => {
            const isActive = filters.priceRange === range.value;

            return (
              <motion.div
                key={range.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  variant={isActive ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => onFilterChange({ ...filters, priceRange: range.value })}
                  className={`
                    rounded-full px-4 py-2 transition-all duration-300
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl'
                        : 'border-2 border-gray-200 hover:border-green-300 hover:bg-green-50'
                    }
                  `}
                >
                  {range.label}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Featured Toggle */}
      <div>
        <Button
          variant={filters.featured ? 'default' : 'outline'}
          size='sm'
          onClick={() => onFilterChange({ ...filters, featured: !filters.featured })}
          className={`
            rounded-full px-4 py-2 transition-all duration-300
            ${
              filters.featured
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg hover:shadow-xl'
                : 'border-2 border-gray-200 hover:border-amber-300 hover:bg-amber-50'
            }
          `}
        >
          <Star className='w-4 h-4 mr-2' />
          Featured Only
        </Button>
      </div>
    </div>
  );
}
