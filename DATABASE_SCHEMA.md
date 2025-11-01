# Sawa Explorer - Firestore Database Schema

## Collections Overview

All collections exist within the same Firestore database (e.g., `test` for development, `production` for live).

---

## 1. `users` Collection

**Purpose:** Store user profiles and authentication data

**Document ID:** Firebase Auth UID

**Schema:**
```javascript
{
  id: "firebase-uid",
  email: "user@example.com",
  full_name: "John Doe",
  phone: "+1234567890",              // Optional
  profile_photo: "url",               // Optional
  role_type: "user" | "host" | "admin" | "office",
  host_approved: false,               // If user can host experiences
  bio: "About me...",                 // Optional
  languages: ["English", "Arabic"],   // Optional
  verified: false,
  created_at: serverTimestamp(),
  updated_at: serverTimestamp()
}
```

---

## 2. `cities` Collection

**Purpose:** Available destinations

**Document ID:** Auto-generated

**Schema:**
```javascript
{
  name: "Damascus",
  country: "Syria",
  description: "City description...",
  image_url: "https://...",
  cover_images: ["url1", "url2"],     // Optional
  highlights: ["Old City", "Mosque"],
  latitude: 33.5138,                  // Optional
  longitude: 36.2765,                 // Optional
  is_active: true,
  popular: false,
  created_at: serverTimestamp(),
  updated_at: serverTimestamp()
}
```

---

## 3. `adventures` Collection

**Purpose:** Experiences/activities offered by hosts

**Document ID:** Auto-generated

**Schema:**
```javascript
{
  title: "Old Damascus Walking Tour",
  city_id: "city-doc-id",             // Reference to cities collection
  city_name: "Damascus",              // Denormalized for quick access
  host_id: "user-uid",                // Reference to users collection
  host_name: "John Doe",              // Denormalized
  description: "Detailed description...",
  short_description: "Brief summary", // Optional
  duration: "3 hours",
  price: 45,
  currency: "USD",
  max_guests: 8,
  min_guests: 1,
  category: "Walking Tour" | "Boat Tour" | "Historical Tour" | "Day Trip" | "Food Tour",
  tags: ["cultural", "historical"],   // Optional
  images: ["url1", "url2", "url3"],
  meeting_point: "Location details",
  what_included: ["Guide", "Food"],   // Optional
  what_to_bring: ["Comfortable shoes"], // Optional
  languages: ["English", "Arabic"],
  cancellation_policy: "24 hours",
  is_active: true,
  rating: 4.5,                        // Average rating
  total_reviews: 12,
  total_bookings: 45,
  created_at: serverTimestamp(),
  updated_at: serverTimestamp()
}
```

---

## 4. `services` Collection

**Purpose:** Additional services offered (transport, guides, etc.)

**Document ID:** Auto-generated

**Schema:**
```javascript
{
  name: "Airport Pickup",
  icon: "🚕",
  description: "Service description",
  price: 25,                          // Optional
  category: "transport" | "guide" | "food" | "other",
  is_active: true,
  created_at: serverTimestamp(),
  updated_at: serverTimestamp()
}
```

---

## 5. `bookings` Collection

**Purpose:** Track all booking transactions

**Document ID:** Auto-generated

**Schema:**
```javascript
{
  booking_number: "BK-20240101-001",  // Unique booking reference
  user_id: "firebase-uid",            // Reference to users
  user_name: "John Doe",              // Denormalized
  user_email: "user@example.com",     // Denormalized

  adventure_id: "adventure-doc-id",   // Reference to adventures
  adventure_title: "Tour Name",       // Denormalized
  host_id: "host-uid",                // Reference to host user
  host_name: "Host Name",             // Denormalized

  booking_date: "2024-01-15",         // Date of the experience
  booking_time: "10:00 AM",           // Time slot
  guests: 2,

  price_per_person: 45,
  total_price: 90,
  currency: "USD",

  status: "pending" | "confirmed" | "completed" | "cancelled" | "refunded",

  // Additional services
  services: [
    {
      service_id: "service-doc-id",
      service_name: "Airport Pickup",
      price: 25
    }
  ],

  payment_status: "pending" | "paid" | "refunded",
  payment_method: "card" | "cash" | "paypal",
  payment_id: "payment-doc-id",       // Reference to payments collection

  special_requests: "Dietary restrictions...", // Optional
  notes: "Internal notes",            // Optional for admin/host

  cancellation_reason: "...",         // If cancelled
  cancelled_at: serverTimestamp(),    // If cancelled
  cancelled_by: "user" | "host" | "admin",

  created_at: serverTimestamp(),
  updated_at: serverTimestamp()
}
```

