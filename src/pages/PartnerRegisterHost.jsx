import { useMutation } from '@tanstack/react-query';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
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
import { createPageUrl } from '@/utils';
import { addDocument } from '@/utils/firestore';

import CountrySelector from '@/shared/components/CountrySelector';

const CITIES = ['Damascus', 'Amman', 'Istanbul'];

export default function PartnerRegisterHost() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    languages: [],
    bio: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: (data) =>
      addDocument('users', { ...{
        ...data,
        host_status: 'Pending Review',
        show_on_website: false,
      }, created_date: new Date().toISOString() }),
    onSuccess: () => {
      setIsSubmitted(true);
    },
    onError: (err) => {
      toast.error(`Submission failed: ${err.message}. Please check your details and try again.`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !formData.full_name ||
      !formData.email ||
      !formData.country ||
      !formData.city ||
      !formData.bio
    ) {
      toast.warning('Please fill out all required fields.');
      return;
    }
    mutation.mutate(formData);
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  if (isSubmitted) {
    return (
      <div className='min-h-screen bg-[var(--brand-bg-secondary)] flex items-center justify-center p-4'>
        <Card className='w-full max-w-lg text-center'>
          <CardContent className='p-10'>
            <CheckCircle className='w-16 h-16 text-green-500 mx-auto mb-6' />
            <h1 className='text-2xl font-bold text-[var(--brand-text-primary)] mb-4'>
              Submission Received!
            </h1>
            <p className='text-[var(--brand-text-secondary)] mb-8'>
              Thank you for your interest in becoming a host with SAWA. Your profile has been
              submitted for review. Our team will get back to you soon.
            </p>
            <Button
              asChild
              className='bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]'
            >
              <Link to={createPageUrl('Home')}>Return to Homepage</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[var(--brand-bg-secondary)] py-12 px-4'>
      <Card className='max-w-3xl mx-auto'>
        <CardHeader className='text-center'>
          <CardTitle className='text-3xl font-bold'>Become a Host with SAWA</CardTitle>
          <CardDescription>
            Share your culture and earn by providing authentic travel experiences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='grid sm:grid-cols-2 gap-6'>
              <div>
                <Label htmlFor='full_name'>Full Name *</Label>
                <Input
                  id='full_name'
                  required
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor='email'>Email Address *</Label>
                <Input
                  id='email'
                  type='email'
                  required
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </div>
            </div>
            <div className='grid sm:grid-cols-2 gap-6'>
              <div>
                <Label htmlFor='phone'>Phone Number</Label>
                <Input
                  id='phone'
                  type='tel'
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor='country'>Country *</Label>
                <CountrySelector
                  value={formData.country}
                  onChange={(value) => handleChange('country', value)}
                />
              </div>
            </div>
            <div className='grid sm:grid-cols-2 gap-6'>
              <div>
                <Label htmlFor='city'>Your City *</Label>
                <Select
                  required
                  value={formData.city}
                  onValueChange={(value) => handleChange('city', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select your city' />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor='languages'>Languages Spoken</Label>
                <Input
                  id='languages'
                  placeholder='e.g. English, Arabic'
                  value={(formData.languages || []).join(', ')}
                  onChange={(e) =>
                    handleChange(
                      'languages',
                      e.target.value.split(',').map((s) => s.trim())
                    )
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor='bio'>Short Bio *</Label>
              <Textarea
                id='bio'
                required
                placeholder='Tell travelers about yourself, your city, and what makes you a great host.'
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
              />
            </div>
            <Button
              type='submit'
              className='w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]'
              disabled={mutation.isPending}
            >
              {mutation.isPending && <Loader2 className='w-4 h-4 mr-2 animate-spin' />}
              Submit Application
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
