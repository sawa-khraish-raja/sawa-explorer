import { useQuery } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import {
  Sparkles,
  Loader2,
  Download,
  History,
  Utensils,
  Bike,
  Palette,
  Mountain,
  Users,
  Moon,
  Calendar,
  DollarSign,
  Plane,
  Hotel,
  MapPin,
  Clock,
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { queryDocuments } from '@/utils/firestore';
import { invokeLLM } from '@/utils/llm';

import SimpleDatePicker from '../booking/SimpleDatePicker';
import { isAIFeatureEnabled } from '../config/aiFlags';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from '../i18n/LanguageContext';
import {
  showWarning,
  showError,
  showSuccess,
  showInfo,
  showPredefinedNotification,
} from '../utils/notifications';

const CATEGORIES = [
  { name: 'History', icon: <History className='w-4 h-4' /> },
  { name: 'Culture', icon: <Palette className='w-4 h-4' /> },
  { name: 'Food', icon: <Utensils className='w-4 h-4' /> },
  { name: 'Sport', icon: <Bike className='w-4 h-4' /> },
  { name: 'Nature', icon: <Mountain className='w-4 h-4' /> },
  { name: 'Family', icon: <Users className='w-4 h-4' /> },
  { name: 'Nightlife', icon: <Moon className='w-4 h-4' /> },
];

//  ENHANCED: Safe JSON Parser with Multiple Strategies
function safeParseJSON(jsonStr) {
  if (!jsonStr || typeof jsonStr !== 'string') {
    throw new Error('Invalid input for JSON parsing: not a string');
  }

  // Strategy 1: Try direct parse (works if AI returns clean JSON)
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed && typeof parsed === 'object') {
      console.log(' safeParseJSON: Strategy 1 (direct parse) succeeded.');
      return parsed;
    }
  } catch (e) {
    console.warn(' safeParseJSON: Strategy 1 (direct parse) failed:', e.message);
  }

  // Strategy 2: Extract JSON from markdown code blocks
  try {
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      let extracted = jsonMatch[1];

      // Attempt to clean up and parse the extracted block
      extracted = extracted
        .trim()
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*?)(\s*:)/g, '$1"$2"$3') // Quote unquoted keys
        .replace(/:\s*'([^']*)'/g, ':"$1"') // Replace single quotes with double for values
        .replace(/\\"/g, '"') // Fix escaped quotes
        .replace(/\/\/.*$/gm, '') // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments

      const parsed = JSON.parse(extracted);
      console.log(' safeParseJSON: Strategy 2 (markdown extraction) succeeded.');
      return parsed;
    }
    // If no markdown block, try to find a standalone JSON object
    const standaloneJsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (standaloneJsonMatch && standaloneJsonMatch[0]) {
      let extracted = standaloneJsonMatch[0];
      extracted = extracted
        .trim()
        .replace(/,(\s*[}\]])/g, '$1')
        .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*?)(\s*:)/g, '$1"$2"$3')
        .replace(/:\s*'([^']*)'/g, ':"$1"')
        .replace(/\\"/g, '"')
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');
      const parsed = JSON.parse(extracted);
      console.log(' safeParseJSON: Strategy 2.1 (standalone JSON extraction) succeeded.');
      return parsed;
    }
  } catch (e) {
    console.warn(' safeParseJSON: Strategy 2 (markdown/standalone extraction) failed:', e.message);
  }

  // Strategy 3: Aggressive cleanup and extraction for common JSON errors
  try {
    let fixed = jsonStr
      .trim()
      .replace(/```json/g, '') // Remove markdown hints
      .replace(/```/g, '') // Remove markdown fences
      .replace(/^\s*[\r\n]/gm, '') // Remove empty lines at start/end of string
      .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas in objects/arrays
      .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*?)(\s*:)/g, '$1"$2"$3') // Quote unquoted keys
      .replace(/:\s*'([^']*)'/g, ':"$1"') // Replace single quotes with double for values
      .replace(/\\"/g, '"') // Fix escaped double quotes within values
      .replace(/\/\/.*$/gm, '') // Remove single line comments
      .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments

    // Ensure the string starts with '{' and ends with '}'
    const jsonStart = fixed.indexOf('{');
    const jsonEnd = fixed.lastIndexOf('}') + 1;

    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      fixed = fixed.substring(jsonStart, jsonEnd);
      const parsed = JSON.parse(fixed);
      console.log(' safeParseJSON: Strategy 3 (aggressive cleanup) succeeded.');
      return parsed;
    }
  } catch (e) {
    console.warn(' safeParseJSON: Strategy 3 (aggressive cleanup) failed:', e.message);
  }

  throw new Error('All JSON parsing strategies failed to yield a valid JSON object.');
}

