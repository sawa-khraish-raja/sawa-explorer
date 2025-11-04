import { Trash2, Loader2, AlertTriangle, Info } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from '@/components/ui/textarea';
import { createPageUrl } from '@/utils';

export default function DeleteAccountDialog({ open, onClose, user }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [deletionType, setDeletionType] = useState('permanent');
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleClose = () => {
    if (!isDeleting) {
      setStep(1);
      setDeletionType('permanent');
      setReason('');
      setFeedback('');
      setConfirmText('');
      setAgreedToTerms(false);
      onClose();
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    if (!agreedToTerms) {
      toast.error('Please agree to the terms');
      return;
    }

    setIsDeleting(true);

    try {
      const response = await deleteAccount( {
        deletion_type: deletionType,
        reason: reason,
        feedback: feedback,
        user_email: user.email,
      });

      if (response.data?.ok) {
        toast.success('Account Deletion Initiated', {
          description: 'You will receive a confirmation email shortly.',
          duration: 5000,
        });

        setTimeout(() => {
          logout();
          navigate(createPageUrl('Home'));
        }, 2000);
      } else {
        throw new Error(response.data?.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error('Failed to Delete Account', {
        description: error.message || 'Something went wrong. Please try again.',
      });
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-2xl text-red-900'>
            <Trash2 className='w-6 h-6' />
            Delete Account
          </DialogTitle>
          <DialogDescription>
            We're sorry to see you go. Please help us understand why.
          </DialogDescription>
        </DialogHeader>

        <div className='py-6 space-y-6'>
          {step === 1 && (
            <>
              <Alert className='bg-red-50 border-red-200'>
                <AlertTriangle className='h-5 w-5 text-red-600' />
                <AlertDescription className='text-red-900'>
                  <strong>Important:</strong> Deleting your account is permanent and cannot be
                  undone.
                </AlertDescription>
              </Alert>

              <div className='space-y-4'>
                <div>
                  <Label className='text-base font-semibold text-gray-900 mb-3 block'>
                    What would you like to do?
                  </Label>
                  <div className='space-y-3'>
                    <div
                      onClick={() => setDeletionType('permanent')}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        deletionType === 'permanent'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className='flex items-start gap-3'>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                            deletionType === 'permanent'
                              ? 'border-red-500 bg-red-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {deletionType === 'permanent' && (
                            <div className='w-2 h-2 bg-white rounded-full' />
                          )}
                        </div>
                        <div>
                          <p className='font-semibold text-gray-900'>Delete Account Permanently</p>
                          <p className='text-sm text-gray-600 mt-1'>
                            Your account and all associated data will be permanently deleted within
                            30 days.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      onClick={() => setDeletionType('deactivate')}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        deletionType === 'deactivate'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className='flex items-start gap-3'>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                            deletionType === 'deactivate'
                              ? 'border-orange-500 bg-orange-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {deletionType === 'deactivate' && (
                            <div className='w-2 h-2 bg-white rounded-full' />
                          )}
                        </div>
                        <div>
                          <p className='font-semibold text-gray-900'>
                            Deactivate Account Temporarily
                          </p>
                          <p className='text-sm text-gray-600 mt-1'>
                            Hide your profile and data. You can reactivate your account anytime by
                            logging in.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor='reason' className='text-base font-semibold text-gray-900'>
                    Why are you leaving? *
                  </Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger className='mt-2'>
                      <SelectValue placeholder='Select a reason...' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='not_using'>I'm not using the service anymore</SelectItem>
                      <SelectItem value='privacy_concerns'>Privacy concerns</SelectItem>
                      <SelectItem value='found_alternative'>Found a better alternative</SelectItem>
                      <SelectItem value='too_expensive'>Too expensive</SelectItem>
                      <SelectItem value='poor_experience'>Poor user experience</SelectItem>
                      <SelectItem value='technical_issues'>Technical issues</SelectItem>
                      <SelectItem value='temporary_break'>Taking a temporary break</SelectItem>
                      <SelectItem value='other'>Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor='feedback' className='text-base font-semibold text-gray-900'>
                    Additional Feedback (Optional)
                  </Label>
                  <Textarea
                    id='feedback'
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder='Help us improve by sharing your experience...'
                    className='mt-2 h-24'
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Your feedback helps us improve SAWA for everyone
                  </p>
                </div>
              </div>

              <div className='bg-blue-50 border-2 border-blue-200 rounded-lg p-4'>
                <div className='flex gap-3'>
                  <Info className='w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5' />
                  <div className='text-sm text-blue-900'>
                    <p className='font-semibold mb-1'>What happens next?</p>
                    <ul className='space-y-1 list-disc list-inside'>
                      {deletionType === 'permanent' ? (
                        <>
                          <li>Your account will be scheduled for deletion</li>
                          <li>You'll receive a confirmation email</li>
                          <li>You have 30 days to cancel the deletion</li>
                          <li>After 30 days, your data will be permanently deleted</li>
                        </>
                      ) : (
                        <>
                          <li>Your account will be deactivated immediately</li>
                          <li>Your profile will be hidden from others</li>
                          <li>You can reactivate anytime by logging in</li>
                          <li>Your data will be preserved</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <Alert className='bg-red-50 border-red-200'>
                <AlertTriangle className='h-5 w-5 text-red-600' />
                <AlertDescription className='text-red-900'>
                  <strong>Final Confirmation Required</strong>
                </AlertDescription>
              </Alert>

              <div className='space-y-4'>
                <div className='bg-gray-50 p-4 rounded-lg space-y-3'>
                  <h4 className='font-semibold text-gray-900'>You're about to lose:</h4>
                  <ul className='space-y-2 text-sm text-gray-700'>
                    <li className='flex items-center gap-2'>
                      <div className='w-1.5 h-1.5 bg-red-500 rounded-full' />
                      Your profile and personal information
                    </li>
                    <li className='flex items-center gap-2'>
                      <div className='w-1.5 h-1.5 bg-red-500 rounded-full' />
                      All booking history and records
                    </li>
                    <li className='flex items-center gap-2'>
                      <div className='w-1.5 h-1.5 bg-red-500 rounded-full' />
                      Messages and conversations
                    </li>
                    <li className='flex items-center gap-2'>
                      <div className='w-1.5 h-1.5 bg-red-500 rounded-full' />
                      Reviews and ratings given/received
                    </li>
                    {user?.host_approved && (
                      <li className='flex items-center gap-2'>
                        <div className='w-1.5 h-1.5 bg-red-500 rounded-full' />
                        Your host profile and statistics
                      </li>
                    )}
                  </ul>
                </div>

                <div>
                  <Label htmlFor='confirm' className='text-base font-semibold text-gray-900'>
                    Type <span className='text-red-600 font-mono'>DELETE</span> to confirm
                  </Label>
                  <Input
                    id='confirm'
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder='DELETE'
                    className='mt-2 font-mono text-center text-lg'
                  />
                </div>

                <div className='flex items-start gap-3 p-4 bg-gray-50 rounded-lg'>
                  <Checkbox
                    id='terms'
                    checked={agreedToTerms}
                    onCheckedChange={setAgreedToTerms}
                    className='mt-1'
                  />
                  <Label htmlFor='terms' className='text-sm text-gray-700 cursor-pointer'>
                    I understand that this action is{' '}
                    {deletionType === 'permanent' ? 'permanent and' : ''} cannot be easily undone. I
                    have read and agree to the{' '}
                    <a
                      href={createPageUrl('PrivacyPolicy')}
                      target='_blank'
                      className='text-purple-600 hover:underline' rel="noreferrer"
                    >
                      data deletion policy
                    </a>
                    .
                  </Label>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={handleClose} disabled={isDeleting}>
            Cancel
          </Button>

          {step === 1 ? (
            <Button
              onClick={() => setStep(2)}
              disabled={!reason}
              className='bg-red-600 hover:bg-red-700'
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={handleDeleteAccount}
              disabled={!agreedToTerms || confirmText !== 'DELETE' || isDeleting}
              className='bg-red-600 hover:bg-red-700'
            >
              {isDeleting ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Processing...
                </>
              ) : (
                <>
                  <Trash2 className='w-4 h-4 mr-2' />
                  {deletionType === 'permanent' ? 'Delete Account' : 'Deactivate Account'}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
