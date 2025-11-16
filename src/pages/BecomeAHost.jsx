import { useMutation } from '@tanstack/react-query';
import { Send, Loader2, CheckCircle, Home, Star  } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { addDocument } from '@/utils/firestore';


import PageHero from '@/shared/components/PageHero';

export default function BecomeAHost() {
  const [formData, setFormData] = useState({
    host_full_name: '',
    host_email: '',
    host_phone: '',
    host_whatsapp: '',
    host_city: '',
    host_bio: '',
    experience_years: 0,
    languages: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const createHostRequestMutation = useMutation({
    mutationFn: async (requestData) => {
      await addDocument('host_requests', {
        ...requestData,
        status: 'pending',
        created_date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast.success('Your request has been sent successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to send request: ${error.message}`);
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createHostRequestMutation.mutate({
      ...formData,
      request_type: 'self_registered',
      languages: formData.languages
        .split(',')
        .map((lang) => lang.trim())
        .filter(Boolean),
    });
  };

  if (isSubmitted) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E6E6FF] via-white to-[#CCCCFF] p-4'>
        <Card className='w-full max-w-lg text-center shadow-2xl p-8'>
          <CardContent>
            <CheckCircle className='w-20 h-20 text-green-500 mx-auto mb-6' />
            <h2 className='text-3xl font-bold text-gray-900 mb-3'>Thank You!</h2>
            <p className='text-gray-600'>
              Your request to become a host has been received. Our team will review it and get back
              to you soon.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white'>
      {/* Hero Section */}
      <PageHero
        title='Become a SAWA Host'
        subtitle='Share your city, culture, and stories with travelers from around the world'
        backgroundImage='https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1600'
        overlay='gradient'
        size='large'
        badge={{
          icon: <Home className='w-4 h-4' />,
          text: 'Join Our Community',
        }}
        actions={
          <Button
              onClick={() =>
                document.getElementById('host-form')?.scrollIntoView({ behavior: 'smooth' })
              }
              className='bg-white text-[var(--brand-primary)] hover:bg-gray-100 px-8 py-6 text-lg font-bold rounded-xl shadow-xl'
            >
              <Star className='w-5 h-5 mr-2' />
              Start Your Journey
            </Button>
        }
      />

      {/* Content */}
      <section className='section-padding py-12 px-4'>
        <div className='max-w-2xl mx-auto'>
          <Card className='shadow-2xl' id='host-form'>
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <Label htmlFor='host_full_name'>Full Name</Label>
                    <Input
                      id='host_full_name'
                      name='host_full_name'
                      value={formData.host_full_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor='host_email'>Email</Label>
                    <Input
                      id='host_email'
                      name='host_email'
                      type='email'
                      value={formData.host_email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <Label htmlFor='host_phone'>Phone</Label>
                    <Input
                      id='host_phone'
                      name='host_phone'
                      value={formData.host_phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor='host_whatsapp'>WhatsApp (Optional)</Label>
                    <Input
                      id='host_whatsapp'
                      name='host_whatsapp'
                      value={formData.host_whatsapp}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <Label htmlFor='host_city'>City</Label>
                    <Select
                      name='host_city'
                      onValueChange={(value) => handleSelectChange('host_city', value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select your city' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='Damascus'>Damascus</SelectItem>
                        <SelectItem value='Amman'>Amman</SelectItem>
                        <SelectItem value='Istanbul'>Istanbul</SelectItem>
                        <SelectItem value='Cairo'>Cairo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor='experience_years'>Years of Experience</Label>
                    <Input
                      id='experience_years'
                      name='experience_years'
                      type='number'
                      value={formData.experience_years}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor='languages'>Languages (comma-separated)</Label>
                  <Input
                    id='languages'
                    name='languages'
                    value={formData.languages}
                    onChange={handleChange}
                    placeholder='e.g. Arabic, English'
                  />
                </div>

                <div>
                  <Label htmlFor='host_bio'>About You</Label>
                  <Textarea
                    id='host_bio'
                    name='host_bio'
                    value={formData.host_bio}
                    onChange={handleChange}
                    rows={4}
                    placeholder='Tell us about yourself and why you want to be a host.'
                    required
                  />
                </div>

                <Button
                  type='submit'
                  disabled={createHostRequestMutation.isPending}
                  className='w-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white text-lg py-3'
                >
                  {createHostRequestMutation.isPending ? (
                    <Loader2 className='w-6 h-6 mr-2 animate-spin' />
                  ) : (
                    <Send className='w-5 h-5 mr-2' />
                  )}
                  Send Request
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
