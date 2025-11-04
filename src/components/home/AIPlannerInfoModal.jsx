import { Wand2, CircleUser, Bot, FileText, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';


const steps = [
  {
    icon: <CircleUser className='w-6 h-6 text-[var(--brand-primary)]' />,
    title: '1. You Provide the Details',
    description:
      "Select your destination, travel dates, and pick any interests like 'Food', 'History', or 'Nature' to tell our AI what you love.",
  },
  {
    icon: <Bot className='w-6 h-6 text-[var(--brand-primary)]' />,
    title: '2. The AI Gets to Work',
    description:
      'Our AI assistant acts like an expert travel agent. It analyzes your request and searches the internet for the best sights, activities, and local tips for your destination.',
  },
  {
    icon: <FileText className='w-6 h-6 text-[var(--brand-primary)]' />,
    title: '3. A Custom Plan is Built',
    description:
      'The AI structures all the information into a beautiful, day-by-day itinerary in Markdown format, complete with an overview and local tips.',
  },
  {
    icon: <CheckCircle className='w-6 h-6 text-green-600' />,
    title: '4. Your Trip is Ready!',
    description:
      'You receive a complete, personalized travel plan that you can download as a PDF and take with you on your journey.',
  },
];

export default function AIPlannerInfoModal({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg bg-white'>
        <DialogHeader>
          <div className='flex items-center gap-3 mb-2'>
            <div className='w-10 h-10 bg-[var(--brand-bg-accent-light)] rounded-lg flex items-center justify-center'>
              <Wand2 className='w-6 h-6 text-[var(--brand-primary)]' />
            </div>
            <DialogTitle className='text-2xl font-bold text-[var(--brand-text-primary)]'>
              How the AI Planner Works
            </DialogTitle>
          </div>
          <DialogDescription className='text-md text-[var(--brand-text-secondary)]'>
            Your personalized travel itinerary is just a few clicks away. Here’s how our AI brings
            your perfect trip to life.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          {steps.map((step, index) => (
            <div key={index} className='flex items-start gap-4'>
              <div className='flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center'>
                {step.icon}
              </div>
              <div>
                <h4 className='font-semibold text-[var(--brand-text-primary)]'>{step.title}</h4>
                <p className='text-sm text-[var(--brand-text-secondary)]'>{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            className='bg-[var(--brand-primary)] text-slate-50 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 w-full hover:bg-[var(--brand-primary-hover)]'
          >
            Got it!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
