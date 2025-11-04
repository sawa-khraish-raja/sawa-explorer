import { motion } from 'framer-motion';
import { MessageSquare, Compass, Plus, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import PageHeroVideo from '../components/common/PageHeroVideo';
import { useAppContext } from '../components/context/AppContext';
import AdventuresList from '../components/forum/AdventuresList';
import CreatePostModal from '../components/forum/CreatePostModal';
import ForumPostsList from '../components/forum/ForumPostsList';

export default function ForumHome() {
  const { user } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('discussions');
  const [showCreatePost, setShowCreatePost] = useState(false);

  // Read tab from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'adventures') {
      setActiveTab('adventures');
    }
  }, [location.search]);

  // Update URL when tab changes
  const handleTabChange = (value) => {
    setActiveTab(value);
    const params = new URLSearchParams(location.search);
    if (value === 'adventures') {
      params.set('tab', 'adventures');
    } else {
      params.delete('tab');
    }
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  return (
    <div className='min-h-screen bg-white'>
      {/*  Hero Section - Video Only */}
      <section className='relative h-[60vh] sm:h-[70vh] overflow-hidden bg-black'>
        <PageHeroVideo pageType='forum' />

        <div className='relative z-10 flex flex-col items-center justify-center h-full w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <div className='inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/30'>
              <Sparkles className='w-4 h-4 text-white' />
              <span className='text-sm font-semibold text-white'>Community Hub</span>
            </div>
            <h1 className='text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-2xl'>
              SAWA Community
            </h1>
            <p className='text-lg sm:text-xl text-white/95 font-medium drop-shadow-lg max-w-2xl mx-auto'>
              Share experiences, discover adventures, connect with local hosts
            </p>
          </div>
        </div>
      </section>

      <section className='py-12'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Action Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='flex justify-between items-center mb-8'
          >
            <div>
              <h2 className='text-2xl font-bold text-gray-900'>
                {activeTab === 'discussions' ? 'Community Discussions' : 'Local Adventures'}
              </h2>
              <p className='text-gray-600 mt-1'>
                {activeTab === 'discussions'
                  ? 'Share tips, ask questions, connect with travelers'
                  : 'Book authentic experiences with local hosts'}
              </p>
            </div>

            {user && activeTab === 'discussions' && (
              <Button
                onClick={() => setShowCreatePost(true)}
                className='bg-gradient-to-r from-[#330066] to-[#9933CC] hover:from-[#47008F] hover:to-[#AD5CD6] text-white'
              >
                <Plus className='w-4 h-4 mr-2' />
                New Post
              </Button>
            )}
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className='w-full'>
            <TabsList className='grid w-full max-w-md mx-auto grid-cols-2 mb-8 bg-white border-2 border-[#E6E6FF]'>
              <TabsTrigger
                value='discussions'
                className='flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#330066] data-[state=active]:to-[#9933CC] data-[state=active]:text-white'
              >
                <MessageSquare className='w-4 h-4' />
                Discussions
              </TabsTrigger>
              <TabsTrigger
                value='adventures'
                className='flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#330066] data-[state=active]:to-[#9933CC] data-[state=active]:text-white'
              >
                <Compass className='w-4 h-4' />
                Adventures
              </TabsTrigger>
            </TabsList>

            <TabsContent value='discussions'>
              <ForumPostsList />
            </TabsContent>

            <TabsContent value='adventures'>
              <AdventuresList />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePostModal
          open={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          user={user}
        />
      )}
    </div>
  );
}
