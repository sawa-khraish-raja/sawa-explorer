# Practical Refactoring Plan

## Current Status

You're absolutely right - I created the structure but didn't fully migrate your existing code. Here's what's **actually been done** and a realistic plan forward.

## What's Already Implemented ✅

```
src/
├── domains/booking/              # ✅ Complete booking domain
│   ├── entities/Booking.js
│   ├── repositories/bookingRepository.js
│   ├── services/bookingService.js
│   └── use-cases/
│
├── features/
│   ├── traveler/bookings/        # ✅ New implementation (parallel to old)
│   └── admin/booking-oversight/  # ✅ New implementation
│
├── infrastructure/firebase/      # ✅ Repository base class
│
├── shared/
│   ├── components/
│   │   ├── ui/                   # ✅ Copied from src/components/ui
│   │   └── BookingStats.jsx      # ✅ Migrated
│   ├── hooks/
│   │   └── use-mobile.jsx        # ✅ Copied
│   └── utils.js                  # ✅ Copied from lib/utils.js
│
└── OLD CODE (Still in place):
    ├── components/
    ├── pages/
    ├── services/
    └── utils/
```

## What's NOT Migrated Yet

- **Old booking pages** (still in `src/pages`)
- **Old booking components** (still in `src/components/booking`)
- **AuthContext** (still in `src/contexts`)
- **All other features** (adventures, reviews, users, etc.)

## The Problem

I created the new architecture but your app still uses the old paths. The new code exists in parallel but isn't integrated.

## Solution: Incremental Migration Strategy

Instead of migrating everything at once, here's a **realistic, step-by-step approach**:

### Phase 1: Start Using New Code for New Features (TODAY)

**Rule**: All NEW features use the new architecture. Old features stay as-is.

**Example**: When you need to add a new feature:
```javascript
// NEW feature - use this
import { bookingService } from '@/domains/booking';
import { useBookings } from '@/features/traveler/bookings';

// OLD feature - leave as-is
import { getUserBookings } from '@/utils/firestore';
```

### Phase 2: Migrate One Component at a Time

Pick ONE component and migrate it completely. Here's the step-by-step:

#### Example: Migrate an existing page that shows bookings

**BEFORE** (`src/pages/SomeBookingPage.jsx`):
```javascript
import { useEffect, useState } from 'react';
import { getUserBookings } from '@/utils/firestore';
import BookingCard from '@/components/booking/BookingCard';

export default function SomeBookingPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const data = await getUserBookings(userId);
      setBookings(data);
      setLoading(false);
    };
    fetch();
  }, [userId]);

  return <div>{bookings.map(b => <BookingCard booking={b} />)}</div>;
}
```

**AFTER** (using new architecture):
```javascript
import { useBookings } from '@/features/traveler/bookings';
import { BookingList } from '@/features/traveler/bookings';

export default function SomeBookingPage() {
  const { data: bookings, isLoading } = useBookings(userId);

  if (isLoading) return <div>Loading...</div>;

  return <BookingList bookings={bookings} />;
}
```

**Steps to migrate**:
1. Replace `useEffect` + `useState` with `useBookings` hook
2. Replace old component with new `BookingList`
3. Test thoroughly
4. Once working, delete old code

### Phase 3: Migration Priority

**Migrate in this order**:

1. **High-value, Low-effort**
   - Pages that just display data
   - Simple forms
   - Small components

2. **Medium effort**
   - Complex pages with logic
   - Pages with multiple data sources

3. **Last**
   - Admin pages
   - Rarely used features
   - Static pages

### Phase 4: Domain Creation Order

Create domains as you need them:

1. ✅ **booking** (DONE)
2. **user** - When you need to refactor auth/profile pages
3. **adventure** - When you need to refactor adventure listings
4. **review** - When you need to refactor reviews
5. Others as needed

## Practical Example: Migrate ONE Page Right Now

Let's migrate `src/pages/MyBookings.jsx` (if it exists) or create a new one that replaces the old functionality.

### Step 1: Check what exists

```bash
ls src/pages/*Booking*.jsx
```

### Step 2: Create new page using new architecture

Instead of modifying the old page, create a new route:

```javascript
// src/pages/MyBookingsNew.jsx (temporary name)
import { MyBookings } from '@/features/traveler/bookings';

export default MyBookings;
```

