import { addDocument, setDocument } from './firestore';

/**
 * Seed Database with Sample Data
 * Run this to populate your database with example data
 */

// Sample Cities Data
const cities = [
  {
    name: 'Damascus',
    country: 'Syria',
    description: 'The ancient capital of Syria, one of the oldest continuously inhabited cities in the world.',
    image_url: 'https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=800',
    cover_images: [
      'https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=800',
      'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800'
    ],
    highlights: ['Old City', 'Umayyad Mosque', 'Souk al-Hamidiyya'],
    latitude: 33.5138,
    longitude: 36.2765,
    popular: true,
    is_active: true
  },
  {
    name: 'Istanbul',
    country: 'Turkey',
    description: 'A city straddling two continents, rich in history and culture.',
    image_url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800',
    cover_images: [
      'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800',
      'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800'
    ],
    highlights: ['Hagia Sophia', 'Blue Mosque', 'Grand Bazaar'],
    latitude: 41.0082,
    longitude: 28.9784,
    popular: true,
    is_active: true
  },
  {
    name: 'Cairo',
    country: 'Egypt',
    description: 'Home to the ancient pyramids and vibrant Egyptian culture.',
    image_url: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800',
    cover_images: [
      'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800',
      'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800'
    ],
    highlights: ['Pyramids of Giza', 'Egyptian Museum', 'Khan el-Khalili'],
    latitude: 30.0444,
    longitude: 31.2357,
    popular: true,
    is_active: true
  },
  {
    name: 'Amman',
    country: 'Jordan',
    description: 'Modern capital with ancient Roman ruins and Middle Eastern charm.',
    image_url: 'https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=800',
    cover_images: [
      'https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=800',
      'https://images.unsplash.com/photo-1577717903315-1691ae25f87e?w=800'
    ],
    highlights: ['Citadel', 'Roman Theatre', 'Rainbow Street'],
    latitude: 31.9454,
    longitude: 35.9284,
    popular: false,
    is_active: true
  },
  {
    name: 'Tunis',
    country: 'Tunisia',
    description: 'Mediterranean gateway with ancient Carthage nearby.',
    image_url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
    cover_images: [
      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800'
    ],
    highlights: ['Medina', 'Bardo Museum', 'Carthage Ruins'],
    latitude: 36.8065,
    longitude: 10.1815,
    popular: false,
    is_active: true
  }
];

