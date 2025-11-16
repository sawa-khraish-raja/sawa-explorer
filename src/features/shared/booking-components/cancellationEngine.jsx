import { differenceInDays, parseISO } from 'date-fns';

export const CANCELLATION_POLICIES = {
  flexible: {
    name: 'Flexible',
    rules: [
      { daysBeforeCheckin: 1, refundPercent: 100 },
      { daysBeforeCheckin: 0, refundPercent: 50 },
    ],
  },
  moderate: {
    name: 'Moderate',
    rules: [
      { daysBeforeCheckin: 5, refundPercent: 100 },
      { daysBeforeCheckin: 2, refundPercent: 50 },
      { daysBeforeCheckin: 0, refundPercent: 0 },
    ],
  },
  strict: {
    name: 'Strict',
    rules: [
      { daysBeforeCheckin: 14, refundPercent: 100 },
      { daysBeforeCheckin: 7, refundPercent: 50 },
      { daysBeforeCheckin: 0, refundPercent: 0 },
    ],
  },
};

export function calculateRefund(booking, policyName = 'moderate') {
  const policy = CANCELLATION_POLICIES[policyName] || CANCELLATION_POLICIES.moderate;

  const now = new Date();
  const checkinDate = parseISO(booking.start_date);
  const daysUntilCheckin = differenceInDays(checkinDate, now);

  let refundPercent = 0;
  for (const rule of policy.rules) {
    if (daysUntilCheckin >= rule.daysBeforeCheckin) {
      refundPercent = rule.refundPercent;
      break;
    }
  }

  const totalAmount = booking.total_price || 0;
  const refundAmount = totalAmount * (refundPercent / 100);
  const cancellationFee = totalAmount - refundAmount;

  return {
    policyName: policy.name,
    daysUntilCheckin,
    totalAmount,
    refundPercent,
    feePercent: 100 - refundPercent,
    refundAmount,
    cancellationFee,
  };
}

export const CANCELLATION_REASONS = {
  traveler: [
    { value: 'change_of_plans', label: 'Change of Plans' },
    { value: 'emergency', label: 'Personal Emergency' },
    { value: 'found_better_option', label: 'Found Better Option' },
    { value: 'weather', label: 'Weather Concerns' },
    { value: 'safety_concerns', label: 'Safety Concerns' },
    { value: 'travel_restrictions', label: 'Travel Restrictions' },
    { value: 'health_issues', label: 'Health Issues' },
    { value: 'other', label: 'Other' },
  ],
  host: [
    { value: 'property_issue', label: 'Property Issue' },
    { value: 'emergency', label: 'Personal Emergency' },
    { value: 'double_booking', label: 'Double Booking' },
    { value: 'maintenance', label: 'Maintenance Required' },
    { value: 'unavailable', label: 'No Longer Available' },
    { value: 'other', label: 'Other' },
  ],
};
