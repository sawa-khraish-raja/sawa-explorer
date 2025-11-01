import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  Upload,
  X,
  Image as ImageIcon,
  Video,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { getUserDisplayName } from '@/components/utils/userHelpers';

export default function CreatePostModal({ open, onClose, user }) {
  const queryClient = useQueryClient();
  const [postType, setPostType] = useState('text'); // 'text' or 'video'
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [tags, setTags] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [linkedAdventureId, setLinkedAdventureId] = useState('');

  const isHost = user?.host_approved;

  //  Fetch host's adventures if user is a host
  const { data: hostAdventures = [] } = useQuery({
    queryKey: ['hostAdventures', user?.email],
    queryFn: async () => {
      if (!isHost || !user?.email) return [];
      const allAdventures = await base44.entities.Adventure.list('-created_date');
      const myAdventures = allAdventures.filter(
        (a) =>
          a.host_email === user.email &&
          a.approval_status === 'approved' &&
          new Date(a.date) >= new Date()
      );
      return myAdventures;
    },
    enabled: isHost && !!user?.email,
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData) => {
      await base44.entities.ForumPost.create(postData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['forumPosts']);
      toast.success(' Post submitted for review!');
      handleClose();
    },
    onError: (error) => {
      toast.error(' Failed to create post');
      console.error('Create post error:', error);
    },
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({
          file,
        });
        uploadedUrls.push(file_url);
      }

      if (postType === 'video' && files[0].type.startsWith('video/')) {
        setVideoUrl(uploadedUrls[0]);
        toast.success('Video uploaded successfully!');
      } else {
        setAttachments([...attachments, ...uploadedUrls]);
        toast.success(`Uploaded ${files.length} file(s)`);
      }
    } catch (error) {
      toast.error('Failed to upload files');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('Please add a title');
      return;
    }

    //  Get linked adventure details if selected
    let adventureData = {};
    if (linkedAdventureId) {
      const adventure = hostAdventures.find((a) => a.id === linkedAdventureId);
      if (adventure) {
        adventureData = {
          is_adventure_listing: true,
          adventure_entity_id: adventure.id,
          adventure_summary: {
            title: adventure.title,
            city: adventure.city,
            image_url: adventure.image_url,
            traveler_total_price: adventure.traveler_total_price || adventure.host_price,
            date: adventure.date,
            max_participants: adventure.max_participants,
            current_participants: adventure.current_participants || 0,
            category: adventure.category,
          },
        };
      }
    }

    if (postType === 'video') {
      if (!videoUrl) {
        toast.error('Please upload a video');
        return;
      }

      const postData = {
        author_email: user.email,
        author_first_name: getUserDisplayName(user),
        author_profile_photo: user.profile_photo || '',
        title: title.trim(),
        content_html: content.trim() || 'Video post',
        category,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t),
        attachments: [videoUrl],
        status: 'pending_review',
        is_video_post: true,
        post_type: 'video_reel',
        ...adventureData,
      };

      createPostMutation.mutate(postData);
    } else {
      if (!content.trim()) {
        toast.error('Please add content');
        return;
      }

      const postData = {
        author_email: user.email,
        author_first_name: getUserDisplayName(user),
        author_profile_photo: user.profile_photo || '',
        title: title.trim(),
        content_html: content.trim(),
        category,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t),
        attachments,
        status: 'pending_review',
        is_video_post: false,
        post_type: 'text',
        ...adventureData,
      };

      createPostMutation.mutate(postData);
    }
  };

  const handleClose = () => {
    setPostType('text');
    setTitle('');
    setContent('');
    setCategory('General');
    setTags('');
    setAttachments([]);
    setVideoUrl('');
    setLinkedAdventureId('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold text-gray-900 flex items-center gap-2'>
            Create New Post
            {isHost && (
              <span className='text-sm font-normal bg-gradient-to-r from-[#330066] to-[#9933CC] text-white px-3 py-1 rounded-full flex items-center gap-1'>
                <Sparkles className='w-3 h-3' />
                Host
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Post Type Tabs - Only for Hosts */}
        {isHost && (
          <Tabs value={postType} onValueChange={setPostType} className='w-full'>
            <TabsList className='grid w-full grid-cols-2 mb-4'>
              <TabsTrigger value='text' className='flex items-center gap-2'>
                <ImageIcon className='w-4 h-4' />
                Text Post
              </TabsTrigger>
              <TabsTrigger value='video' className='flex items-center gap-2'>
                <Video className='w-4 h-4' />
                Short Video
              </TabsTrigger>
            </TabsList>

            {/* Text Post Content */}
            <TabsContent value='text' className='space-y-4'>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>Title</label>
                <Input
                  placeholder='Write an engaging title...'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className='text-lg'
                />
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder='Select category' />
                  </SelectTrigger>
                  <SelectContent>
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

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>Content</label>
                <Textarea
                  placeholder='Share your experience, tips, or story...'
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className='resize-none'
                />
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Tags (optional)
                </label>
                <Input
                  placeholder='Separate with commas, e.g: travel, food, culture'
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              {/*  Link to Adventure - Only for hosts */}
              {hostAdventures.length > 0 && (
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                    <LinkIcon className='w-4 h-4 text-[#9933CC]' />
                    Link to Your Adventure (optional)
                  </label>
                  <Select value={linkedAdventureId} onValueChange={setLinkedAdventureId}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select an adventure to promote' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>None - Just a regular post</SelectItem>
                      {hostAdventures.map((adventure) => (
                        <SelectItem key={adventure.id} value={adventure.id}>
                          {adventure.title} - {adventure.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {linkedAdventureId && (
                    <p className='text-xs text-gray-500 mt-2'>
                      🎯 This post will include a "Book Now" button for your adventure
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Images (optional)
                </label>
                <div className='space-y-3'>
                  <label className='flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors'>
                    {uploading ? (
                      <>
                        <Loader2 className='w-5 h-5 animate-spin text-purple-600' />
                        <span className='text-sm text-gray-600'>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className='w-5 h-5 text-gray-500' />
                        <span className='text-sm text-gray-600'>Click to upload images</span>
                      </>
                    )}
                    <input
                      type='file'
                      accept='image/*'
                      multiple
                      onChange={handleFileUpload}
                      className='hidden'
                      disabled={uploading}
                    />
                  </label>

                  {attachments.length > 0 && (
                    <div className='grid grid-cols-3 gap-2'>
                      {attachments.map((url, idx) => (
                        <div key={idx} className='relative group'>
                          <img
                            src={url}
                            alt={`Attachment ${idx + 1}`}
                            className='w-full h-24 object-cover rounded-lg'
                          />
                          <button
                            onClick={() => removeAttachment(idx)}
                            className='absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
                          >
                            <X className='w-3 h-3' />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Video Post Content */}
            <TabsContent value='video' className='space-y-4'>
              <div className='bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border-2 border-purple-200'>
                <div className='flex items-start gap-3'>
                  <Video className='w-5 h-5 text-purple-600 mt-0.5' />
                  <div>
                    <h4 className='font-semibold text-purple-900 mb-1'>Create a Short Video</h4>
                    <p className='text-sm text-purple-700'>
                      Share a quick moment, tip, or experience with the community. Max 60 seconds.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>Title</label>
                <Input
                  placeholder='Give your video a catchy title...'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className='text-lg'
                />
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder='Select category' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Damascus'>Damascus</SelectItem>
                    <SelectItem value='Amman'>Amman</SelectItem>
                    <SelectItem value='Istanbul'>Istanbul</SelectItem>
                    <SelectItem value='Cairo'>Cairo</SelectItem>
                    <SelectItem value='Travel Tips'>Travel Tips</SelectItem>
                    <SelectItem value='Food & Culture'>Food & Culture</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Caption (optional)
                </label>
                <Textarea
                  placeholder='Add a caption to your video...'
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                  className='resize-none'
                />
              </div>

              {/*  Link to Adventure for video posts too */}
              {hostAdventures.length > 0 && (
                <div>
                  <label className='block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                    <LinkIcon className='w-4 h-4 text-[#9933CC]' />
                    Link to Your Adventure (optional)
                  </label>
                  <Select value={linkedAdventureId} onValueChange={setLinkedAdventureId}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select an adventure to promote' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>None - Just a regular video</SelectItem>
                      {hostAdventures.map((adventure) => (
                        <SelectItem key={adventure.id} value={adventure.id}>
                          {adventure.title} - {adventure.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {linkedAdventureId && (
                    <p className='text-xs text-gray-500 mt-2'>
                      🎯 This video will include a "Book Now" button for your adventure
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Upload Video
                </label>
                <div className='space-y-3'>
                  <label className='flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors'>
                    {uploading ? (
                      <>
                        <Loader2 className='w-6 h-6 animate-spin text-purple-600' />
                        <span className='text-sm text-gray-600'>Uploading video...</span>
                      </>
                    ) : videoUrl ? (
                      <>
                        <Video className='w-6 h-6 text-green-600' />
                        <span className='text-sm text-green-600 font-semibold'>
                          Video uploaded! Click to change
                        </span>
                      </>
                    ) : (
                      <>
                        <Video className='w-6 h-6 text-purple-600' />
                        <span className='text-sm text-gray-700 font-medium'>
                          Click to upload video (max 60s)
                        </span>
                      </>
                    )}
                    <input
                      type='file'
                      accept='video/*'
                      onChange={handleFileUpload}
                      className='hidden'
                      disabled={uploading}
                    />
                  </label>

                  {videoUrl && (
                    <div className='relative'>
                      <video
                        src={videoUrl}
                        controls
                        className='w-full rounded-lg'
                        style={{ maxHeight: '300px' }}
                      />
                      <button
                        onClick={() => setVideoUrl('')}
                        className='absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors'
                      >
                        <X className='w-4 h-4' />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                  Tags (optional)
                </label>
                <Input
                  placeholder='e.g: damascus, foodie, localtips'
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Regular user - text only */}
        {!isHost && (
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>Title</label>
              <Input
                placeholder='Write an engaging title...'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className='text-lg'
              />
            </div>

            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder='Select category' />
                </SelectTrigger>
                <SelectContent>
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

            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>Content</label>
              <Textarea
                placeholder='Share your experience, tips, or story...'
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className='resize-none'
              />
            </div>

            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>
                Tags (optional)
              </label>
              <Input
                placeholder='Separate with commas'
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>
                Images (optional)
              </label>
              <div className='space-y-3'>
                <label className='flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors'>
                  {uploading ? (
                    <>
                      <Loader2 className='w-5 h-5 animate-spin text-purple-600' />
                      <span className='text-sm text-gray-600'>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className='w-5 h-5 text-gray-500' />
                      <span className='text-sm text-gray-600'>Click to upload images</span>
                    </>
                  )}
                  <input
                    type='file'
                    accept='image/*'
                    multiple
                    onChange={handleFileUpload}
                    className='hidden'
                    disabled={uploading}
                  />
                </label>

                {attachments.length > 0 && (
                  <div className='grid grid-cols-3 gap-2'>
                    {attachments.map((url, idx) => (
                      <div key={idx} className='relative group'>
                        <img
                          src={url}
                          alt={`Attachment ${idx + 1}`}
                          className='w-full h-24 object-cover rounded-lg'
                        />
                        <button
                          onClick={() => removeAttachment(idx)}
                          className='absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
                        >
                          <X className='w-3 h-3' />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notice */}
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <p className='text-sm text-blue-800'>
            📝 <strong>Note:</strong> Your post will be reviewed by our team before being published
            in the forum.
          </p>
        </div>

        <DialogFooter className='gap-2'>
          <Button variant='outline' onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createPostMutation.isPending}
            className='bg-gradient-to-r from-[#330066] to-[#9933CC] hover:from-[#47008F] hover:to-[#AD5CD6] text-white'
          >
            {createPostMutation.isPending ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                Publishing...
              </>
            ) : (
              'Publish Post'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
