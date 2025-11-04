import { Calendar, Search, Filter, X, ArrowUpDown } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';


export default function BookingFilters({ filters, onFilterChange, onClearFilters, bookingCounts }) {
  return (
    <Card className='bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200'>
      <CardContent className='p-4 sm:p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='font-bold text-gray-900 flex items-center gap-2'>
            <Filter className='w-5 h-5 text-purple-600' />
            Filter & Sort Bookings
          </h3>
          {(filters.status || filters.city || filters.sortBy || filters.search) && (
            <Button
              variant='ghost'
              size='sm'
              onClick={onClearFilters}
              className='text-gray-600 hover:text-gray-900'
            >
              <X className='w-4 h-4 mr-1' />
              Clear All
            </Button>
          )}
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {/* Search */}
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
            <Input
              placeholder='Search bookings...'
              value={filters.search || ''}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              className='pl-10'
            />
          </div>

          {/* Status Filter */}
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) =>
              onFilterChange({ ...filters, status: value === 'all' ? '' : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder='All Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Status ({bookingCounts?.total || 0})</SelectItem>
              <SelectItem value='pending'>Pending ({bookingCounts?.pending || 0})</SelectItem>
              <SelectItem value='confirmed'>Confirmed ({bookingCounts?.confirmed || 0})</SelectItem>
              <SelectItem value='completed'>Completed ({bookingCounts?.completed || 0})</SelectItem>
              <SelectItem value='cancelled'>Cancelled ({bookingCounts?.cancelled || 0})</SelectItem>
            </SelectContent>
          </Select>

          {/* City Filter */}
          <Select
            value={filters.city || 'all'}
            onValueChange={(value) =>
              onFilterChange({ ...filters, city: value === 'all' ? '' : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder='All Cities' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Cities</SelectItem>
              <SelectItem value='Damascus'>Damascus</SelectItem>
              <SelectItem value='Amman'>Amman</SelectItem>
              <SelectItem value='Istanbul'>Istanbul</SelectItem>
              <SelectItem value='Cairo'>Cairo</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select
            value={filters.sortBy || 'newest'}
            onValueChange={(value) => onFilterChange({ ...filters, sortBy: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder='Sort By' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='newest'>
                <div className='flex items-center gap-2'>
                  <ArrowUpDown className='w-4 h-4' />
                  Newest First
                </div>
              </SelectItem>
              <SelectItem value='oldest'>
                <div className='flex items-center gap-2'>
                  <ArrowUpDown className='w-4 h-4' />
                  Oldest First
                </div>
              </SelectItem>
              <SelectItem value='date_asc'>
                <div className='flex items-center gap-2'>
                  <Calendar className='w-4 h-4' />
                  Check-in (Earliest)
                </div>
              </SelectItem>
              <SelectItem value='date_desc'>
                <div className='flex items-center gap-2'>
                  <Calendar className='w-4 h-4' />
                  Check-in (Latest)
                </div>
              </SelectItem>
              <SelectItem value='price_high'>Price (High to Low)</SelectItem>
              <SelectItem value='price_low'>Price (Low to High)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters Display */}
        {(filters.status || filters.city || filters.search) && (
          <div className='flex flex-wrap gap-2 mt-4 pt-4 border-t border-purple-100'>
            <span className='text-sm text-gray-600'>Active Filters:</span>
            {filters.status && (
              <Badge variant='outline' className='gap-1'>
                Status: {filters.status}
                <button
                  onClick={() => onFilterChange({ ...filters, status: '' })}
                  className='ml-1 hover:text-red-600'
                >
                  <X className='w-3 h-3' />
                </button>
              </Badge>
            )}
            {filters.city && (
              <Badge variant='outline' className='gap-1'>
                City: {filters.city}
                <button
                  onClick={() => onFilterChange({ ...filters, city: '' })}
                  className='ml-1 hover:text-red-600'
                >
                  <X className='w-3 h-3' />
                </button>
              </Badge>
            )}
            {filters.search && (
              <Badge variant='outline' className='gap-1'>
                Search: "{filters.search}"
                <button
                  onClick={() => onFilterChange({ ...filters, search: '' })}
                  className='ml-1 hover:text-red-600'
                >
                  <X className='w-3 h-3' />
                </button>
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
