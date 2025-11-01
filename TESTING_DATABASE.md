# Testing Your Database Setup

## Step 1: Access DevTools Page

1. Make sure your app is running (`npm start`)
2. Open your browser and go to: **http://localhost:5173/dev-tools**
3. You should see the Developer Tools page with database statistics

---

## Step 2: Seed the Database

### Option A: Seed Everything at Once
1. Click the **"Seed All Data"** button
2. Wait for the success message
3. Click **"Refresh Stats"** to see the updated counts

### Option B: Seed Individual Collections
1. Click **"Seed Cities"** - adds 5 cities
2. Click **"Seed Adventures"** - adds 5 adventures (requires cities first!)
3. Click **"Seed Services"** - adds 5 services

**Expected Results:**
- ✅ 5 cities
- ✅ 5 adventures
- ✅ 5 services
- ✅ 1+ users (from your signup)

---

## Step 3: Verify in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **sawa-explorer**
3. Click **Firestore Database** in the left menu
4. Select the **"test"** database (top-right dropdown)
5. You should see these collections:
   - `cities` (5 documents)
   - `adventures` (5 documents)
   - `services` (5 documents)
   - `users` (1+ documents)

6. Click on any collection to see the data
7. Verify the fields match the schema

---

## Step 4: Test in Browser Console

Open your browser console (F12) and test the helper functions:

### Test 1: Get All Cities
```javascript
// Import the function
const { getAllDocuments } = await import('/src/utils/firestore.js');

// Get all cities
const cities = await getAllDocuments('cities');
console.log('Cities:', cities);
// Expected: Array of 5 city objects
```

### Test 2: Get All Adventures
```javascript
const { getAllDocuments } = await import('/src/utils/firestore.js');

const adventures = await getAllDocuments('adventures');
console.log('Adventures:', adventures);
// Expected: Array of 5 adventure objects
```

### Test 3: Get Adventures by City
```javascript
const { getAllDocuments, getAdventuresByCity } = await import('/src/utils/firestore.js');

// First get a city ID
const cities = await getAllDocuments('cities');
const damascus = cities.find(c => c.name === 'Damascus');

// Get adventures for that city
const adventuresInDamascus = await getAdventuresByCity(damascus.id);
console.log('Adventures in Damascus:', adventuresInDamascus);
// Expected: Array with 1 adventure (Old Damascus Walking Tour)
```

### Test 4: Search Adventures
```javascript
const { searchAdventures } = await import('/src/utils/firestore.js');

const results = await searchAdventures({
  category: 'Food Tour',
  sortBy: 'rating'
});
console.log('Food Tours:', results);
// Expected: Array with 1 adventure (Medina Food Tour)
```

---

## Step 5: Test Creating Data

### Create a Booking (Example)
```javascript
const { addDocument } = await import('/src/utils/firestore.js');

// Create a test booking
const bookingId = await addDocument('bookings', {
  booking_number: 'BK-TEST-001',
  user_id: 'your-user-id', // Replace with your actual user ID
  user_name: 'Test User',
  user_email: 'test@example.com',
  adventure_id: 'adventure-id', // Replace with actual adventure ID
  adventure_title: 'Test Adventure',
  host_id: 'host-id',
  host_name: 'Test Host',
  booking_date: '2024-12-25',
  booking_time: '10:00 AM',
  guests: 2,
  price_per_person: 50,
  total_price: 100,
  currency: 'USD',
  status: 'pending',
  payment_status: 'pending',
  payment_method: 'card'
});

console.log('Booking created with ID:', bookingId);
```

### Create a Review (Example)
```javascript
const { createReview } = await import('/src/utils/firestore.js');

const reviewId = await createReview({
  adventure_id: 'adventure-id', // Replace with actual ID
  adventure_title: 'Old Damascus Walking Tour',
  reviewer_id: 'your-user-id',
  reviewer_name: 'Test User',
  host_id: 'demo-host-1',
  booking_id: 'booking-id',
  rating: 5,
  comment: 'Amazing experience! Highly recommend.',
  ratings: {
    accuracy: 5,
    communication: 5,
    cleanliness: 5,
    value: 5
  }
});

console.log('Review created with ID:', reviewId);
```

### Add to Favorites
```javascript
const { addToFavorites, getAllDocuments } = await import('/src/utils/firestore.js');

// Get an adventure to favorite
const adventures = await getAllDocuments('adventures');
const adventure = adventures[0];

// Add to favorites
const favoriteId = await addToFavorites('your-user-id', adventure);
console.log('Added to favorites:', favoriteId);

// Verify
const { getUserFavorites } = await import('/src/utils/firestore.js');
const favorites = await getUserFavorites('your-user-id');
console.log('My favorites:', favorites);
```

---

## Step 6: Test Security Rules

### Test Reading Public Data (Should Work)
```javascript
const { getAllDocuments } = await import('/src/utils/firestore.js');

// These should work even if not logged in
const cities = await getAllDocuments('cities');
const adventures = await getAllDocuments('adventures');
const services = await getAllDocuments('services');

console.log('Public data loaded successfully!');
```

### Test Protected Data (Should Fail if Not Logged In)
```javascript
const { getAllDocuments } = await import('/src/utils/firestore.js');

try {
  // This should fail if not authenticated
  const bookings = await getAllDocuments('bookings');
  console.log('Bookings:', bookings);
} catch (error) {
  console.log('Expected error:', error.message);
  // Expected: Permission denied
}
```

---

## Step 7: Deploy Security Rules to Firebase

### Option A: Using Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select **sawa-explorer** project
3. Go to **Firestore Database** → **Rules** tab
4. Copy the content from `firestore.rules` file
5. Paste it into the rules editor
6. Click **Publish**

### Option B: Using Firebase CLI
```bash
# Install Firebase CLI if you haven't
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

---

## Common Issues & Solutions

### Issue 1: "Permission denied" errors
**Solution:** Make sure you're logged in and the security rules are deployed.

### Issue 2: Adventures seeding fails
**Solution:** Seed cities first! Adventures depend on city IDs.

### Issue 3: Can't see data in Firebase Console
**Solution:**
- Make sure you selected the **"test"** database (not "default")
- Check the database dropdown in top-right corner

### Issue 4: Import errors in console
**Solution:** Use the full path with `/src/` prefix:
```javascript
const { getAllDocuments } = await import('/src/utils/firestore.js');
```

---

## Quick Test Checklist

- [ ] DevTools page loads at `/dev-tools`
- [ ] "Seed All Data" button works
- [ ] Stats show correct counts (5 cities, 5 adventures, 5 services)
- [ ] Data visible in Firebase Console
- [ ] Can query cities in browser console
- [ ] Can query adventures in browser console
- [ ] Can create a test booking
- [ ] Can create a test review
- [ ] Can add to favorites
- [ ] Security rules deployed
- [ ] Public data accessible without auth
- [ ] Protected data requires authentication

---

## Next Steps After Testing

Once everything works:

1. **Create more sample data** - Add more cities, adventures, etc.
2. **Build UI components** - Create pages to display adventures, bookings, etc.
3. **Implement booking flow** - Allow users to book adventures
4. **Add chat feature** - Enable messaging between users and hosts
5. **Build admin dashboard** - Manage users, bookings, and content

Your database is ready for production! 🚀