**Indexes Needed:**
- `user_id` + `created_at` (descending)
- `host_id` + `status`
- `adventure_id` + `booking_date`

---

## 6. `chats` Collection

**Purpose:** Chat conversations between users

**Document ID:** Auto-generated or composite (e.g., `userId1_userId2`)

**Schema:**
```javascript
{
  participants: ["user-uid-1", "user-uid-2"],
  participant_names: {
    "user-uid-1": "John Doe",
    "user-uid-2": "Jane Smith"
  },
  participant_photos: {
    "user-uid-1": "photo-url",
    "user-uid-2": "photo-url"
  },

  last_message: "Hello there!",
  last_message_sender: "user-uid-1",
  last_message_at: serverTimestamp(),

  unread_count: {
    "user-uid-1": 0,
    "user-uid-2": 3
  },

  // Optional: Link to booking if chat is about a booking
  booking_id: "booking-doc-id",
  adventure_id: "adventure-doc-id",

  is_active: true,
  created_at: serverTimestamp(),
  updated_at: serverTimestamp()
}
```

**Indexes Needed:**
- `participants` (array-contains) + `last_message_at` (descending)

---

## 7. `messages` Subcollection

**Purpose:** Individual messages within a chat

**Path:** `chats/{chatId}/messages/{messageId}`

**Schema:**
```javascript
{
  sender_id: "user-uid",
  sender_name: "John Doe",
  sender_photo: "photo-url",          // Optional

  text: "Hello, I have a question...",
  type: "text" | "image" | "booking" | "system",

  // If type is image
  image_url: "https://...",           // Optional

  // If type is booking
  booking_id: "booking-doc-id",       // Optional

  read: false,
  read_at: serverTimestamp(),         // When read

  created_at: serverTimestamp()
}
```

**Indexes Needed:**
- `created_at` (ascending)

---

## 8. `reviews` Collection

**Purpose:** User reviews for adventures/hosts

**Document ID:** Auto-generated

**Schema:**
```javascript
{
  adventure_id: "adventure-doc-id",
  adventure_title: "Tour Name",       // Denormalized

  reviewer_id: "user-uid",
  reviewer_name: "John Doe",          // Denormalized
  reviewer_photo: "photo-url",        // Optional

  host_id: "host-uid",

  booking_id: "booking-doc-id",       // Link to booking

  rating: 5,                          // 1-5 stars
  comment: "Amazing experience!",

  // Individual ratings (optional)
  ratings: {
    accuracy: 5,
    communication: 5,
    cleanliness: 4,
    value: 5
  },

  photos: ["url1", "url2"],           // Optional

  helpful_count: 0,                   // Number of "helpful" votes

  host_response: "Thank you!",        // Optional host reply
  host_response_at: serverTimestamp(),

  is_verified: true,                  // Only from actual bookings
  is_flagged: false,                  // If reported

  created_at: serverTimestamp(),
  updated_at: serverTimestamp()
}
```

**Indexes Needed:**
- `adventure_id` + `created_at` (descending)
- `reviewer_id` + `created_at` (descending)
- `host_id` + `created_at` (descending)

---

## 9. `notifications` Collection

**Purpose:** User notifications

**Document ID:** Auto-generated

**Schema:**
```javascript
{
  user_id: "user-uid",                // Recipient

  type: "booking_confirmed" | "booking_cancelled" | "new_message" | "new_review" | "payment_received",

  title: "Booking Confirmed",
  message: "Your booking has been confirmed",

  // Related data
  related_id: "booking-doc-id",       // ID of related document
  related_type: "booking" | "message" | "review",

  action_url: "/bookings/123",        // Where to navigate

  icon: "check-circle",               // Optional icon

  read: false,
  read_at: serverTimestamp(),

  created_at: serverTimestamp()
}
```

**Indexes Needed:**
- `user_id` + `read` + `created_at` (descending)

---

## 10. `payments` Collection

**Purpose:** Payment transaction records

**Document ID:** Auto-generated

**Schema:**
```javascript
{
  booking_id: "booking-doc-id",
  user_id: "user-uid",
  host_id: "host-uid",

  amount: 90,
  currency: "USD",

  payment_method: "stripe" | "paypal" | "cash",
  payment_provider_id: "pi_xxx",      // Stripe payment intent ID

  status: "pending" | "completed" | "failed" | "refunded",

  // Commission/fees
  platform_fee: 9,                    // 10% platform fee
  host_amount: 81,                    // Amount host receives

  // Refund info
  refund_amount: 0,
  refund_reason: "",
  refunded_at: serverTimestamp(),

  metadata: {
    // Any additional provider metadata
  },

  created_at: serverTimestamp(),
  updated_at: serverTimestamp()
}
```

