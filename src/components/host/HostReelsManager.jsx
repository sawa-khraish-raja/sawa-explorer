import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllDocuments, queryDocuments, getDocument, addDocument, updateDocument, deleteDocument } from '@/utils/firestore';
import { uploadImage, uploadVideo } from '@/utils/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Video,
  Image as ImageIcon,
  Upload,
  Trash2,
  Eye,
  Heart,
  Loader2,
  Plus,
  X,
  Play,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

export default function HostReelsManager({ user }) {
  const queryClient = useQueryClient();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadType, setUploadType] = useState('video');
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const { data: reels = [], isLoading } = useQuery({
    queryKey: ['hostReels', user?.email],
    queryFn: async () => {
      const allReels = await queryDocuments('host_reels', [
        {
          host_email: user.email,
        },
        '-created_date'
      );
      return allReels;
    },
    enabled: !!user,
  });

  const createReelMutation = useMutation({
    mutationFn: async (reelData) => {
      return addDocument('hostreels', { ...reelData, created_date: new Date().toISOString() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostReels'] });
      setShowUploadDialog(false);
      setCaption('');
      setSelectedFile(null);
      setPreviewUrl('');
      toast.success('🎬 Reel uploaded successfully!');
    },
    onError: () => {
      toast.error('Failed to upload reel');
    },
  });

  const deleteReelMutation = useMutation({
    mutationFn: async (reelId) => {
      await deleteDocument('hostreels', reelId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostReels'] });
      toast.success('Reel deleted');
    },
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // FIXED: Better file size validation
    const maxSize = uploadType === 'video' ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB for video, 10MB for image
    if (file.size > maxSize) {
      toast.error(`File too large. Maximum size is ${uploadType === 'video' ? '100MB' : '10MB'}`);
      return;
    }

    // FIXED: Better file type validation
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (uploadType === 'video' && !isVideo) {
      toast.error('Please select a video file');
      return;
    }

    if (uploadType === 'image' && !isImage) {
      toast.error('Please select an image file');
      return;
    }

    setSelectedFile(file);

    // FIXED: Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    console.log(' File selected:', {
      name: file.name,
      type: file.type,
      size: (file.size / 1024 / 1024).toFixed(2) + 'MB',
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    if (!caption.trim()) {
      toast.error('Please add a caption');
      return;
    }

    setUploading(true);

    try {


      // Upload file
      const { file_url } = await uploadImage(selectedFile,
       'uploads');

      console.log(' File uploaded:', file_url);

      // Create reel
      await createReelMutation.mutateAsync({
        host_email: user.email,
        host_name: user.full_name || user.email,
        media_type: uploadType,
        media_url: file_url,
        thumbnail_url: file_url, // For now, use file_url as thumbnail_url
        caption: caption.trim(),
        city: user.city,
        likes_count: 0,
        liked_by: [],
        views_count: 0,
        is_active: true,
      });

      console.log(' Reel created successfully');
    } catch (error) {
      console.error(' Upload error:', error);
      toast.error('Failed to upload. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // FIXED: Cleanup preview URL on unmount or previewUrl change
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900 flex items-center gap-2'>
            <Video className='w-6 h-6 text-purple-600' />
            My Reels
          </h2>
          <p className='text-sm text-gray-600 mt-1'>Share your experiences with travelers</p>
        </div>
        <Button
          onClick={() => setShowUploadDialog(true)}
          className='bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
        >
          <Plus className='w-4 h-4 mr-2' />
          Upload Reel
        </Button>
      </div>

      {/* Reels Grid */}
      {isLoading ? (
        <div className='flex justify-center items-center py-20'>
          <Loader2 className='w-8 h-8 animate-spin text-purple-600' />
        </div>
      ) : reels.length === 0 ? (
        <Card className='border-2 border-dashed'>
          <CardContent className='py-16 text-center'>
            <div className='w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Video className='w-10 h-10 text-purple-600' />
            </div>
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>No Reels Yet</h3>
            <p className='text-gray-600 mb-6 max-w-md mx-auto'>
              Start sharing your experiences! Upload videos or photos to attract more travelers.
            </p>
            <Button
              onClick={() => setShowUploadDialog(true)}
              className='bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
            >
              <Plus className='w-4 h-4 mr-2' />
              Upload Your First Reel
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
          <AnimatePresence>
            {reels.map((reel) => (
              <motion.div
                key={reel.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className='group relative'
              >
                <Card className='overflow-hidden hover:shadow-xl transition-all duration-300 border-2'>
                  <div className='relative aspect-[9/16] bg-gray-100'>
                    {reel.media_type === 'video' ? (
                      <div className='relative w-full h-full'>
                        <video
                          src={reel.media_url}
                          className='w-full h-full object-cover'
                          muted
                          loop
                          playsInline
                          onMouseEnter={(e) => e.target.play()}
                          onMouseLeave={(e) => e.target.pause()}
                        />
                        <div className='absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all'>
                          <Play className='w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity' />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={reel.media_url}
                        alt={reel.caption}
                        className='w-full h-full object-cover'
                      />
                    )}

                    {/* Overlay */}
                    <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all'>
                      <div className='absolute bottom-0 left-0 right-0 p-3 text-white'>
                        <p className='text-sm font-medium line-clamp-2 mb-2'>{reel.caption}</p>
                        <div className='flex items-center gap-4 text-xs'>
                          <span className='flex items-center gap-1'>
                            <Heart className='w-3 h-3' />
                            {reel.likes_count || 0}
                          </span>
                          <span className='flex items-center gap-1'>
                            <Eye className='w-3 h-3' />
                            {reel.views_count || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <Button
                      size='icon'
                      variant='destructive'
                      className='absolute top-2 right-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity'
                      onClick={() => {
                        if (confirm('Delete this reel?')) {
                          deleteReelMutation.mutate(reel.id);
                        }
                      }}
                    >
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog
        open={showUploadDialog}
        onOpenChange={(open) => {
          setShowUploadDialog(open);
          if (!open) {
            // Cleanup on close
            setSelectedFile(null);
            setPreviewUrl('');
            setCaption('');
          }
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Sparkles className='w-5 h-5 text-purple-600' />
              Upload New Reel
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-4'>
            {/* Type Selection */}
            <div className='flex gap-2'>
              <Button
                variant={uploadType === 'video' ? 'default' : 'outline'}
                className={
                  uploadType === 'video' ? 'bg-purple-600 hover:bg-purple-700 flex-1' : 'flex-1'
                }
                onClick={() => {
                  setUploadType('video');
                  setSelectedFile(null);
                  setPreviewUrl('');
                }}
              >
                <Video className='w-4 h-4 mr-2' />
                Video
              </Button>
              <Button
                variant={uploadType === 'image' ? 'default' : 'outline'}
                className={
                  uploadType === 'image' ? 'bg-purple-600 hover:bg-purple-700 flex-1' : 'flex-1'
                }
                onClick={() => {
                  setUploadType('image');
                  setSelectedFile(null);
                  setPreviewUrl('');
                }}
              >
                <ImageIcon className='w-4 h-4 mr-2' />
                Image
              </Button>
            </div>

            {/* FIXED: File Upload */}
            <div>
              <Label>Choose {uploadType === 'video' ? 'Video' : 'Image'}</Label>
              <div className='mt-2'>
                {!previewUrl ? (
                  <>
                    <input
                      type='file'
                      accept={
                        uploadType === 'video'
                          ? 'video/mp4,video/quicktime,video/*'
                          : 'image/jpeg,image/jpg,image/png,image/webp,image/*'
                      }
                      onChange={handleFileSelect}
                      className='hidden'
                      id='reel-file-input'
                    />
                    <label
                      htmlFor='reel-file-input'
                      className='flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors'
                    >
                      <Upload className='w-12 h-12 text-purple-400 mb-3' />
                      <p className='text-sm font-medium text-gray-700 mb-1'>
                        Click to upload {uploadType}
                      </p>
                      <p className='text-xs text-gray-500'>
                        {uploadType === 'video'
                          ? 'MP4, MOV up to 100MB'
                          : 'JPG, PNG, WEBP up to 10MB'}
                      </p>
                    </label>
                  </>
                ) : (
                  <div className='relative w-full h-48 rounded-lg overflow-hidden border-2 border-purple-300'>
                    {uploadType === 'video' ? (
                      <video src={previewUrl} className='w-full h-full object-cover' controls />
                    ) : (
                      <img src={previewUrl} className='w-full h-full object-cover' alt='Preview' />
                    )}
                    <Button
                      size='icon'
                      variant='destructive'
                      className='absolute top-2 right-2 w-8 h-8 rounded-full'
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedFile(null);
                        setPreviewUrl('');
                      }}
                    >
                      <X className='w-4 h-4' />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Caption */}
            <div>
              <Label>Caption *</Label>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder='Write a caption for your reel...'
                rows={3}
                maxLength={500}
                className='mt-2'
              />
              <p className='text-xs text-gray-500 mt-1'>{caption.length}/500 characters</p>
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={uploading || !selectedFile || !caption.trim()}
              className='w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-11'
            >
              {uploading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className='w-4 h-4 mr-2' />
                  Upload Reel
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