//  ENHANCED: Generate Fallback Plan
function generateFallbackPlan(destination, days, totalBudget, currency, allDates, dailyBreakdown) {
  console.log(' Generating fallback plan due to AI response issues.');

  const budgetBreakdown = {
    accommodation: Math.round(totalBudget * 0.4),
    activities: Math.round(totalBudget * 0.25),
    transport: Math.round(totalBudget * 0.2),
    meals: Math.round(totalBudget * 0.1),
    emergency: Math.round(totalBudget * 0.05),
  };

  const genericDailyBreakdown = {
    accommodation: Math.round(dailyBreakdown.accommodation),
    activities: Math.round(dailyBreakdown.activities),
    transport: Math.round(dailyBreakdown.transport),
    meals: Math.round(dailyBreakdown.meals),
  };

  return {
    destination,
    days,
    total_budget: totalBudget,
    currency,
    budget_breakdown: budgetBreakdown,
    daily_plan: allDates.map((d) => ({
      day: d.day,
      date: d.date,
      theme: `Day ${d.day} in ${destination}: Explore & Discover`,
      weather: {
        temp: '25°C',
        condition: 'Pleasant',
      },
      activities: [
        {
          time: '09:00',
          name: 'Morning Exploration',
          description: 'Discover local culture and landmarks in the city center.',
          cost: Math.round(genericDailyBreakdown.activities * 0.4),
          duration: '3h',
          category: 'Cultural',
          location: 'City Center',
          gps: '0.0,0.0',
        },
        {
          time: '14:00',
          name: 'Afternoon Sightseeing',
          description: 'Visit a popular attraction or museum.',
          cost: Math.round(genericDailyBreakdown.activities * 0.4),
          duration: '3h',
          category: 'Sightseeing',
          location: 'Main Tourist Area',
          gps: '0.0,0.0',
        },
        {
          time: '19:00',
          name: 'Evening Relaxation',
          description: 'Enjoy a casual evening stroll or local entertainment.',
          cost: Math.round(genericDailyBreakdown.activities * 0.2),
          duration: '2h',
          category: 'Leisure',
          location: 'Leisure District',
          gps: '0.0,0.0',
        },
      ],
      meals: [
        {
          type: 'Breakfast',
          suggestion: 'Local Café for traditional breakfast',
          cost: Math.round(genericDailyBreakdown.meals * 0.25),
          time: '07:30',
          location: 'Hotel Area',
        },
        {
          type: 'Lunch',
          suggestion: 'Street Food or local eatery',
          cost: Math.round(genericDailyBreakdown.meals * 0.35),
          time: '12:30',
          location: 'Downtown',
        },
        {
          type: 'Dinner',
          suggestion: 'Restaurant with local cuisine',
          cost: Math.round(genericDailyBreakdown.meals * 0.4),
          time: '19:00',
          location: 'City Center',
        },
      ],
      transport: {
        type: 'Public Transport',
        cost: genericDailyBreakdown.transport,
        details: 'Day pass for metro/bus system',
        how_to_get_around: 'Use the efficient public transport system for convenience.',
      },
      accommodation: {
        type: 'Hotel',
        name: `${destination} City Hotel`,
        cost_per_night: genericDailyBreakdown.accommodation,
        location: 'City Center',
        rating: '3-star',
      },
      daily_total: Math.round(
        genericDailyBreakdown.activities +
          genericDailyBreakdown.meals +
          genericDailyBreakdown.transport +
          genericDailyBreakdown.accommodation
      ),
    })),
    travel_essentials: {
      weather_overview: `Expect pleasant weather with average temperatures around 25°C. Pack light, breathable clothes.`,
      best_time_to_visit:
        'Spring and autumn usually offer the most comfortable weather conditions.',
      visa_info: 'Please check visa requirements for your nationality before traveling.',
      currency_tips: `Local currency is ${currency}. It's advisable to exchange at official banks or use ATMs.`,
      emergency_contacts: {
        police: 'Emergency Police: 112',
        hospital: 'Medical Emergency: 115',
        embassy: "Contact your country's embassy for assistance.",
      },
    },
    local_guide: {
      customs: [
        'Be respectful of local traditions and customs.',
        'Dress modestly when visiting religious sites.',
        'Learn a few basic local phrases to enhance your experience.',
        'Punctuality is appreciated for scheduled events.',
        'Bargaining may be common in markets, engage politely.',
      ],
      phrases: [
        { english: 'Hello', local: 'Marhaba', pronunciation: 'mahr-hah-bah' },
        { english: 'Thank you', local: 'Shukran', pronunciation: 'shook-ran' },
        {
          english: 'Please',
          local: 'Min fadlak',
          pronunciation: 'min fad-lak',
        },
        { english: 'Yes', local: "Na'am", pronunciation: 'nah-ahm' },
        { english: 'No', local: 'Laa', pronunciation: 'lah' },
      ],
      dos_and_donts: {
        dos: [
          'Do try local cuisine and street food.',
          'Do engage with locals respectfully.',
          'Do carry a reusable water bottle.',
        ],
        donts: [
          "Don't litter in public places.",
          "Don't be excessively loud in quiet areas.",
          "Don't disregard local customs and dress codes.",
        ],
      },
      sim_wifi_info:
        'Local SIM cards are generally available at the airport or telecom stores. Wi-Fi is widely available in hotels and cafes.',
    },
    safety: {
      warnings: [
        'Be aware of your surroundings, especially in crowded areas.',
        'Keep valuables secure and out of sight.',
        'Avoid walking alone late at night in unfamiliar neighborhoods.',
      ],
      scams: [
        "Be cautious of unsolicited 'guides' near tourist attractions.",
        'Always agree on taxi fares before starting your journey to avoid surprises.',
      ],
      safe_areas: ['City Center', 'Major Tourist Districts', 'Main Shopping Areas'],
      healthcare_info:
        'Pharmacies are commonly found. For serious medical issues, public and private hospitals are accessible.',
    },
    packing_list: [
      'Lightweight clothing',
      'Comfortable walking shoes',
      'Sunscreen and a hat',
      'Universal travel adapter',
      'Basic first aid kit',
      'Reusable water bottle',
      'Small day backpack',
      'Camera',
      'Local currency (some cash)',
      'Copies of important documents',
    ],
    sawa_benefits: `SAWA offers authentic local experiences and adventures in ${destination}. Connect with verified local hosts for unique insights and personalized tours. Book through SAWA for a memorable and immersive journey!`,
    total_estimate: totalBudget,
    tips: [
      'Book your accommodation and major attractions in advance for better deals.',
      'Utilize public transportation to save on travel costs.',
      'Immerse yourself in the local food scene, especially street food.',
      'Download offline maps of the city before you arrive.',
      'Learn a few basic phrases in the local language; it goes a long way.',
    ],
  };
}

