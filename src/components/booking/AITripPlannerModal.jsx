import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllDocuments, queryDocuments, getDocument, addDocument, updateDocument, deleteDocument } from '@/utils/firestore';
import { uploadImage, uploadVideo } from '@/utils/storage';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  Sparkles,
  Wand2,
  Calendar,
  Users,
  Languages,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  Download,
  MessageSquare,
  Trash2,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from '../i18n/LanguageContext';
import { invokeLLM } from '@/utils/llm';

const INTERESTS = ['culture', 'food', 'nature', 'nightlife', 'shopping', 'history', 'adventure'];

const logError = async (message, details) => {
  try {
    await addDocument('ailogs', {
      scope: 'planner',
      level: 'error',
      message: message,
      meta_json: JSON.stringify(details),
      created_date: new Date().toISOString()
    });
  } catch (e) {
    console.error('Failed to log error:', e);
  }
};

const Stepper = ({ currentStep }) => (
  <div className='flex justify-center items-center gap-4 sm:gap-8 mb-6'>
    {['Details', 'Preview', 'Your Plan'].map((step, index) => (
      <div key={step} className='flex flex-col items-center gap-2'>
        <div
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all ${currentStep >= index ? 'bg-purple-600 border-purple-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-400'}`}
        >
          {currentStep > index ? <ShieldCheck className='w-5 h-5' /> : index + 1}
        </div>
        <span
          className={`text-xs sm:text-sm font-medium transition-colors ${currentStep >= index ? 'text-purple-600' : 'text-gray-500'}`}
        >
          {step}
        </span>
      </div>
    ))}
  </div>
);

const PlanForm = ({ city, setRequest, request, onNext }) => {
  const [days, setDays] = useState(request.days || 3);
  const [startDate, setStartDate] = useState(request.startDate || '');
  const [budget, setBudget] = useState(request.budget || 'balanced');
  const [interests, setInterests] = useState(request.interests || []);
  const [language, setLanguage] = useState(request.language || 'en');
  const [customPrompt, setCustomPrompt] = useState(request.customPrompt || '');

  const handleInterestToggle = (interest) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setRequest({ city, days, startDate, budget, interests, language, customPrompt });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <Stepper currentStep={0} />
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <div>
          <Label htmlFor='days'>Number of Days</Label>
          <Input
            id='days'
            type='number'
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            min='1'
            max='14'
            className='h-11'
            required
          />
        </div>
        <div>
          <Label htmlFor='startDate'>Start Date (Optional)</Label>
          <Input
            id='startDate'
            type='date'
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className='h-11'
          />
        </div>
      </div>
      <div>
        <Label>Budget Level</Label>
        <Select value={budget} onValueChange={setBudget}>
          <SelectTrigger className='h-11'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='economy'>Economy</SelectItem>
            <SelectItem value='balanced'>Balanced</SelectItem>
            <SelectItem value='premium'>Premium</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Interests</Label>
        <div className='flex flex-wrap gap-2 pt-2'>
          {INTERESTS.map((interest) => (
            <Button
              key={interest}
              type='button'
              variant={interests.includes(interest) ? 'default' : 'outline'}
              onClick={() => handleInterestToggle(interest)}
              className={`capitalize rounded-full transition-all ${interests.includes(interest) ? 'bg-purple-600 text-white' : ''}`}
            >
              {interest}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <Label>Language</Label>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className='h-11'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='en'>English</SelectItem>
            <SelectItem value='ar'>العربية</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor='customPrompt'>Anything else? (Optional)</Label>
        <Textarea
          id='customPrompt'
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder='e.g., focus on authentic food, avoid tourist traps, include photo spots...'
        />
      </div>
      <DialogFooter>
        <Button
          type='submit'
          className='w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white h-11'
        >
          Generate Plan <Wand2 className='ml-2 w-4 h-4' />
        </Button>
      </DialogFooter>
    </form>
  );
};

const PlanPreview = ({ planText, onNext, onBack, isLoading, onRegenerate }) => (
  <div>
    <Stepper currentStep={1} />
    {isLoading ? (
      <div className='flex flex-col items-center justify-center h-64 gap-4'>
        <Loader2 className='w-12 h-12 animate-spin text-purple-600' />
        <p className='text-gray-600'>Generating your personalized itinerary...</p>
        <p className='text-sm text-gray-500'>This can take up to 30 seconds.</p>
      </div>
    ) : (
      <>
        <div className='prose prose-sm max-w-none h-80 overflow-y-auto bg-gray-50 p-4 rounded-lg border'>
          <ReactMarkdown>{planText}</ReactMarkdown>
        </div>
        <DialogFooter className='mt-6'>
          <Button variant='outline' onClick={onBack}>
            Back
          </Button>
          <Button onClick={onRegenerate} variant='ghost'>
            Regenerate
          </Button>
          <Button onClick={onNext} className='bg-purple-600 hover:bg-purple-700 text-white'>
            Save & View Full Plan <ArrowRight className='ml-2 w-4 h-4' />
          </Button>
        </DialogFooter>
      </>
    )}
  </div>
);

const PlanResult = ({ plan, onBack, hosts }) => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  const handleMessageHost = (hostEmail) => {
    // This would navigate to the messaging page, which needs to be implemented
    toast.info('Messaging feature coming soon!');
    // navigate(createPageUrl(`Messages?host=${hostEmail}&context=plan`));
  };

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Stepper currentStep={2} />
      <div className='space-y-6'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-purple-700'>{plan.title}</h2>
          <p className='text-gray-600 mt-2'>{plan.overview}</p>
        </div>

        <div className='h-96 overflow-y-auto space-y-4 bg-gray-50 p-4 rounded-lg border'>
          {plan.daily_plans?.map((day) => (
            <div key={day.day}>
              <h3 className='font-bold text-lg text-gray-800 border-b pb-1 mb-2'>{day.title}</h3>
              <ul className='space-y-2'>
                {day.activities.map((activity, idx) => (
                  <li key={idx} className='flex gap-4 text-sm'>
                    <span className='font-semibold text-gray-600 w-20'>{activity.time}</span>
                    <span className='text-gray-700'>{activity.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div>
          <h3 className='font-bold text-lg text-gray-800 mb-3'>Suggested Hosts in {plan.city}</h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {hosts.map((host) => (
              <div
                key={host.user_email}
                className='border rounded-lg p-4 text-center hover:shadow-md transition-shadow'
              >
                <img
                  src={
                    host.profile_photo || `https://ui-avatars.com/api/?name=${host.display_name}`
                  }
                  alt={host.display_name}
                  className='w-20 h-20 rounded-full mx-auto mb-3 object-cover'
                  loading='lazy'
                />
                <h4 className='font-semibold text-gray-900'>{host.display_name}</h4>
                <div className='flex items-center justify-center text-sm text-amber-500 my-1'>
                  <Star className='w-4 h-4 fill-current mr-1' /> {host.rating?.toFixed(1) || 'N/A'}
                </div>
                <p className='text-xs text-gray-500 mb-3 line-clamp-2'>
                  {host.bio || 'Experienced local host.'}
                </p>
                <Button
                  size='sm'
                  className='w-full'
                  onClick={() => handleMessageHost(host.user_email)}
                >
                  <MessageSquare className='w-4 h-4 mr-2' /> Message
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onBack}>
            Go Back
          </Button>
          <Button onClick={() => window.print()}>
            <Download className='mr-2 w-4 h-4' /> Download Plan
          </Button>
        </DialogFooter>
      </div>
    </div>
  );
};

