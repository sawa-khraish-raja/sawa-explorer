export const SAWA_SERVICES = [
  {
    id: 'airport_transportation',
    label: 'Airport Transportation',
    label_ar: 'نقل من وإلى المطار',
    description: 'Pick-up and drop-off service',
    description_ar: 'خدمة النقل من وإلى المطار',
    icon: 'Plane'
  },
  {
    id: 'mobility_companionship',
    label: 'Mobility & Companionship',
    label_ar: 'التنقل والمرافقة',
    description: 'Local guide and transportation',
    description_ar: 'مرشد محلي ووسائل نقل',
    icon: 'Users'
  },
  {
    id: 'travel_planning',
    label: 'Travel Planning',
    label_ar: 'تخطيط الرحلة',
    description: 'Personalized itinerary planning',
    description_ar: 'تخطيط برنامج مخصص',
    icon: 'Calendar'
  },
  {
    id: 'guided_tour',
    label: 'Guided Tour',
    label_ar: 'جولة إرشادية',
    description: 'Full-day city tour with guide',
    description_ar: 'جولة يوم كامل مع مرشد',
    icon: 'Map'
  },
  {
    id: 'essentials_package',
    label: 'Essentials Package',
    label_ar: 'حزمة الأساسيات',
    description: 'SIM card, currency exchange, tips',
    description_ar: 'شريحة، صرافة، نصائح',
    icon: 'Package'
  },
  {
    id: 'accommodation',
    label: 'Accommodation',
    label_ar: 'الإقامة',
    description: 'Hotel or house booking assistance',
    description_ar: 'المساعدة في حجز فندق أو منزل',
    icon: 'Home'
  },
  {
    id: 'emergency_support',
    label: 'Emergency Support',
    label_ar: 'دعم الطوارئ',
    description: '24/7 emergency assistance',
    description_ar: 'مساعدة الطوارئ على مدار الساعة',
    icon: 'ShieldAlert'
  }
];

export const getServiceById = (serviceId) => {
  return SAWA_SERVICES.find(s => s.id === serviceId);
};