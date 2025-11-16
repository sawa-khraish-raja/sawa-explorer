import { cn } from '@/shared/utils';

export default function ProgressBar({ currentStep, totalSteps }) {
  return (
    <div className='flex w-full h-1.5 rounded-full bg-gray-200'>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'h-full rounded-full transition-all duration-300',
            {
              'bg-[var(--brand-primary)]': index < currentStep,
              'bg-gray-200': index >= currentStep,
            },
            'flex-1 mx-0.5'
          )}
        />
      ))}
    </div>
  );
}
