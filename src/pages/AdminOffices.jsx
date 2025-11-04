import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Building2, Plus, Search, Users, Calendar, DollarSign, Eye } from 'lucide-react'; // Added Eye
import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Added useNavigate

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createPageUrl } from '@/utils'; // Added createPageUrl
import { getAllDocuments } from '@/utils/firestore';

import AdminLayout from '../components/admin/AdminLayout';
import CreateOfficeDialog from '../components/admin/CreateOfficeDialog';



export default function AdminOffices() {
  const queryClient = useQueryClient();
  const navigate = useNavigate(); // Added navigate hook
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOfficeOpen, setCreateOfficeOpen] = useState(false);

  const { data: offices = [], isLoading } = useQuery({
    queryKey: ['allOffices'],
    queryFn: () => getAllDocuments('offices'),
    refetchOnWindowFocus: true,
  });

  const handleViewOffice = (officeId) => {
    navigate(`${createPageUrl('OfficeDashboard')}?observer=true&officeId=${officeId}`);
  };

  const filteredOffices = offices.filter(
    (office) =>
      office.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      office.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className='space-y-6'>
        <Card className='bg-gradient-to-r from-[#330066] to-[#5C00B8] text-white shadow-2xl'>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle className='flex items-center gap-3 text-2xl'>
              <Building2 className='w-7 h-7' />
              Manage Offices ({offices.length})
            </CardTitle>
            <Button
              onClick={() => setCreateOfficeOpen(true)}
              className='bg-white/20 hover:bg-white/30 text-white'
            >
              <Plus className='w-4 h-4 mr-2' />
              Create New Office
            </Button>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
              <Input
                placeholder='Search by office name or city...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10 h-11'
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className='flex justify-center items-center h-64'>
                <Loader2 className='w-8 h-8 animate-spin text-purple-600' />
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {filteredOffices.map((office) => (
                  <Card
                    key={office.id}
                    className='hover:shadow-lg transition-shadow border-l-4 border-purple-500'
                  >
                    <CardHeader>
                      <CardTitle className='text-xl'>{office.name}</CardTitle>
                      <p className='text-sm text-gray-500'>{office.city}</p>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-2 text-sm'>
                        <div className='flex items-center justify-between'>
                          <span className='text-gray-600 flex items-center gap-2'>
                            <Users className='w-4 h-4' /> Total Hosts:
                          </span>
                          <span className='font-semibold'>{office.total_hosts || 0}</span>
                        </div>
                        <div className='flex items-center justify-between'>
                          <span className='text-gray-600 flex items-center gap-2'>
                            <Calendar className='w-4 h-4' /> Total Bookings:
                          </span>
                          <span className='font-semibold'>{office.total_bookings || 0}</span>
                        </div>
                        <div className='flex items-center justify-between'>
                          <span className='text-gray-600 flex items-center gap-2'>
                            <DollarSign className='w-4 h-4' /> Total Revenue:
                          </span>
                          <span className='font-semibold text-green-600'>
                            ${(office.total_revenue || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className='mt-4 pt-4 border-t flex gap-2'>
                        <Button
                          size='sm'
                          variant='outline'
                          className='flex-1'
                          onClick={() => handleViewOffice(office.id)}
                        >
                          <Eye className='w-4 h-4 mr-2' />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateOfficeDialog isOpen={isCreateOfficeOpen} onClose={() => setCreateOfficeOpen(false)} />
    </AdminLayout>
  );
}