### Step 3: Update router to use new page

```javascript
// In your router config
import MyBookingsNew from '@/pages/MyBookingsNew';

// Change the route from old to new
<Route path="/my-bookings" element={<MyBookingsNew />} />
```

### Step 4: Test thoroughly

### Step 5: Once working:
- Delete old `MyBookings.jsx`
- Rename `MyBookingsNew.jsx` to `MyBookings.jsx`

## Import Update Pattern

When migrating files, update imports:

### UI Components
```javascript
// OLD
import { Button } from '@/components/ui/button';

// NEW
import { Button } from '@/shared/components/ui/button';
```

### Business Logic
```javascript
// OLD
import { getUserBookings } from '@/utils/firestore';

// NEW
import { bookingService } from '@/domains/booking';
const bookings = await bookingService.getUserBookings(userId);
```

### Hooks
```javascript
// OLD
const [bookings, setBookings] = useState([]);
useEffect(() => { /* fetch */ }, []);

// NEW
import { useBookings } from '@/features/traveler/bookings';
const { data: bookings, isLoading } = useBookings(userId);
```

## How to Know What to Migrate Next

### Signs a component is ready to migrate:
- ✅ It uses direct Firebase calls (`getDocs`, `addDoc`, etc.)
- ✅ It has complex `useEffect` hooks for data fetching
- ✅ It duplicates logic from other components
- ✅ You need to add features to it

### Don't migrate yet:
- ❌ It works fine and rarely changes
- ❌ It's scheduled for removal
- ❌ It has no business logic (pure UI)

## Coexistence Strategy

**The old and new code can coexist!**

```
src/
├── domains/          # NEW - use for new features
├── features/         # NEW - use for new features
├── infrastructure/   # NEW - use for new features
├── shared/           # NEW - use for new features
│
└── LEGACY (Keep until migrated):
    ├── components/   # OLD - migrate one at a time
    ├── pages/        # OLD - migrate one at a time
    ├── services/     # OLD - migrate one at a time
    └── utils/        # OLD - migrate one at a time
```

## Weekly Migration Goal

**Week 1-2**:
- Use new architecture for all new features
- Migrate 2-3 simple pages

**Week 3-4**:
- Migrate 2-3 complex pages
- Start migrating components

**Month 2**:
- 50% of features migrated
- Old code clearly marked as legacy

**Month 3**:
- 80% migrated
- Start cleaning up old code

**Month 4**:
- 100% migrated
- Delete all old code

## Quick Win: Update Just the Imports

Even without full migration, you can start using the new shared components:

```javascript
// Find and replace across project:
// FROM: '@/components/ui/'
// TO: '@/shared/components/ui/'

// FROM: '@/lib/utils'
// TO: '@/shared/utils'
```

This doesn't change functionality but starts adopting the new structure.

## Testing Strategy

Before each migration:
1. Write down what the component does
2. Test manually
3. Take screenshots if needed
4. Migrate
5. Test again - should work identically
6. If broken, rollback
7. If working, commit and move to next

## Rollback Plan

Keep old code until you're 100% sure:

```javascript
// Temporary during migration
import MyBookingsOld from '@/pages/MyBookingsOld';
import { MyBookings as MyBookingsNew } from '@/features/traveler/bookings';

// Feature flag
const USE_NEW_ARCHITECTURE = true;

export default function MyBookings() {
  return USE_NEW_ARCHITECTURE ? <MyBookingsNew /> : <MyBookingsOld />;
}
```

## Summary: What You Should Do NOW

1. **Keep using your existing code** - it works!

2. **Start new features with new architecture**:
   - Use `@/domains/booking` for booking logic
   - Use `@/features` for new UI components
   - Use `@/shared` for reusable components

3. **Migrate incrementally**:
   - Pick ONE simple page
   - Follow the example above
   - Test thoroughly
   - Repeat weekly

4. **Don't feel pressured to migrate everything** - the old code works fine!

The new architecture is there when you need it, but there's no rush to migrate everything at once.

## Questions?

- Which page should I migrate first?
- How do I handle [specific scenario]?
- Is this component a good candidate for migration?

Let me know and I can provide specific guidance!
