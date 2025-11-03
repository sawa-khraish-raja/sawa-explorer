import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllDocuments, queryDocuments, getDocument, addDocument, updateDocument, deleteDocument } from '@/utils/firestore';
import { uploadImage, uploadVideo } from '@/utils/storage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateOfficeDialog({ isOpen, onClose, office }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');

  const isEditing = !!office;

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setName(office.name || '');
        setEmail(office.email || '');
        setCity(office.city || '');
        setDescription(office.description || '');
      } else {
        setName('');
        setEmail('');
        setCity('');
        setDescription('');
      }
    }
  }, [isOpen, office, isEditing]);

  const mutation = useMutation({
    mutationFn: (officeData) => {
      if (isEditing) {
        return updateDocument('offices', office.id, { ...officeData, updated_date: new Date().toISOString() });
      } else {
        return addDocument('offices', { ...officeData, created_date: new Date().toISOString() });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allOffices'] });
      queryClient.invalidateQueries({ queryKey: ['allOfficesForSelect'] });
      toast.success(isEditing ? 'Office updated successfully' : 'Office created successfully');
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !city) {
      toast.error('Please fill all required fields');
      return;
    }
    mutation.mutate({ name, email, city, description });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Building2 className='w-6 h-6' />
            {isEditing ? 'Edit Office' : 'Create New Office'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Editing details for ${office.name}.`
              : 'Add a new office to the platform.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4 py-4'>
          <div>
            <Label htmlFor='name'>Office Name</Label>
            <Input id='name' value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor='email'>Contact Email</Label>
            <Input
              id='email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor='city'>City</Label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger>
                <SelectValue placeholder='Select a city' />
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
            <Label htmlFor='description'>Description</Label>
            <Input
              id='description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' disabled={mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
              ) : (
                <Plus className='w-4 h-4 mr-2' />
              )}
              {isEditing ? 'Save Changes' : 'Create Office'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
