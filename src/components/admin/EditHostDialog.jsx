import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

export default function EditHostDialog({ host, onOpenChange, onSave, isSaving }) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (host) {
      setFormData({
        full_name: host.full_name || '',
        city: host.city || '',
        host_status: host.host_status || 'Draft',
        show_on_website: host.show_on_website || false,
        is_demo: host.is_demo || false,
        display_order: host.display_order || 99,
        bio: host.bio || '',
      });
    }
  }, [host]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  if (!host) return null;

  return (
    <Dialog open={!!host} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Edit Host: {host.full_name}</DialogTitle>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='full_name' className='text-right'>
              Name
            </Label>
            <Input
              id='full_name'
              value={formData.full_name}
              onChange={handleInputChange}
              className='col-span-3'
            />
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='city' className='text-right'>
              City
            </Label>
            <Select
              value={formData.city}
              onValueChange={(value) => setFormData((p) => ({ ...p, city: value }))}
            >
              <SelectTrigger className='col-span-3'>
                <SelectValue placeholder='Select city' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Damascus'>Damascus</SelectItem>
                <SelectItem value='Amman'>Amman</SelectItem>
                <SelectItem value='Istanbul'>Istanbul</SelectItem>
                <SelectItem value='Cairo'>Cairo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='host_status' className='text-right'>
              Status
            </Label>
            <Select
              value={formData.host_status}
              onValueChange={(value) => setFormData((p) => ({ ...p, host_status: value }))}
            >
              <SelectTrigger className='col-span-3'>
                <SelectValue placeholder='Select status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Draft'>Draft</SelectItem>
                <SelectItem value='Pending Review'>Pending Review</SelectItem>
                <SelectItem value='Published'>Published</SelectItem>
                <SelectItem value='Suspended'>Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='display_order' className='text-right'>
              Display Order
            </Label>
            <Input
              id='display_order'
              type='number'
              value={formData.display_order}
              onChange={handleInputChange}
              className='col-span-3'
            />
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='bio' className='text-right'>
              Bio
            </Label>
            <Textarea
              id='bio'
              value={formData.bio}
              onChange={handleInputChange}
              className='col-span-3'
            />
          </div>
          <div className='flex items-center space-x-2 justify-end'>
            <Label htmlFor='show_on_website'>Show on website</Label>
            <Switch
              id='show_on_website'
              checked={formData.show_on_website}
              onCheckedChange={(checked) =>
                setFormData((p) => ({ ...p, show_on_website: checked }))
              }
            />
          </div>
          <div className='flex items-center space-x-2 justify-end'>
            <Label htmlFor='is_demo'>Is Demo Host</Label>
            <Switch
              id='is_demo'
              checked={formData.is_demo}
              onCheckedChange={(checked) => setFormData((p) => ({ ...p, is_demo: checked }))}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type='button' variant='secondary'>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