**Indexes Needed:**
- `user_id` + `created_at` (descending)
- `host_id` + `status`
- `booking_id`

---

## 11. `favorites` Collection

**Purpose:** User saved/favorited adventures

**Document ID:** Auto-generated or composite `{userId}_{adventureId}`

**Schema:**
```javascript
{
  user_id: "user-uid",
  adventure_id: "adventure-doc-id",
  adventure_title: "Tour Name",       // Denormalized
  adventure_image: "url",             // Denormalized
  created_at: serverTimestamp()
}
```

**Indexes Needed:**
- `user_id` + `created_at` (descending)

---

## Security Rules Structure

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role_type == 'admin';
    }

    // Users
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }

    // Cities, Adventures, Services - public read
    match /cities/{cityId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /adventures/{adventureId} {
      allow read: if true;
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() &&
                      (resource.data.host_id == request.auth.uid || isAdmin());
      allow delete: if isAdmin();
    }

    match /services/{serviceId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Bookings
    match /bookings/{bookingId} {
      allow read: if isAuthenticated() &&
                    (resource.data.user_id == request.auth.uid ||
                     resource.data.host_id == request.auth.uid ||
                     isAdmin());
      allow create: if isAuthenticated() &&
                      request.resource.data.user_id == request.auth.uid;
      allow update: if isAuthenticated() &&
                      (resource.data.user_id == request.auth.uid ||
                       resource.data.host_id == request.auth.uid ||
                       isAdmin());
      allow delete: if isAdmin();
    }

    // Chats
    match /chats/{chatId} {
      allow read: if isAuthenticated() &&
                    request.auth.uid in resource.data.participants;
      allow create: if isAuthenticated() &&
                      request.auth.uid in request.resource.data.participants;
      allow update: if isAuthenticated() &&
                      request.auth.uid in resource.data.participants;

      // Messages subcollection
      match /messages/{messageId} {
        allow read: if isAuthenticated() &&
                      request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
        allow create: if isAuthenticated() &&
                        request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
      }
    }

    // Reviews
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if isAuthenticated() &&
                      request.resource.data.reviewer_id == request.auth.uid;
      allow update: if isOwner(resource.data.reviewer_id) || isAdmin();
      allow delete: if isAdmin();
    }

    // Notifications
    match /notifications/{notificationId} {
      allow read: if isOwner(resource.data.user_id);
      allow update: if isOwner(resource.data.user_id);
      allow create, delete: if isAdmin();
    }

    // Payments - read only for users
    match /payments/{paymentId} {
      allow read: if isAuthenticated() &&
                    (resource.data.user_id == request.auth.uid ||
                     resource.data.host_id == request.auth.uid ||
                     isAdmin());
      allow write: if isAdmin();
    }

    // Favorites
    match /favorites/{favoriteId} {
      allow read: if isOwner(resource.data.user_id);
      allow create: if isAuthenticated() &&
                      request.resource.data.user_id == request.auth.uid;
      allow delete: if isOwner(resource.data.user_id);
    }
  }
}
```

---

## Composite Indexes Required

Create these in Firebase Console → Firestore → Indexes:

1. **bookings**
   - `user_id` (Ascending) + `created_at` (Descending)
   - `host_id` (Ascending) + `status` (Ascending)
   - `adventure_id` (Ascending) + `booking_date` (Ascending)

2. **chats**
   - `participants` (Array-contains) + `last_message_at` (Descending)

3. **reviews**
   - `adventure_id` (Ascending) + `created_at` (Descending)
   - `reviewer_id` (Ascending) + `created_at` (Descending)

4. **notifications**
   - `user_id` (Ascending) + `read` (Ascending) + `created_at` (Descending)

5. **payments**
   - `user_id` (Ascending) + `created_at` (Descending)
   - `host_id` (Ascending) + `status` (Ascending)

---

## Data Relationships

```
users
├── → adventures (as host)
├── → bookings (as guest)
├── → bookings (as host)
├── → reviews (as reviewer)
├── → chats (participant)
├── → notifications
├── → payments
└── → favorites

cities
└── → adventures

adventures
├── → bookings
├── → reviews
└── → favorites

bookings
├── → payments
├── → chats (optional)
└── → reviews
```
