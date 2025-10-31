export const validateBookingDates = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (start < today) {
    return { valid: false, error: 'Start date cannot be in the past' };
  }
  
  if (end <= start) {
    return { valid: false, error: 'End date must be after start date' };
  }
  
  const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
  if (daysDiff > 365) {
    return { valid: false, error: 'Booking cannot exceed 365 days' };
  }
  
  return { valid: true };
};

export const validateGuestCount = (adults, children = 0) => {
  if (adults < 1) {
    return { valid: false, error: 'At least one adult is required' };
  }
  
  if (adults > 20) {
    return { valid: false, error: 'Maximum 20 adults allowed' };
  }
  
  if (children < 0 || children > 10) {
    return { valid: false, error: 'Children count must be between 0 and 10' };
  }
  
  return { valid: true };
};

export const validatePrice = (price) => {
  if (typeof price !== 'number' || isNaN(price)) {
    return { valid: false, error: 'Price must be a valid number' };
  }
  
  if (price < 0) {
    return { valid: false, error: 'Price cannot be negative' };
  }
  
  if (price > 100000) {
    return { valid: false, error: 'Price cannot exceed $100,000' };
  }
  
  return { valid: true };
};

export const validateCity = (city, validCities = ['Damascus', 'Amman', 'Istanbul', 'Cairo']) => {
  if (!city || typeof city !== 'string') {
    return { valid: false, error: 'City is required' };
  }
  
  if (!validCities.includes(city)) {
    return { valid: false, error: 'Invalid city selected' };
  }
  
  return { valid: true };
};

export const validateServices = (services) => {
  if (!Array.isArray(services)) {
    return { valid: false, error: 'Services must be an array' };
  }
  
  if (services.length === 0) {
    return { valid: false, error: 'At least one service must be selected' };
  }
  
  if (services.length > 10) {
    return { valid: false, error: 'Maximum 10 services allowed' };
  }
  
  return { valid: true };
};

export const validateMessage = (message) => {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Message cannot be empty' };
  }
  
  if (message.trim().length < 1) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  
  if (message.length > 5000) {
    return { valid: false, error: 'Message cannot exceed 5000 characters' };
  }
  
  return { valid: true };
};

export const validateOfferPrice = (price, breakdown) => {
  if (!price || price <= 0) {
    return { valid: false, error: 'Price must be greater than zero' };
  }
  
  if (breakdown) {
    const { base_price, sawa_fee, office_fee, total } = breakdown;
    const calculatedTotal = (base_price || 0) + (sawa_fee || 0) + (office_fee || 0);
    
    if (Math.abs(calculatedTotal - total) > 0.01) {
      return { valid: false, error: 'Price breakdown mismatch' };
    }
  }
  
  return { valid: true };
};

export const validatePhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone number is required' };
  }
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length < 10 || cleaned.length > 15) {
    return { valid: false, error: 'Invalid phone number length' };
  }
  
  return { valid: true };
};

export const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'Image size cannot exceed 5MB' };
  }
  
  return { valid: true };
};

export const validateAdventureData = (adventure) => {
  const errors = [];
  
  if (!adventure.title || adventure.title.length < 3) {
    errors.push('Title must be at least 3 characters');
  }
  
  if (!adventure.city) {
    errors.push('City is required');
  }
  
  if (!adventure.date) {
    errors.push('Date is required');
  }
  
  if (!adventure.max_participants || adventure.max_participants < 1) {
    errors.push('Maximum participants must be at least 1');
  }
  
  if (!adventure.host_price || adventure.host_price < 0) {
    errors.push('Price must be a positive number');
  }
  
  if (errors.length > 0) {
    return { valid: false, error: errors.join(', ') };
  }
  
  return { valid: true };
};