// Sample Adventures/Experiences Data (will be enriched with city_id after cities are created)
const getAdventures = (cityIds, cityMap) => [
  {
    title: 'Old Damascus Walking Tour',
    city_id: cityIds[0],
    city_name: 'Damascus',
    host_id: 'demo-host-1',
    host_name: 'Ahmad Al-Hassan',
    description: 'Explore the historic streets of Old Damascus with a local guide. Walk through ancient souks, visit the Umayyad Mosque, and discover hidden gems of this ancient city.',
    short_description: 'Explore the historic streets of Old Damascus with a local guide.',
    duration: '3 hours',
    price: 45,
    currency: 'USD',
    max_guests: 8,
    min_guests: 1,
    category: 'Walking Tour',
    tags: ['cultural', 'historical', 'architecture'],
    images: [
      'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800',
      'https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=800'
    ],
    meeting_point: 'Umayyad Mosque Main Entrance',
    what_included: ['Professional guide', 'Traditional tea', 'Entrance fees'],
    what_to_bring: ['Comfortable walking shoes', 'Water bottle', 'Camera'],
    languages: ['English', 'Arabic'],
    cancellation_policy: 'Free cancellation up to 24 hours before',
    is_active: true,
    rating: 4.8,
    total_reviews: 24,
    total_bookings: 156
  },
  {
    title: 'Bosphorus Sunset Cruise',
    city_id: cityIds[1],
    city_name: 'Istanbul',
    host_id: 'demo-host-2',
    host_name: 'Ayşe Yılmaz',
    description: 'Sail along the Bosphorus and watch the sunset between two continents. Experience Istanbul from the water with stunning views of palaces, mosques, and the city skyline.',
    short_description: 'Sunset cruise between Europe and Asia.',
    duration: '2 hours',
    price: 60,
    currency: 'USD',
    max_guests: 20,
    min_guests: 2,
    category: 'Boat Tour',
    tags: ['romantic', 'scenic', 'photography'],
    images: [
      'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800',
      'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800'
    ],
    meeting_point: 'Eminönü Pier, Gate 3',
    what_included: ['Boat cruise', 'Welcome drink', 'Snacks', 'Guide'],
    what_to_bring: ['Light jacket', 'Camera', 'Sunglasses'],
    languages: ['English', 'Turkish'],
    cancellation_policy: 'Free cancellation up to 48 hours before',
    is_active: true,
    rating: 4.9,
    total_reviews: 87,
    total_bookings: 342
  },
  {
    title: 'Pyramid & Sphinx Tour',
    city_id: cityIds[2],
    city_name: 'Cairo',
    host_id: 'demo-host-3',
    host_name: 'Mohammed Ibrahim',
    description: 'Visit the iconic Pyramids of Giza and the Great Sphinx. Learn about ancient Egyptian civilization from an expert Egyptologist guide.',
    short_description: 'Discover the wonders of ancient Egypt.',
    duration: '4 hours',
    price: 80,
    currency: 'USD',
    max_guests: 15,
    min_guests: 1,
    category: 'Historical Tour',
    tags: ['historical', 'archaeology', 'iconic'],
    images: [
      'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800',
      'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800'
    ],
    meeting_point: 'Giza Plateau Visitor Center',
    what_included: ['Expert guide', 'Transportation', 'Entrance tickets', 'Lunch'],
    what_to_bring: ['Hat', 'Sunscreen', 'Comfortable shoes', 'Water'],
    languages: ['English', 'Arabic', 'French'],
    cancellation_policy: 'Free cancellation up to 24 hours before',
    is_active: true,
    rating: 4.7,
    total_reviews: 134,
    total_bookings: 523
  },
  {
    title: 'Petra Day Trip',
    city_id: cityIds[3],
    city_name: 'Amman',
    host_id: 'demo-host-4',
    host_name: 'Omar Al-Rashid',
    description: 'Full day excursion to the ancient city of Petra. Walk through the Siq, marvel at the Treasury, and explore this UNESCO World Heritage site.',
    short_description: 'Journey to the ancient Rose City of Petra.',
    duration: 'Full day',
    price: 120,
    currency: 'USD',
    max_guests: 12,
    min_guests: 2,
    category: 'Day Trip',
    tags: ['adventure', 'historical', 'unesco'],
    images: [
      'https://images.unsplash.com/photo-1577717903315-1691ae25f87e?w=800',
      'https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=800'
    ],
    meeting_point: 'Amman City Center, specified hotel pickup',
    what_included: ['Transportation', 'Guide', 'Entrance fees', 'Lunch', 'Water'],
    what_to_bring: ['Hiking shoes', 'Hat', 'Sunscreen', 'Camera'],
    languages: ['English', 'Arabic'],
    cancellation_policy: 'Free cancellation up to 72 hours before',
    is_active: true,
    rating: 5.0,
    total_reviews: 67,
    total_bookings: 198
  },
  {
    title: 'Medina Food Tour',
    city_id: cityIds[4],
    city_name: 'Tunis',
    host_id: 'demo-host-5',
    host_name: 'Fatima Ben Ali',
    description: 'Taste authentic Tunisian cuisine in the historic Medina. Sample traditional dishes, visit local markets, and learn about Tunisian food culture.',
    short_description: 'Culinary journey through the historic Medina.',
    duration: '3 hours',
    price: 50,
    currency: 'USD',
    max_guests: 10,
    min_guests: 1,
    category: 'Food Tour',
    tags: ['food', 'cultural', 'local experience'],
    images: [
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800'
    ],
    meeting_point: 'Medina Main Gate',
    what_included: ['Food tastings', 'Local guide', 'Traditional coffee', 'Market tour'],
    what_to_bring: ['Appetite', 'Camera', 'Comfortable shoes'],
    languages: ['English', 'French', 'Arabic'],
    cancellation_policy: 'Free cancellation up to 24 hours before',
    is_active: true,
    rating: 4.6,
    total_reviews: 43,
    total_bookings: 112
  }
];