export default function AITripPlanner() {
  const { t, language } = useTranslation();

  const [user, setUser] = useState(null);
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);
  const [tripPlan, setTripPlan] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const today = new Date().toISOString().split('T')[0];
  const tripPlannerEnabled = isAIFeatureEnabled('AI_TRIP_PLANNER');

  useEffect(() => {
    async function fetchUser() {
      try {
        const currentUser = await useAppContext().user;
        setUser(currentUser);
      } catch (e) {
        setUser(null);
      }
    }
    fetchUser();
  }, []);

  const { data: cityEvents = [] } = useQuery({
    queryKey: ['cityEventsForPlanner', destination],
    queryFn: async () => {
      if (!destination) return [];
      const events = await queryDocuments('events', [['city', '==', destination]]);
      return events.filter((e) => new Date(e.start_datetime) >= new Date());
    },
    enabled: !!destination,
  });

  const toggleCategory = (categoryName) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryName) ? prev.filter((c) => c !== categoryName) : [...prev, categoryName]
    );
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  const handlePlan = async () => {
    if (!tripPlannerEnabled) {
      showPredefinedNotification('AI_PLANNER_UNAVAILABLE', 'error', language);
      return;
    }

    if (!destination || !startDate || !endDate) {
      showPredefinedNotification('SELECT_DESTINATION', 'warning', language);
      return;
    }

    if (!budget || parseFloat(budget) <= 0) {
      showPredefinedNotification('ENTER_BUDGET', 'warning', language);
      return;
    }

    setLoading(true);
    setTripPlan(null);

    try {
      const days = calculateDays();
      const totalBudget = parseFloat(budget);

      const dailyBudget = totalBudget / days;
      const budgetBreakdown = {
        accommodation: Math.round(totalBudget * 0.4),
        activities: Math.round(totalBudget * 0.25),
        transport: Math.round(totalBudget * 0.2),
        meals: Math.round(totalBudget * 0.1),
        emergency: Math.round(totalBudget * 0.05),
      };

      const dailyBreakdown = {
        accommodation: Math.round(dailyBudget * 0.4),
        activities: Math.round(dailyBudget * 0.25),
        transport: Math.round(dailyBudget * 0.2),
        meals: Math.round(dailyBudget * 0.1),
      };

      const interestsPrompt =
        selectedCategories.length > 0
          ? `Focus on: ${selectedCategories.join(', ')}`
          : 'Balanced activities';

      const allDates = Array.from({ length: days }, (_, i) => {
        const date = addDays(new Date(startDate), i);
        return {
          day: i + 1,
          date: format(date, 'yyyy-MM-dd'),
          dayName: format(date, 'EEEE'),
        };
      });

      //  DETAILED PROMPT - Comprehensive trip planning
      const response = await invokeLLM({
        prompt: `You are an expert travel planner with deep knowledge of ${destination}. Create a comprehensive ${days}-day trip itinerary that feels authentic, practical, and exciting.

TRAVELER PROFILE:
- Destination: ${destination}
- Duration: ${days} days (${startDate} to ${endDate})
- Total Budget: ${budget} ${currency}
- Interests: ${interestsPrompt}
- Travel Style: Mix of popular attractions and hidden gems

INSTRUCTIONS:
1. Research ${destination}'s current attractions, popular neighborhoods, local cuisine, and cultural experiences
2. Create a day-by-day plan that flows naturally (consider travel time between locations)
3. Balance famous landmarks with authentic local experiences
4. Recommend specific restaurants, cafes, and food experiences - use real names of well-known establishments OR describe the type/area (e.g., "popular seafood restaurants in the Old Port area")
5. For accommodations: recommend NEIGHBORHOODS and hotel types, not specific hotel names (you don't have real-time hotel data)
6. Include practical details: opening hours, average costs, booking tips
7. Consider realistic travel times and energy levels throughout each day
8. Suggest activities that match the traveler's interests: ${interestsPrompt}
9. Include local insider tips and cultural etiquette
10. Provide safety advice specific to ${destination}
11. Budget should be realistic for ${destination}'s current cost of living
12. Be honest about what you know vs don't know - provide general guidance when specific current information isn't available

BUDGET ALLOCATION (Total: ${totalBudget} ${currency}):
- Accommodation: ${budgetBreakdown.accommodation} ${currency}
- Activities & Attractions: ${budgetBreakdown.activities} ${currency}
- Transportation: ${budgetBreakdown.transport} ${currency}
- Meals & Dining: ${budgetBreakdown.meals} ${currency}
- Emergency Fund: ${budgetBreakdown.emergency} ${currency}

CRITICAL: Return ONLY valid JSON. No markdown, no code blocks, no explanations. Just pure JSON starting with { and ending with }.

JSON Structure:
{
  "destination": "${destination}",
  "days": ${days},
  "total_budget": ${totalBudget},
  "currency": "${currency}",
  "budget_breakdown": {
    "accommodation": ${budgetBreakdown.accommodation},
    "activities": ${budgetBreakdown.activities},
    "transport": ${budgetBreakdown.transport},
    "meals": ${budgetBreakdown.meals},
    "emergency": ${budgetBreakdown.emergency}
  },
  "daily_plan": [
    {
      "day": 1,
      "date": "${allDates[0]?.date || 'YYYY-MM-DD'}",
      "theme": "Arrival & City Orientation - First Impressions of ${destination}",
      "weather": {"temp": "25°C", "condition": "Sunny", "humidity": "60%", "best_time_outdoors": "Morning and late afternoon"},
      "activities": [
        {
          "time": "09:00",
          "name": "Visit the Main Square & Historic District",
          "description": "Start your journey at the heart of ${destination}. Explore the historic architecture, watch local life unfold, and visit nearby monuments. Perfect for orientation and photos. Bring water and wear comfortable shoes.",
          "cost": ${Math.round(dailyBreakdown.activities * 0.3)},
          "duration": "2.5h",
          "category": "Cultural",
          "location": "Old Town Historic Quarter",
          "gps": "33.5138,36.2765",
          "booking_required": false,
          "insider_tip": "Visit early morning to avoid crowds and catch the best light for photos.",
          "nearby_attractions": ["Local Market", "Artisan Quarter"],
          "accessibility": "Wheelchair accessible"
        },
        {
          "time": "14:00",
          "name": "Afternoon Museum or Gallery Visit",
          "description": "Dive into ${destination}'s rich history and culture. Recommended: National Museum or Contemporary Art Gallery. Usually includes guided tours in multiple languages.",
          "cost": ${Math.round(dailyBreakdown.activities * 0.25)},
          "duration": "2h",
          "category": "Cultural",
          "location": "Museum District",
          "gps": "33.5140,36.2770",
          "booking_required": true,
          "booking_tip": "Book online to skip queues. Student discounts available.",
          "insider_tip": "Free entry on first Sunday of each month"
        }
      ],
      "meals": [
        {
          "type": "Breakfast",
          "suggestion": "Recommend type of place and area (e.g., 'Traditional cafes in the Old Town serve excellent breakfast') OR specific well-known establishment if you're confident",
          "dishes": ["List 3-4 typical breakfast dishes in ${destination}"],
          "cost": ${Math.round(dailyBreakdown.meals * 0.2)},
          "time": "07:30",
          "location": "Specific neighborhood or street",
          "insider_tip": "Local breakfast custom or money-saving tip",
          "restaurant_types": "Describe where locals eat breakfast"
        },
        {
          "type": "Lunch",
          "suggestion": "Street food area, market, or restaurant type/neighborhood - be specific about location but general about establishments unless very famous",
          "dishes": ["List 3-4 popular lunch options in ${destination}"],
          "cost": ${Math.round(dailyBreakdown.meals * 0.25)},
          "time": "12:30",
          "location": "Specific area or market name",
          "vegetarian_options": true,
          "popular_spots": "Mention famous food streets or markets"
        },
        {
          "type": "Dinner",
          "suggestion": "Recommend dining area/neighborhood and restaurant type. Mention specific famous restaurants ONLY if you're certain they're well-established",
          "dishes": ["List 3-4 must-try dinner dishes in ${destination}"],
          "cost": ${Math.round(dailyBreakdown.meals * 0.35)},
          "time": "19:30",
          "location": "Specific dining district or waterfront area",
          "reservation_recommended": true,
          "insider_tip": "Local dining customs, best times to eat, how to get authentic experience",
          "price_ranges": "Describe low/mid/high-end options in this area"
        }
      ],
      "transport": {
        "type": "Mix: Metro + Walking",
        "cost": ${Math.round(dailyBreakdown.transport / days)},
        "details": "Day pass for metro/bus + short taxi if needed",
        "how_to_get_around": "Get a rechargeable transport card at any metro station. Most attractions in Old Town are walkable. Use rideshare apps for late evening.",
        "estimated_walking": "5-7 km",
        "app_recommendations": ["Uber", "Careem", "Local Metro App"]
      },
      "accommodation": {
        "type": "Mid-range Hotel or Boutique Guesthouse",
        "recommended_areas": ["List 2-3 best neighborhoods to stay in ${destination}", "Consider proximity to attractions and safety"],
        "cost_per_night": ${Math.round(dailyBreakdown.accommodation / days)},
        "what_to_look_for": "Hotels with breakfast included, central location, good reviews, AC, WiFi. Mention specific neighborhoods or streets known for good hotels.",
        "booking_platforms": ["Booking.com", "Airbnb", "Local hotel booking sites for ${destination}"],
        "booking_tips": ["Book 2-3 months in advance for best prices", "Look for free cancellation options", "Check if breakfast is included", "Read recent reviews"],
        "budget_options": "For budget travelers: hostels in [specific areas], guesthouses, budget hotel chains available in ${destination}",
        "mid_range_options": "For mid-range: boutique hotels in [specific areas], 3-4 star hotels, well-reviewed guesthouses",
        "luxury_options": "For luxury: 5-star hotels in [specific areas], resort options if applicable"
      },
      "daily_total": ${Math.round(dailyBreakdown.accommodation / days + dailyBreakdown.meals * 0.8 + dailyBreakdown.activities * 0.55 + dailyBreakdown.transport / days)},
      "insider_tips": [
        "Keep small bills (5-10 ${currency}) for tips and street vendors",
        "Download offline maps before arriving",
        "Learn basic greetings in local language - locals appreciate it"
      ]
    }
  ],
  "travel_essentials": {
    "weather_overview": "Provide detailed weather forecast for ${destination} during ${startDate} to ${endDate}. Include temperature ranges, rainfall probability, humidity levels, and what clothes to pack. Mention if any weather extremes are expected.",
    "best_time_to_visit": "Explain the best months to visit ${destination} and why. Include peak/off-peak seasons, major festivals, and how timing affects prices and crowds.",
    "visa_info": "Detail visa requirements for common nationalities visiting ${destination}. Include: visa-on-arrival options, e-visa availability, required documents, processing time, and costs. Mention if visa-free entry exists.",
    "currency_tips": "Currency: ${currency}. Provide: current exchange rate estimates, best places to exchange money, ATM availability and fees, credit card acceptance, tipping customs, and typical daily spending.",
    "emergency_contacts": {
      "police": "Provide local emergency number",
      "ambulance": "Provide local ambulance number",
      "fire": "Provide fire department number",
      "tourist_police": "If available in ${destination}",
      "embassy": "Major embassy contacts for common nationalities",
      "hospital_recommendations": "List 2-3 reputable hospitals/clinics"
    },
    "connectivity": "SIM card options at airport and city, costs, data packages, WiFi availability in ${destination}",
    "power_adapters": "Specify plug types used in ${destination} and voltage",
    "language": "Main language(s) spoken, English proficiency level in tourist areas",
    "time_zone": "Time zone and any daylight saving considerations"
  },
  "local_guide": {
    "customs": [
      "List 5-7 specific cultural customs unique to ${destination}",
      "Include greeting etiquette, dining customs, and social norms",
      "Mention religious or cultural sensitivities",
      "Explain tipping culture and expected amounts",
      "Shopping and bargaining practices",
      "Photography restrictions (if any)"
    ],
    "phrases": [
      {"english": "Hello", "local": "Provide local greeting", "pronunciation": "phonetic spelling"},
      {"english": "Thank you", "local": "Local phrase", "pronunciation": "phonetic"},
      {"english": "Please", "local": "Local phrase", "pronunciation": "phonetic"},
      {"english": "Yes/No", "local": "Local phrases", "pronunciation": "phonetic"},
      {"english": "How much?", "local": "Essential for shopping", "pronunciation": "phonetic"},
      {"english": "Where is...?", "local": "For directions", "pronunciation": "phonetic"},
      {"english": "Excuse me", "local": "Polite phrase", "pronunciation": "phonetic"},
      {"english": "Help!", "local": "Emergency phrase", "pronunciation": "phonetic"}
    ],
    "dos_and_donts": {
      "dos": [
        "List 6-8 specific things travelers SHOULD do in ${destination}",
        "Include cultural respect practices",
        "Recommended behaviors and interactions",
        "Best practices for photos, dining, shopping",
        "How to show respect and appreciation"
      ],
      "donts": [
        "List 6-8 specific things to AVOID in ${destination}",
        "Cultural taboos and sensitive topics",
        "Behaviors that might offend locals",
        "Common tourist mistakes to avoid",
        "Safety-related don'ts"
      ]
    },
    "food_culture": "Describe ${destination}'s food culture: meal times, must-try dishes, dietary considerations, street food safety, restaurant etiquette",
    "social_norms": "Explain social interactions, personal space, conversation topics to avoid, gender-specific considerations if relevant",
    "religious_considerations": "If applicable to ${destination}, explain prayer times, religious holidays, dress codes, alcohol availability"
  },
  "safety": {
    "overall_safety_rating": "Rate ${destination} safety level (Very Safe / Safe / Moderately Safe / Exercise Caution) with brief explanation",
    "warnings": [
      "List 4-6 specific safety warnings for ${destination}",
      "Include area-specific concerns (neighborhoods to avoid)",
      "Time-specific warnings (night safety, rush hours)",
      "Seasonal concerns if applicable",
      "Transportation safety tips"
    ],
    "common_scams": [
      "Describe 5-7 common tourist scams in ${destination}",
      "How to recognize them",
      "How to avoid them",
      "What to do if targeted"
    ],
    "safe_areas": [
      "List 5-8 safest neighborhoods/areas in ${destination}",
      "Best areas for tourists to stay",
      "Safe areas for evening walks",
      "Family-friendly zones"
    ],
    "areas_to_avoid": [
      "List specific areas/neighborhoods to avoid in ${destination}",
      "Explain why (crime, unrest, etc.)",
      "Alternative safe areas nearby"
    ],
    "healthcare_info": {
      "quality": "Healthcare quality level in ${destination}",
      "insurance": "Travel insurance recommendations and local insurance acceptance",
      "pharmacies": "Availability, common medications, prescription requirements",
      "hospitals": "List 2-3 best hospitals for tourists with addresses",
      "common_health_risks": "List health risks specific to ${destination} (food/water safety, altitude, diseases)",
      "vaccinations": "Recommended vaccinations for ${destination}"
    },
    "emergency_procedures": "What to do in case of: theft, lost passport, medical emergency, natural disaster (if applicable to ${destination})",
    "women_travelers": "Specific safety advice for solo women travelers in ${destination}",
    "lgbtq_travelers": "LGBTQ+ safety considerations and legal status in ${destination}"
  },
  "packing_list": {
    "essentials": [
      "Passport & visa documents",
      "Travel insurance documents",
      "Credit cards & cash (${currency})",
      "Phone & charger",
      "Power adapter (specify type for ${destination})",
      "Copies of important documents (digital & physical)"
    ],
    "clothing": [
      "Weather-appropriate clothing for ${destination} in ${startDate} season",
      "Comfortable walking shoes (expect 5-10km daily)",
      "Dress code-appropriate attire (for religious sites if applicable)",
      "Light jacket or sweater (for AC/evenings)",
      "Swimwear (if relevant to ${destination})",
      "Specific items based on planned activities"
    ],
    "toiletries": [
      "Sunscreen (SPF 30+)",
      "Insect repellent (if needed in ${destination})",
      "Personal medications + prescription copies",
      "Basic first aid (bandaids, pain relievers, stomach meds)",
      "Hand sanitizer & wet wipes",
      "Toiletries (some hotels may not provide)"
    ],
    "tech": [
      "Power bank for phones",
      "Camera + memory cards",
      "Universal travel adapter",
      "Headphones",
      "Offline maps downloaded"
    ],
    "convenience": [
      "Reusable water bottle",
      "Small daypack/backpack",
      "Travel pillow for flights",
      "Earplugs & sleep mask",
      "Snacks for travel days",
      "Plastic bags for dirty clothes"
    ],
    "location_specific": [
      "Add 3-5 items specific to ${destination} and planned activities",
      "Based on weather, culture, and selected interests: ${interestsPrompt}"
    ]
  },
  "sawa_benefits": "SAWA connects you with authentic local experiences in ${destination}. Our platform features verified local hosts offering personalized tours, unique adventures, and insider access to hidden gems. Book activities through SAWA to support local communities and create unforgettable memories. Available experiences: cultural tours, food experiences, adventure activities, and customized itineraries matching your interests: ${interestsPrompt}.",
  "money_saving_tips": [
    "Provide 8-10 specific money-saving tips for ${destination}",
    "Free attractions and activities",
    "Best value restaurants and street food",
    "Transportation hacks",
    "When to visit for best prices",
    "Where locals shop vs tourist traps",
    "Apps and discount cards available in ${destination}"
  ],
  "pro_tips": [
    "Provide 10-12 insider tips that only locals would know about ${destination}",
    "Best times to visit popular attractions (avoid crowds)",
    "Hidden viewpoints and photo spots",
    "Local habits and rhythms (siesta times, rush hours, etc.)",
    "Neighborhood secrets",
    "Where locals actually eat/shop/hang out",
    "Seasonal events or weekly markets",
    "Day trip options from ${destination}",
    "Unique experiences not in guidebooks"
  ],
  "total_estimate": ${totalBudget},
  "budget_notes": "This is an estimated budget for ${days} days in ${destination}. Actual costs may vary based on personal spending habits, season, and accommodation choices. Always budget 10-15% extra for unexpected expenses."
}

IMPORTANT FINAL REMINDERS:
- Make this plan feel personal and practical, not generic
- Use specific names of places, restaurants, and attractions when possible
- All costs should be realistic for ${destination}'s current prices
- Daily plans should flow logically (consider geography and timing)
- Balance tourist attractions with authentic local experiences
- Consider the traveler's interests: ${interestsPrompt}
- All GPS coordinates should be accurate for ${destination}
- Return ONLY the JSON object, no other text or formatting`,
        response_json_schema: {
          type: 'object',
          properties: {
            destination: { type: 'string' },
            days: { type: 'number' },
            total_budget: { type: 'number' },
            currency: { type: 'string' },
            budget_breakdown: { type: 'object' },
            daily_plan: { type: 'array' },
            travel_essentials: { type: 'object' },
            local_guide: { type: 'object' },
            safety: { type: 'object' },
            packing_list: { type: 'array' },
            sawa_benefits: { type: 'string' },
            total_estimate: { type: 'number' },
            tips: { type: 'array' },
          },
          required: ['destination', 'days', 'total_budget', 'currency', 'daily_plan'],
        },
        add_context_from_internet: true,
      });

      let parsedPlan;

      //  ENHANCED: Try multiple parsing strategies
      try {
        if (typeof response === 'object' && response !== null && response.destination) {
          // AI returned a direct JSON object (ideal case with response_json_schema)
          parsedPlan = response;
          console.log(' AI returned valid object directly.');
        } else {
          // AI returned string - try to parse it using safeParseJSON
          parsedPlan = safeParseJSON(
            typeof response === 'string' ? response : JSON.stringify(response)
          );
          console.log(' Successfully parsed AI response string.');
        }
      } catch (parseError) {
        console.error(' All parsing strategies failed for AI response:', parseError.message);
        console.log(
          '📄 AI Response (first 2000 chars):',
          (typeof response === 'string' ? response : JSON.stringify(response)).substring(0, 2000)
        );

        // Use fallback plan
        showWarning(
          language === 'ar' ? 'استخدام خطة احتياطية' : 'Using Backup Plan',
          language === 'ar'
            ? 'تم إنشاء خطة أساسية بنجاح'
            : 'Generated basic plan successfully due to parsing issues.'
        );

        parsedPlan = generateFallbackPlan(
          destination,
          days,
          totalBudget,
          currency,
          allDates,
          dailyBreakdown
        );
      }

      //  Validate critical plan structure elements
      if (
        !parsedPlan ||
        !parsedPlan.destination ||
        !parsedPlan.daily_plan ||
        !Array.isArray(parsedPlan.daily_plan)
      ) {
        throw new Error('Invalid plan structure or missing key elements after parsing/fallback.');
      }

      //  Fill missing days if needed
      if (parsedPlan.daily_plan.length < days) {
        console.warn(
          ` Only ${parsedPlan.daily_plan.length} of ${days} days generated. Attempting to fill missing days...`
        );

        while (parsedPlan.daily_plan.length < days) {
          const lastDayIndex = parsedPlan.daily_plan.length - 1;
          const prevDay = parsedPlan.daily_plan[lastDayIndex];
          const nextDayNum = parsedPlan.daily_plan.length + 1;
          const nextDateInfo = allDates[nextDayNum - 1];

          if (!nextDateInfo) {
            console.warn(`Could not find date info for day ${nextDayNum}. Stopping day fill.`);
            break;
          }

          const newDay = {
            ...prevDay,
            day: nextDayNum,
            date: nextDateInfo.date,
            theme: `Day ${nextDayNum} in ${destination}`,
            activities: prevDay.activities ? prevDay.activities.map((a) => ({ ...a })) : [],
            meals: prevDay.meals ? prevDay.meals.map((m) => ({ ...m })) : [],
            transport: prevDay.transport ? { ...prevDay.transport } : {},
            accommodation: prevDay.accommodation ? { ...prevDay.accommodation } : {},
          };
          parsedPlan.daily_plan.push(newDay);
        }

        if (parsedPlan.daily_plan.length === days) {
          showInfo(
            language === 'ar'
              ? `تم ملء الأيام المفقودة حتى ${parsedPlan.daily_plan.length} يومًا.`
              : `Filled to ${parsedPlan.daily_plan.length} days.`
          );
        } else {
          showWarning(
            language === 'ar'
              ? `تم إنشاء ${parsedPlan.daily_plan.length} أيام من أصل ${days} أيام.`
              : `Generated ${parsedPlan.daily_plan.length} days out of ${days}.`
          );
        }
      } else if (parsedPlan.daily_plan.length > days) {
        parsedPlan.daily_plan = parsedPlan.daily_plan.slice(0, days);
        console.warn(` AI generated too many days. Trimmed to ${days}.`);
        showInfo(
          language === 'ar'
            ? `تم تقليم الأيام الزائدة إلى ${days} يومًا.`
            : `Trimmed extra days to ${days}.`
        );
      }

      parsedPlan.daily_plan = parsedPlan.daily_plan.map((day, index) => {
        if (!day.date && allDates[index]) day.date = allDates[index].date;
        if (!day.day) day.day = index + 1;

        const activitiesCost = (day.activities || []).reduce(
          (sum, a) => sum + (parseFloat(a.cost) || 0),
          0
        );
        const mealsCost = (day.meals || []).reduce((sum, m) => sum + (parseFloat(m.cost) || 0), 0);
        const transportCost = parseFloat(day.transport?.cost) || 0;
        const accommodationCost = parseFloat(day.accommodation?.cost_per_night) || 0;

        day.daily_total = Math.round(
          activitiesCost + mealsCost + transportCost + accommodationCost
        );

        return day;
      });

      const actualTotal = parsedPlan.daily_plan.reduce((sum, day) => sum + day.daily_total, 0);
      parsedPlan.total_estimate = actualTotal;

      setTripPlan(parsedPlan);
      showSuccess(
        language === 'ar'
          ? `🎉 خطة رحلتك لـ ${parsedPlan.daily_plan.length} أيام جاهزة!`
          : `🎉 Your ${parsedPlan.daily_plan.length}-day trip plan is ready!`
      );
    } catch (error) {
      console.error(' AI Planning Error:', error);

      let errorMessage =
        language === 'ar' ? 'فشل في إنشاء خطة الرحلة' : 'Failed to generate trip plan';
      if (error.message.includes('JSON') || error.message.includes('parsing')) {
        errorMessage =
          language === 'ar'
            ? 'خطأ في تنسيق البيانات المستلمة. يرجى المحاولة مرة أخرى.'
            : 'Data format error received. Please try again.';
      } else if (error.message.includes('network')) {
        errorMessage =
          language === 'ar'
            ? 'خطأ في الشبكة. يرجى التحقق من اتصالك.'
            : 'Network error. Check your connection.';
      }

      showError(errorMessage);
    }
    setLoading(false);
  };

  if (!tripPlannerEnabled) {
    return (
      <div className='bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-gray-200'>
        <p className='text-center text-gray-600'>AI Trip Planner is currently unavailable</p>
      </div>
    );
  }

  return (
    <div
      id='ai-trip-plan-container'
      className='bg-white rounded-2xl shadow-xl p-5 sm:p-6 lg:p-8 border-2 border-[#CCCCFF]'
    >
      <div className='flex items-center gap-3 mb-6'>
        <div className='w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-[#330066] to-[#9933CC] rounded-xl flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0'>
          <img
            src='https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e8bf2aebfc9660599d11a9/e62457e5e_WhatsAppImage2025-10-16at235513_248ceca9.jpg'
            alt='SAWA'
            className='w-full h-full object-cover'
          />
        </div>
        <div>
          <h3 className='text-xl sm:text-2xl font-bold text-gray-900'>AI Trip Planner</h3>
          <p className='text-xs sm:text-sm text-gray-600'>
            Get your personalized itinerary in seconds
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
        <Select value={destination} onValueChange={setDestination}>
          <SelectTrigger className='h-12'>
            <SelectValue placeholder='Select destination' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='Damascus'>Damascus</SelectItem>
            <SelectItem value='Amman'>Amman</SelectItem>
            <SelectItem value='Istanbul'>Istanbul</SelectItem>
            <SelectItem value='Cairo'>Cairo</SelectItem>
          </SelectContent>
        </Select>

        <div className='grid grid-cols-2 gap-2'>
          <SimpleDatePicker
            label=''
            value={startDate}
            onChange={setStartDate}
            minDate={today}
            placeholder='Start date'
            required
          />
          <SimpleDatePicker
            label=''
            value={endDate}
            onChange={setEndDate}
            minDate={startDate || today}
            placeholder='End date'
            required
          />
        </div>

        <div className='flex gap-2'>
          <div className='flex-1'>
            <Input
              type='number'
              placeholder='Enter budget'
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className='h-12'
              min='1'
              required
            />
          </div>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className='w-24 h-12'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='USD'>USD $</SelectItem>
              <SelectItem value='EUR'>EUR €</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {user && (
        <div className='mb-6'>
          <p className='text-sm font-medium text-center text-gray-700 mb-3'>What interests you?</p>
          <div className='flex flex-wrap justify-center gap-3'>
            {CATEGORIES.map((category) => (
              <Button
                key={category.name}
                variant={selectedCategories.includes(category.name) ? 'default' : 'outline'}
                onClick={() => toggleCategory(category.name)}
                className={cn(
                  'rounded-full transition-all border-2',
                  selectedCategories.includes(category.name)
                    ? 'bg-gradient-to-r from-[#330066] to-[#9933CC] text-white border-[#9933CC]'
                    : 'border-[#CCCCFF] hover:border-[#9933CC] hover:bg-[#E6E6FF]'
                )}
              >
                {category.icon}
                <span className='ml-2'>{category.name}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={handlePlan}
        disabled={loading}
        className='w-full h-12 bg-gradient-to-r from-[#330066] to-[#9933CC] hover:from-[#47008F] hover:to-[#AD5CD6] text-white font-semibold shadow-lg'
      >
        {loading ? (
          <Loader2 className='w-5 h-5 mr-2 animate-spin' />
        ) : (
          <Sparkles className='w-5 h-5 mr-2' />
        )}
        {loading ? 'Generating plan...' : 'Generate Trip Plan'}
      </Button>

      {loading && (
        <div className='mt-6 flex flex-col items-center py-8'>
          <Loader2 className='w-12 h-12 animate-spin text-[#9933CC] mb-4' />
          <p className='text-gray-600 text-center'>Creating your personalized trip plan...</p>
          <p className='text-sm text-gray-500 mt-2'>This may take a few seconds</p>
        </div>
      )}

      {tripPlan && !loading && <TripPlanDisplay plan={tripPlan} language={language} />}
    </div>
  );
}

function TripPlanDisplay({ plan, language }) {
  if (!plan || !plan.daily_plan) return null;

  return (
    <div id='trip-plan-display' className='mt-8 space-y-6'>
      {/* Budget Breakdown */}
      <div className='bg-gradient-to-br from-[#F5F3FF] to-white p-6 rounded-2xl border-2 border-[#E6CCFF]'>
        <h3 className='text-xl font-bold text-gray-900 mb-4 flex items-center gap-2'>
          <DollarSign className='w-6 h-6 text-[#9933CC]' />
          Budget Breakdown
        </h3>
        <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
          <BudgetItem
            icon={<Hotel />}
            label='Accommodation'
            amount={plan.budget_breakdown.accommodation}
            currency={plan.currency}
          />
          <BudgetItem
            icon={<MapPin />}
            label='Activities'
            amount={plan.budget_breakdown.activities}
            currency={plan.currency}
          />
          <BudgetItem
            icon={<Plane />}
            label='Transport'
            amount={plan.budget_breakdown.transport}
            currency={plan.currency}
          />
          <BudgetItem
            icon={<Utensils />}
            label='Meals'
            amount={plan.budget_breakdown.meals}
            currency={plan.currency}
          />
          <BudgetItem
            icon={<Sparkles />}
            label='Emergency'
            amount={plan.budget_breakdown.emergency}
            currency={plan.currency}
          />
        </div>
      </div>

      {/* Daily Timeline */}
      <div className='space-y-4'>
        <h3 className='text-2xl font-bold text-gray-900 flex items-center gap-2'>
          <Calendar className='w-6 h-6 text-[#9933CC]' />
          {plan.days}-Day Itinerary
        </h3>

        {plan.daily_plan.map((day, index) => (
          <DayCard
            key={index}
            day={day}
            dayNumber={index + 1}
            currency={plan.currency}
            language={language}
          />
        ))}
      </div>

      {/* Total Summary */}
      <div className='bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border-2 border-green-200'>
        <div className='flex justify-between items-center'>
          <div>
            <h3 className='text-xl font-bold text-gray-900'>Total Cost</h3>
            <p className='text-sm text-gray-600'>
              {plan.days} days in {plan.destination}
            </p>
          </div>
          <div className='text-right'>
            <div className='text-3xl font-bold text-green-700'>
              {plan.currency} {plan.total_estimate}
            </div>
            <p className='text-sm text-gray-600'>
              ~{plan.currency} {(plan.total_estimate / plan.days).toFixed(0)}
              /day
            </p>
          </div>
        </div>
      </div>

      {/* Tips */}
      {plan.tips && plan.tips.length > 0 && (
        <div className='bg-blue-50 p-6 rounded-2xl border-2 border-blue-200'>
          <h3 className='text-lg font-bold text-gray-900 mb-4 flex items-center gap-2'>
            <Sparkles className='w-5 h-5 text-blue-600' />
            Travel Tips
          </h3>
          <ul className='space-y-2'>
            {plan.tips.map((tip, i) => (
              <li key={i} className='text-gray-700 flex items-start gap-2'>
                <span className='text-blue-600 font-bold'>💡</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Download Button */}
      <Button
        onClick={() => window.print()}
        variant='outline'
        className='w-full h-12 border-2 border-[#9933CC] hover:bg-[#E6E6FF]'
      >
        <Download className='w-5 h-5 mr-2' />
        Download PDF
      </Button>
    </div>
  );
}

function BudgetItem({ icon, label, amount, currency }) {
  return (
    <div className='text-center p-4 bg-white rounded-xl border border-gray-200'>
      <div className='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2 text-[#9933CC]'>
        {icon}
      </div>
      <p className='text-xs text-gray-600 mb-1'>{label}</p>
      <p className='font-bold text-gray-900'>
        {currency} {amount}
      </p>
    </div>
  );
}

function DayCard({ day, dayNumber, currency, language }) {
  const formattedDate = format(
    new Date(day.date),
    language === 'ar' ? 'EEEE, d MMMM yyyy' : 'EEEE, MMMM d, yyyy'
  );

  return (
    <div className='bg-white rounded-2xl border-2 border-[#E6E6FF] p-6 hover:shadow-lg transition-all'>
      <div className='flex items-center gap-3 mb-4 pb-4 border-b border-gray-100'>
        <div className='w-12 h-12 bg-gradient-to-br from-[#9933CC] to-[#330066] rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0'>
          {dayNumber}
        </div>
        <div className='flex-1'>
          <h4 className='font-bold text-lg text-gray-900'>Day {dayNumber}</h4>
          <p className='text-sm text-gray-600'>{formattedDate}</p>
          {day.theme && <p className='text-sm text-[#9933CC] font-semibold mt-1'>{day.theme}</p>}
        </div>
        <div className='text-right'>
          <p className='text-xs text-gray-500'>Day Total</p>
          <p className='text-lg font-bold text-[#9933CC]'>
            {currency} {day.daily_total}
          </p>
        </div>
      </div>

      {/* Activities Timeline */}
      <div className='space-y-3 mb-4'>
        <h5 className='font-semibold text-gray-900 flex items-center gap-2'>
          <Clock className='w-4 h-4 text-[#9933CC]' />
          Activities Schedule
        </h5>
        {day.activities?.map((activity, i) => (
          <div
            key={i}
            className='flex items-start gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors'
          >
            <div className='text-sm font-mono text-[#9933CC] font-semibold min-w-[60px]'>
              {activity.time}
              {activity.end_time && <span className='text-gray-400'> - {activity.end_time}</span>}
            </div>
            <div className='flex-1'>
              <h6 className='font-semibold text-gray-900'>{activity.name}</h6>
              <p className='text-sm text-gray-600 mt-0.5'>{activity.description}</p>
              {activity.location && (
                <p className='text-xs text-gray-500 mt-1 flex items-center gap-1'>
                  <MapPin className='w-3 h-3' />
                  {activity.location}
                </p>
              )}
              <div className='flex items-center gap-3 mt-2 text-xs'>
                <span className='px-2 py-0.5 bg-purple-100 text-purple-700 rounded font-medium'>
                  {activity.category}
                </span>
                <span className='text-gray-600'>⏱️ {activity.duration}</span>
                <span className='font-bold text-[#9933CC]'>
                  💰 {currency} {activity.cost}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Meals */}
      {day.meals && day.meals.length > 0 && (
        <div className='mb-4'>
          <h5 className='font-semibold text-gray-900 mb-2 flex items-center gap-2'>
            <Utensils className='w-4 h-4 text-orange-600' />
            Meals
          </h5>
          <div className='grid grid-cols-3 gap-2'>
            {day.meals.map((meal, i) => (
              <div key={i} className='text-center p-3 bg-orange-50 rounded-lg'>
                <p className='text-xs font-semibold text-gray-700'>{meal.type}</p>
                {meal.time && <p className='text-xs text-gray-500'>{meal.time}</p>}
                <p className='text-xs text-gray-600 mt-1'>{meal.suggestion}</p>
                <p className='text-xs font-bold text-orange-600 mt-1'>
                  {currency} {meal.cost}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transport & Accommodation */}
      <div className='grid grid-cols-2 gap-3'>
        {day.transport && (
          <div className='p-3 bg-blue-50 rounded-lg'>
            <h6 className='font-semibold text-gray-900 mb-1 flex items-center gap-1.5 text-sm'>
              <Plane className='w-4 h-4 text-blue-600' />
              Transport
            </h6>
            <p className='text-sm text-gray-700'>{day.transport.type}</p>
            <p className='text-xs text-gray-600'>{day.transport.details}</p>
            <p className='text-sm font-bold text-blue-600 mt-1'>
              {currency} {day.transport.cost}
            </p>
          </div>
        )}

        {day.accommodation && (
          <div className='p-3 bg-green-50 rounded-lg'>
            <h6 className='font-semibold text-gray-900 mb-1 flex items-center gap-1.5 text-sm'>
              <Hotel className='w-4 h-4 text-green-600' />
              Accommodation
            </h6>
            <p className='text-sm font-semibold text-gray-700'>{day.accommodation.name}</p>
            <p className='text-xs text-gray-600'>
              {day.accommodation.type} • {day.accommodation.location}
            </p>
            <p className='text-sm font-bold text-green-600 mt-1'>
              {currency} {day.accommodation.cost_per_night} / night
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
