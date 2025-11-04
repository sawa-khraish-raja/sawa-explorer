import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  UserPlus,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createPageUrl } from '@/utils';
import { getAllDocuments, addDocument } from '@/utils/firestore';

import { useAppContext } from '../components/context/AppContext';

export default function OfficeAddHost() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [hostEmail, setHostEmail] = useState('');
  const [hostFullName, setHostFullName] = useState('');
  const [hostPhone, setHostPhone] = useState('');
  const [hostWhatsApp, setHostWhatsApp] = useState('');
  const [hostBio, setHostBio] = useState('');

  // Get current user (office)
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const currentUser = await useAppContext().user;
      if (!currentUser || (currentUser.role_type !== 'office' && currentUser.role !== 'office')) {
        toast.error('Access denied');
        navigate(createPageUrl('Home'));
        return null;
      }
      return currentUser;
    },
    retry: false,
  });

  // Get office profile
  const { data: office, isLoading: officeLoading } = useQuery({
    queryKey: ['office', user?.email],
    queryFn: async () => {
      const offices = await getAllDocuments('offices');
      const myOffice = offices.find((o) => o.email?.toLowerCase() === user.email.toLowerCase());
      if (!myOffice) {
        toast.error('Office profile not found');
        return null;
      }
      return myOffice;
    },
    enabled: !!user?.email,
    retry: false,
  });

  // Get host requests
  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['hostRequests', office?.name],
    queryFn: async () => {
      const allRequests = await getAllDocuments('hostrequests');
      return allRequests.filter((r) => r.office_name === office.name);
    },
    enabled: !!office?.name,
    retry: false,
  });

  // Submit host request
  const submitRequestMutation = useMutation({
    mutationFn: async (formData) => {
      console.log('Creating host request:', formData);

      const newRequest = await addDocument('hostrequests', {
        ...{
          office_name: office.name,
          office_email: office.email,
          host_full_name: formData.host_full_name,
          host_email: formData.host_email,
          host_phone: formData.host_phone,
          host_whatsapp: formData.host_whatsapp || formData.host_phone,
          host_city: office.city,
          host_bio: formData.host_bio || '',
          experience_years: 1,
          languages: ['English', 'Arabic'],
          services_offered: [],
          status: 'pending',
        },
        created_date: new Date().toISOString(),
      });

      console.log(' Request created:', newRequest.id);
      return newRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostRequests'] });
      setHostEmail('');
      setHostFullName('');
      setHostPhone('');
      setHostWhatsApp('');
      setHostBio('');
      toast.success(' Host request submitted!', {
        description: 'Admin will review your request',
      });
    },
    onError: (error) => {
      console.error(' Submit error:', error);
      toast.error('Failed to submit request', {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!hostEmail || !hostFullName || !hostPhone) {
      toast.error('Please fill all required fields');
      return;
    }

    submitRequestMutation.mutate({
      host_email: hostEmail,
      host_full_name: hostFullName,
      host_phone: hostPhone,
      host_whatsapp: hostWhatsApp,
      host_bio: hostBio,
    });
  };

  if (userLoading || officeLoading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <Loader2 className='w-12 h-12 animate-spin text-blue-600' />
      </div>
    );
  }

  if (!user || !office) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen p-8'>
        <AlertCircle className='w-16 h-16 text-red-500 mb-4' />
        <h2 className='text-2xl font-bold mb-2'>Access Denied</h2>
        <Button onClick={() => navigate(createPageUrl('Home'))}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <Button
            variant='ghost'
            onClick={() => navigate(createPageUrl('OfficeDashboard'))}
            className='mb-4'
          >
            <ArrowLeft className='w-4 h-4 mr-2' />
            Back to Dashboard
          </Button>
          <h1 className='text-3xl font-bold text-gray-900'>Request New Host</h1>
          <p className='text-gray-600 mt-2'>Submit a request to add a new host to {office.name}</p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Form */}
          <div className='lg:col-span-2'>
            <Card className='shadow-xl'>
              <CardHeader className='bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg'>
                <CardTitle className='flex items-center gap-2'>
                  <UserPlus className='w-5 h-5' />
                  Host Information
                </CardTitle>
              </CardHeader>
              <CardContent className='p-6'>
                <form onSubmit={handleSubmit} className='space-y-6'>
                  {/* Host Email */}
                  <div>
                    <Label htmlFor='hostEmail' className='flex items-center gap-2'>
                      <Mail className='w-4 h-4' />
                      Host Email *
                    </Label>
                    <Input
                      id='hostEmail'
                      type='email'
                      value={hostEmail}
                      onChange={(e) => setHostEmail(e.target.value)}
                      placeholder='host@example.com'
                      className='mt-2'
                      required
                    />
                    <p className='text-xs text-gray-500 mt-1'>
                      📧 The host must register on SAWA first with this email
                    </p>
                  </div>

                  {/* Host Full Name */}
                  <div>
                    <Label htmlFor='hostFullName' className='flex items-center gap-2'>
                      <User className='w-4 h-4' />
                      Full Name *
                    </Label>
                    <Input
                      id='hostFullName'
                      value={hostFullName}
                      onChange={(e) => setHostFullName(e.target.value)}
                      placeholder='Host full name'
                      className='mt-2'
                      required
                    />
                  </div>

                  {/* Host Phone */}
                  <div>
                    <Label htmlFor='hostPhone' className='flex items-center gap-2'>
                      <Phone className='w-4 h-4' />
                      Phone Number *
                    </Label>
                    <Input
                      id='hostPhone'
                      type='tel'
                      value={hostPhone}
                      onChange={(e) => setHostPhone(e.target.value)}
                      placeholder='+963 XXX XXX XXX'
                      className='mt-2'
                      required
                    />
                  </div>

                  {/* Host WhatsApp */}
                  <div>
                    <Label htmlFor='hostWhatsApp' className='flex items-center gap-2'>
                      <Phone className='w-4 h-4' />
                      WhatsApp Number
                    </Label>
                    <Input
                      id='hostWhatsApp'
                      type='tel'
                      value={hostWhatsApp}
                      onChange={(e) => setHostWhatsApp(e.target.value)}
                      placeholder='+963 XXX XXX XXX'
                      className='mt-2'
                    />
                  </div>

                  {/* Host City (Read-only) */}
                  <div>
                    <Label htmlFor='hostCity' className='flex items-center gap-2'>
                      <MapPin className='w-4 h-4' />
                      City
                    </Label>
                    <Input id='hostCity' value={office.city} className='mt-2 bg-gray-50' disabled />
                    <p className='text-xs text-gray-500 mt-1'>
                      Host will be assigned to {office.city}
                    </p>
                  </div>

                  {/* Host Bio */}
                  <div>
                    <Label htmlFor='hostBio'>About the Host</Label>
                    <textarea
                      id='hostBio'
                      value={hostBio}
                      onChange={(e) => setHostBio(e.target.value)}
                      placeholder="Tell us about this host's experience and skills..."
                      className='mt-2 w-full h-24 px-3 py-2 border rounded-md'
                    />
                  </div>

                  {/* Submit */}
                  <div className='flex justify-end gap-3 pt-4 border-t'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => navigate(createPageUrl('OfficeDashboard'))}
                    >
                      Cancel
                    </Button>
                    <Button
                      type='submit'
                      disabled={submitRequestMutation.isPending}
                      className='bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                    >
                      {submitRequestMutation.isPending ? (
                        <>
                          <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <UserPlus className='w-4 h-4 mr-2' />
                          Submit Request
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Your Requests */}
            <Card className='shadow-xl'>
              <CardHeader className='bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg'>
                <CardTitle className='text-lg'>Your Requests</CardTitle>
              </CardHeader>
              <CardContent className='p-4'>
                {requestsLoading ? (
                  <div className='flex justify-center py-8'>
                    <Loader2 className='w-6 h-6 animate-spin text-blue-600' />
                  </div>
                ) : requests.length === 0 ? (
                  <p className='text-sm text-gray-500 text-center py-4'>No requests yet</p>
                ) : (
                  <div className='space-y-3 max-h-96 overflow-y-auto'>
                    {requests.map((request) => (
                      <div
                        key={request.id}
                        className='p-3 border rounded-lg bg-white hover:shadow-md transition-shadow'
                      >
                        <div className='flex items-center justify-between mb-2'>
                          <p className='font-semibold text-sm'>{request.host_full_name}</p>
                          <Badge
                            className={
                              request.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : request.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {request.status === 'approved' && (
                              <CheckCircle className='w-3 h-3 mr-1' />
                            )}
                            {request.status === 'rejected' && <XCircle className='w-3 h-3 mr-1' />}
                            {request.status === 'pending' && <Clock className='w-3 h-3 mr-1' />}
                            {request.status}
                          </Badge>
                        </div>
                        <p className='text-xs text-gray-500'>{request.host_email}</p>
                        <p className='text-xs text-gray-400 mt-1'>
                          {format(new Date(request.created_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {requests.length > 0 && (
                  <div className='mt-4 pt-4 border-t grid grid-cols-3 gap-2 text-center'>
                    <div>
                      <p className='text-2xl font-bold text-yellow-600'>
                        {requests.filter((r) => r.status === 'pending').length}
                      </p>
                      <p className='text-xs text-gray-600'>Pending</p>
                    </div>
                    <div>
                      <p className='text-2xl font-bold text-green-600'>
                        {requests.filter((r) => r.status === 'approved').length}
                      </p>
                      <p className='text-xs text-gray-600'>Approved</p>
                    </div>
                    <div>
                      <p className='text-2xl font-bold text-red-600'>
                        {requests.filter((r) => r.status === 'rejected').length}
                      </p>
                      <p className='text-xs text-gray-600'>Rejected</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className='bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-xl'>
              <CardContent className='p-4'>
                <div className='flex gap-2 text-blue-900'>
                  <AlertCircle className='w-5 h-5 flex-shrink-0 mt-0.5' />
                  <div className='text-sm'>
                    <p className='font-bold mb-2'>How it works:</p>
                    <ol className='text-xs space-y-2 list-decimal list-inside'>
                      <li>Enter the host's email and information</li>
                      <li>Submit the request to admin</li>
                      <li>Admin reviews and approves the request</li>
                      <li>Host will be added to your office</li>
                      <li>Host appears on your dashboard</li>
                    </ol>
                    <p className='mt-3 font-bold text-blue-800'>
                      The host must be registered and approved by admin first!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
