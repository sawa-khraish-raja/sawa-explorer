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
    highlights: ['Old City', 'Umayyad Mosque', 'Souk al-Hamidiyya'],
    is_active: true
  },
  {
    name: 'Istanbul',
    country: 'Turkey',
    description: 'A city straddling two continents, rich in history and culture.',
    image_url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800',
    highlights: ['Hagia Sophia', 'Blue Mosque', 'Grand Bazaar'],
    is_active: true
  },
  {
    name: 'Cairo',
    country: 'Egypt',
    description: 'Home to the ancient pyramids and vibrant Egyptian culture.',
    image_url: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800',
    highlights: ['Pyramids of Giza', 'Egyptian Museum', 'Khan el-Khalili'],
    is_active: true
  },
  {
    name: 'Amman',
    country: 'Jordan',
    description: 'Modern capital with ancient Roman ruins and Middle Eastern charm.',
    image_url: 'https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=800',
    highlights: ['Citadel', 'Roman Theatre', 'Rainbow Street'],
    is_active: true
  },
  {
    name: 'Tunis',
    country: 'Tunisia',
    description: 'Mediterranean gateway with ancient Carthage nearby.',
    image_url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
    highlights: ['Medina', 'Bardo Museum', 'Carthage Ruins'],
    is_active: true
  }
];

// Sample Adventures/Experiences Data
const adventures = [
  {
    title: 'Old Damascus Walking Tour',
    city: 'Damascus',
    description: 'Explore the historic streets of Old Damascus with a local guide.',
    duration: '3 hours',
    price: 45,
    max_guests: 8,
    category: 'Walking Tour',
    image_url: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800',
    is_active: true
  },
  {
    title: 'Bosphorus Sunset Cruise',
    city: 'Istanbul',
    description: 'Sail along the Bosphorus and watch the sunset between two continents.',
    duration: '2 hours',
    price: 60,
    max_guests: 20,
    category: 'Boat Tour',
    image_url: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800',
    is_active: true
  },
  {
    title: 'Pyramid & Sphinx Tour',
    city: 'Cairo',
    description: 'Visit the iconic Pyramids of Giza and the Great Sphinx.',
    duration: '4 hours',
    price: 80,
    max_guests: 15,
    category: 'Historical Tour',
    image_url: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800',
    is_active: true
  },
  {
    title: 'Petra Day Trip',
    city: 'Amman',
    description: 'Full day excursion to the ancient city of Petra.',
    duration: 'Full day',
    price: 120,
    max_guests: 12,
    category: 'Day Trip',
    image_url: 'https://images.unsplash.com/photo-1577717903315-1691ae25f87e?w=800',
    is_active: true
  },
  {
    title: 'Medina Food Tour',
    city: 'Tunis',
    description: 'Taste authentic Tunisian cuisine in the historic Medina.',
    duration: '3 hours',
    price: 50,
    max_guests: 10,
    category: 'Food Tour',
    image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    is_active: true
  }
];

// Sample Services Data
const services = [
  { name: 'Airport Pickup', icon: '🚕', description: 'Convenient airport transfer service' },
  { name: 'City Guide', icon: '🗺️', description: 'Personal guide for your stay' },
  { name: 'Traditional Meal', icon: '🍽️', description: 'Authentic local cuisine experience' },
  { name: 'Photography', icon: '📸', description: 'Professional photo session' },
  { name: 'Language Support', icon: '💬', description: 'Translation assistance' }
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
    for (const city of cities) {
      const id = await addDocument('cities', city);
      cityIds.push(id);
    }
    console.log(`✅ Created ${cityIds.length} cities`);

    // Seed Adventures
    console.log('\n🎒 Seeding adventures...');
    const adventureIds = [];
    for (const adventure of adventures) {
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
 * Seed only adventures
 */
export const seedAdventures = async () => {
  console.log('🎒 Seeding adventures...');
  const adventureIds = [];
  for (const adventure of adventures) {
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
