import { Shield, Clock, DollarSign, AlertCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const policyDetails = {
  flexible: {
    name: 'Flexible',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: Shield,
    rules: [
      { period: 'More than 24 hours before check-in', refund: '100%' },
      { period: 'Less than 24 hours before check-in', refund: '50%' },
      { period: 'After check-in', refund: 'No refund' },
    ],
    description: 'Full refund if cancelled more than 24 hours before check-in',
  },
  moderate: {
    name: 'Moderate',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: Clock,
    rules: [
      { period: 'More than 7 days before check-in', refund: '100%' },
      { period: '3-7 days before check-in', refund: '50%' },
      { period: 'Less than 3 days before check-in', refund: '25%' },
      { period: 'After check-in', refund: 'No refund' },
    ],
    description: 'Full refund if cancelled more than 7 days before check-in',
  },
  strict: {
    name: 'Strict',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: DollarSign,
    rules: [
      { period: 'More than 14 days before check-in', refund: '100%' },
      { period: '7-14 days before check-in', refund: '50%' },
      { period: 'Less than 7 days before check-in', refund: 'No refund' },
      { period: 'After check-in', refund: 'No refund' },
    ],
    description: 'Full refund only if cancelled more than 14 days before check-in',
  },
};

export default function CancellationPolicyCard({ policy = 'moderate', showDetails = true }) {
  const policyInfo = policyDetails[policy];
  const Icon = policyInfo.icon;

  return (
    <Card
      className={cn('border-2', policyInfo.color.replace('text-', 'border-').replace('100', '200'))}
    >
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg flex items-center gap-2'>
            <Icon className='w-5 h-5' />
            Cancellation Policy
          </CardTitle>
          <Badge className={cn('border', policyInfo.color)}>{policyInfo.name}</Badge>
        </div>
      </CardHeader>

      {showDetails && (
        <CardContent className='space-y-4'>
          <p className='text-sm text-gray-600'>{policyInfo.description}</p>

          <div className='space-y-3'>
            {policyInfo.rules.map((rule, idx) => (
              <div key={idx} className='flex items-start gap-3 p-3 bg-gray-50 rounded-lg'>
                <div className='w-2 h-2 rounded-full bg-gray-400 mt-2 flex-shrink-0' />
                <div className='flex-1'>
                  <p className='text-sm font-medium text-gray-900'>{rule.period}</p>
                  <p className='text-sm text-gray-600 mt-1'>
                    Refund: <span className='font-semibold'>{rule.refund}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className='flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200'>
            <AlertCircle className='w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0' />
            <p className='text-xs text-blue-900'>
              Service fees are non-refundable. Refunds are processed within 5-10 business days.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