// Sample Services Data
const services = [
  {
    name: 'Airport Pickup',
    icon: '🚕',
    description: 'Convenient airport transfer service',
    price: 25,
    category: 'transport',
    is_active: true
  },
  {
    name: 'City Guide',
    icon: '🗺️',
    description: 'Personal guide for your stay',
    price: 40,
    category: 'guide',
    is_active: true
  },
  {
    name: 'Traditional Meal',
    icon: '🍽️',
    description: 'Authentic local cuisine experience',
    price: 30,
    category: 'food',
    is_active: true
  },
  {
    name: 'Photography',
    icon: '📸',
    description: 'Professional photo session',
    price: 75,
    category: 'other',
    is_active: true
  },
  {
    name: 'Language Support',
    icon: '💬',
    description: 'Translation assistance',
    price: 20,
    category: 'other',
    is_active: true
  }
];

/**
 * Seed all data
 */
export const seedAllData = async () => {
  console.log('🌱 Starting database seeding...');

  try {
    // Seed Cities
    console.log('\n📍 Seeding cities...');
    const cityIds = [];
    const cityMap = {};
    for (const city of cities) {
      const id = await addDocument('cities', city);
      cityIds.push(id);
      cityMap[city.name] = id;
    }
    console.log(`✅ Created ${cityIds.length} cities`);

    // Seed Adventures (now depends on cityIds)
    console.log('\n🎒 Seeding adventures...');
    const adventureIds = [];
    const adventuresData = getAdventures(cityIds, cityMap);
    for (const adventure of adventuresData) {
      const id = await addDocument('adventures', adventure);
      adventureIds.push(id);
    }
    console.log(`✅ Created ${adventureIds.length} adventures`);

    // Seed Services
    console.log('\n🛎️ Seeding services...');
    const serviceIds = [];
    for (const service of services) {
      const id = await addDocument('services', service);
      serviceIds.push(id);
    }
    console.log(`✅ Created ${serviceIds.length} services`);

    console.log('\n🎉 Database seeding complete!');
    console.log('📊 Summary:');
    console.log(`   - ${cityIds.length} cities`);
    console.log(`   - ${adventureIds.length} adventures`);
    console.log(`   - ${serviceIds.length} services`);

    return {
      success: true,
      counts: {
        cities: cityIds.length,
        adventures: adventureIds.length,
        services: serviceIds.length
      }
    };
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

/**
 * Seed only cities
 */
export const seedCities = async () => {
  console.log('📍 Seeding cities...');
  const cityIds = [];
  for (const city of cities) {
    const id = await addDocument('cities', city);
    cityIds.push(id);
  }
  console.log(`✅ Created ${cityIds.length} cities`);
  return cityIds;
};

/**
 * Seed only adventures (requires cities to exist)
 */
export const seedAdventures = async () => {
  console.log('🎒 Seeding adventures...');
  console.log('⚠️ Note: This requires cities to be seeded first!');

  // Get existing cities
  const { getAllDocuments } = await import('./firestore');
  const existingCities = await getAllDocuments('cities');

  if (existingCities.length === 0) {
    throw new Error('No cities found. Please seed cities first!');
  }

  const cityIds = existingCities.map(c => c.id);
  const cityMap = {};
  existingCities.forEach(c => { cityMap[c.name] = c.id; });

  const adventureIds = [];
  const adventuresData = getAdventures(cityIds, cityMap);
  for (const adventure of adventuresData) {
    const id = await addDocument('adventures', adventure);
    adventureIds.push(id);
  }
  console.log(`✅ Created ${adventureIds.length} adventures`);
  return adventureIds;
};

/**
 * Seed only services
 */
export const seedServices = async () => {
  console.log('🛎️ Seeding services...');
  const serviceIds = [];
  for (const service of services) {
    const id = await addDocument('services', service);
    serviceIds.push(id);
  }
  console.log(`✅ Created ${serviceIds.length} services`);
  return serviceIds;
};