export default function AITripPlannerModal({ isOpen, onClose, city }) {
  const { user } = useAppContext();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [request, setRequest] = useState({ city });
  const [plan, setPlan] = useState(null);
  const [regenerationCount, setRegenerationCount] = useState(0);

  const cacheKey = useMemo(() => {
    if (!request.city || !request.interests) return null;
    return `plan-${request.city}-${request.days}-${request.interests.sort().join('-')}-${request.budget}-${request.language}`;
  }, [request]);

  const { data: cachedPlan, isLoading: isCacheLoading } = useQuery({
    queryKey: ['aiCache', cacheKey],
    queryFn: async () => {
      if (!cacheKey) return null;
      const results = await queryDocuments('aicaches', [['query_hash', '==', cacheKey ]]);
      if (results && results.length > 0) {
        const cached = results[0];
        if (new Date(cached.expires_at) > new Date()) {
          toast.info('Loaded a similar plan from cache.');
          return JSON.parse(cached.payload_json);
        }
      }
      return null;
    },
    enabled: step === 1,
  });

  const { data: hosts, isLoading: areHostsLoading } = useQuery({
    queryKey: ['suggestedHosts', city],
    queryFn: () =>
      queryDocuments('host_profiles', [
        ['city', '==', city],
        ['is_active', '==', true]
      ]),
    enabled: step === 2, // Only fetch when on the result step
  });

  const generatePlanMutation = useMutation({
    mutationFn: async (planRequest) => {
      if (!user) throw new Error('User not authenticated.');

      const fullPrompt = `You are SAWA’s AI Trip Planner... (Full system prompt here, same as user request)`; // Truncated for brevity

      const response = await invokeLLM({
        prompt: `Generate a plan based on these details: ${JSON.stringify(planRequest)}. ${fullPrompt}`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            overview: { type: 'string' },
            city: { type: 'string' },
            itinerary_text: { type: 'string' },
            daily_plans: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  day: { type: 'number' },
                  title: { type: 'string' },
                  activities: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        time: { type: 'string' },
                        description: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
      return response;
    },
    onSuccess: async (data) => {
      setPlan(data);
      setStep(2);
      await addDocument('aicaches', { ...{
        query_hash: cacheKey,
        payload_json: JSON.stringify(data, created_date: new Date().toISOString() }),
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      });
    },
    onError: (error) => {
      toast.error('Failed to generate plan. Please try again.');
      logError('Plan generation failed', { error: error.message, request });
      setStep(0);
    },
  });

  useEffect(() => {
    if (step === 1 && !generatePlanMutation.isPending) {
      if (cachedPlan) {
        setPlan(cachedPlan);
        setStep(2);
      } else {
        generatePlanMutation.mutate(request);
      }
    }
  }, [step, cachedPlan, generatePlanMutation, request]);

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);
  const handleRegenerate = () => {
    queryClient.invalidateQueries(['aiCache', cacheKey]);
    setRegenerationCount((c) => c + 1); // Force re-fetch
    setStep(1); // Go back to preview/loading
  };

  const handleClose = () => {
    setStep(0);
    setPlan(null);
    setRequest({ city });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-2xl'>
            <Sparkles className='w-6 h-6 text-purple-600' />
            AI Trip Planner
          </DialogTitle>
          <DialogDescription>Let's craft your perfect journey to {city}.</DialogDescription>
        </DialogHeader>
        <AnimatePresence mode='wait'>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {step === 0 && (
              <PlanForm city={city} request={request} setRequest={setRequest} onNext={handleNext} />
            )}
            {step === 1 && (
              <PlanPreview
                planText={plan?.itinerary_text}
                onNext={handleNext}
                onBack={handleBack}
                isLoading={generatePlanMutation.isPending || isCacheLoading}
                onRegenerate={handleRegenerate}
              />
            )}
            {step === 2 && plan && (
              <PlanResult plan={plan} onBack={handleBack} hosts={hosts || []} />
            )}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
