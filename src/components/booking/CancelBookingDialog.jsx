import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, DollarSign, Calendar, TrendingDown, Loader2, XCircle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { calculateRefund, CANCELLATION_REASONS } from './cancellationEngine';

export default function CancelBookingDialog({ 
  open, 
  onOpenChange, 
  booking, 
  onConfirm, 
  isLoading,
  userType = 'traveler' // 'traveler' or 'host'
}) {
  const [reason, setReason] = useState('');
  const [reasonCategory, setReasonCategory] = useState('');

  const refundCalculation = useMemo(() => {
    if (!booking) return null;
    return calculateRefund(booking, booking.cancellation_policy || 'moderate');
  }, [booking]);

  const handleConfirm = () => {
    if (!reasonCategory) {
      alert('Please select a cancellation reason');
      return;
    }
    onConfirm({ reason, reasonCategory });
  };

  if (!booking) return null;

  const reasons = CANCELLATION_REASONS[userType] || CANCELLATION_REASONS.traveler;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Cancel Booking
          </DialogTitle>
          <DialogDescription>
            Review the cancellation details and refund policy before proceeding
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Booking Info */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600 text-xs mb-1">Destination</p>
                <p className="font-semibold text-gray-900">📍 {booking.city}</p>
              </div>
              <div>
                <p className="text-gray-600 text-xs mb-1">Check-in</p>
                <p className="font-semibold text-gray-900">
                  📅 {format(new Date(booking.start_date), 'MMM d, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-xs mb-1">Booking Total</p>
                <p className="font-bold text-green-600">💰 ${booking.total_price?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-xs mb-1">Days Until Check-in</p>
                <p className="font-semibold text-gray-900">
                  🕒 {refundCalculation?.daysUntilCheckin} days
                </p>
              </div>
            </div>
          </div>

          {/* Refund Calculation */}
          {refundCalculation && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-blue-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Refund Breakdown
                </h4>
                <Badge className="bg-blue-600 text-white">
                  {refundCalculation.policyName} Policy
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Original Amount:</span>
                  <span className="font-semibold">${refundCalculation.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Cancellation Fee ({refundCalculation.feePercent}%):</span>
                  <span className="font-semibold text-red-600">-${refundCalculation.cancellationFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-blue-300 pt-2 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Your Refund ({refundCalculation.refundPercent}%):</span>
                  <span className="text-xl font-bold text-green-600">
                    ${refundCalculation.refundAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <Alert className="bg-blue-100 border-blue-300">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-xs text-blue-900">
                  Refunds are typically processed within 5-7 business days
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Cancellation Reason */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Reason for Cancellation *
              </label>
              <Select value={reasonCategory} onValueChange={setReasonCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  {reasons.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Additional Details (Optional)
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide any additional details..."
                className="h-24"
              />
            </div>
          </div>

          {/* Warning */}
          <Alert className="bg-amber-50 border-amber-300">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-900">
              <strong>Important:</strong> Once cancelled, this booking cannot be restored. 
              {refundCalculation?.feePercent > 0 && (
                <> A cancellation fee of {refundCalculation.feePercent}% will be charged.</>
              )}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Keep Booking
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading || !reasonCategory}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Confirm Cancellation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}