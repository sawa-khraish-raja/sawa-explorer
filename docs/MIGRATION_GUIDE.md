# Migration Guide: Old to New Architecture

## Overview

This guide helps you migrate existing code from the old structure to the new hybrid architecture.

## Before You Start

1. Read `ARCHITECTURE.md` to understand the new structure
2. Identify the feature you want to migrate
3. List all files related to that feature
4. Plan the migration in phases

## Migration Checklist

- [ ] Create domain entities
- [ ] Create domain repository
- [ ] Create domain service
- [ ] Create feature hooks
- [ ] Migrate components
- [ ] Update pages
- [ ] Update imports
- [ ] Test thoroughly
- [ ] Remove old code

## Step-by-Step Migration Example

### Example: Migrating Booking Feature

#### Old Structure

```
src/
├── components/booking/
│   ├── BookingCard.jsx
│   ├── BookingForm.jsx
│   └── BookingStats.jsx
├── pages/
│   ├── CreateBooking.jsx
│   └── AdminBookings.jsx
├── services/firebaseEntities/
│   └── bookingEntity.js
└── utils/
    └── firestore.js
```

#### New Structure

```
src/
├── domains/booking/
│   ├── entities/Booking.js
│   ├── repositories/bookingRepository.js
│   ├── services/bookingService.js
│   └── use-cases/createBooking.js
├── features/
│   ├── traveler/bookings/
│   │   ├── components/BookingCard.jsx
│   │   ├── hooks/useBookings.js
│   │   └── pages/MyBookings.jsx
│   └── admin/booking-oversight/
│       ├── components/BookingStatsCards.jsx
│       ├── hooks/useAllBookings.js
│       └── pages/AdminBookingsPage.jsx
└── infrastructure/firebase/
    └── firebaseRepository.js
```

### Step 1: Create Domain Entity

**Old Code** (`services/firebaseEntities/bookingEntity.js`):
```javascript
const create = async (data) => {
  const docRef = await addDoc(collection(db, 'bookings'), {
    ...data,
    created_at: serverTimestamp(),
  });
  return docRef.id;
};
```

**New Code** (`domains/booking/entities/Booking.js`):
```javascript
export class Booking {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.status = data.status || 'pending';
  }

  canBeCancelled() {
    return this.status === 'pending' || this.status === 'confirmed';
  }

  cancel() {
    if (!this.canBeCancelled()) {
      throw new Error('This booking cannot be cancelled');
    }
    this.status = 'cancelled';
    return this;
  }

  toFirestore() {
    return {
      user_id: this.userId,
      status: this.status,
    };
  }
}
```

### Step 2: Create Repository

**Old Code** (Direct Firestore calls in components):
```javascript
const bookings = await getDocs(query(
  collection(db, 'bookings'),
  where('user_id', '==', userId)
));
```

**New Code** (`domains/booking/repositories/bookingRepository.js`):
```javascript
import { FirebaseRepository } from '@/infrastructure/firebase';

class BookingRepository extends FirebaseRepository {
  constructor() {
    super('bookings');
  }

  async findByUserId(userId) {
    return this.filter({ user_id: userId });
  }
}

export const bookingRepository = new BookingRepository();
```

### Step 3: Create Service

**Old Code** (Scattered logic):
```javascript
const createBooking = async (data) => {
  const id = await addDocument('bookings', data);
  await sendNotification(data.user_id, 'Booking created');
  return id;
};
```

**New Code** (`domains/booking/services/bookingService.js`):
```javascript
import { bookingRepository } from '../repositories/bookingRepository';

export const bookingService = {
  async getUserBookings(userId) {
    return bookingRepository.findByUserId(userId);
  },

  async createBooking(bookingData) {
    if (!bookingData.traveler_email) {
      throw new Error('Traveler email is required');
    }
    return bookingRepository.create(bookingData);
  },

  async cancelBooking(id, reason) {
    const booking = await bookingRepository.getById(id);
    if (!booking) {
      throw new Error('Booking not found');
    }

    booking.cancel();
    return bookingRepository.update(id, {
      status: booking.status,
      cancellation_reason: reason,
    });
  },
};
```

### Step 4: Create Feature Hooks

**Old Code** (useEffect in components):
```javascript
const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      const data = await getUserBookings(currentUser.uid);
      setBookings(data);
      setLoading(false);
    };
    fetchBookings();
  }, [currentUser]);

  return <div>...</div>;
};
```

**New Code** (`features/traveler/bookings/hooks/useBookings.js`):
```javascript
import { useQuery } from '@tanstack/react-query';
import { bookingService } from '@/domains/booking';

export const useBookings = (userId) => {
  return useQuery({
    queryKey: ['bookings', 'user', userId],
    queryFn: () => bookingService.getUserBookings(userId),
    enabled: !!userId,
  });
};
```

**New Page** (`features/traveler/bookings/pages/MyBookings.jsx`):
```javascript
import { useBookings } from '../hooks';

export const MyBookings = () => {
  const { currentUser } = useAuth();
  const { data: bookings, isLoading } = useBookings(currentUser?.uid);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {bookings.map(booking => (
        <BookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  );
};
```

### Step 5: Migrate Components

**Old Code** (`components/booking/BookingCard.jsx`):
```javascript
import { Button } from '../ui/button';

export const BookingCard = ({ booking }) => {
  const handleCancel = async () => {
    await updateDoc(doc(db, 'bookings', booking.id), {
      status: 'cancelled'
    });
  };

  return (
    <div>
      <h3>{booking.city_name}</h3>
      <Button onClick={handleCancel}>Cancel</Button>
    </div>
  );
};
```

**New Code** (`features/traveler/bookings/components/BookingCard.jsx`):
```javascript
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';

export const BookingCard = ({ booking, onCancel }) => {
  return (
    <Card>
      <CardContent>
        <h3>{booking.cityName}</h3>
        {booking.canBeCancelled() && (
          <Button onClick={() => onCancel(booking.id)}>
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
```

**Usage in Page**:
```javascript
import { useCancelBooking } from '../hooks';
import { BookingCard } from '../components';

export const MyBookings = () => {
  const { data: bookings } = useBookings(userId);
  const cancelBooking = useCancelBooking();

  const handleCancel = async (bookingId) => {
    await cancelBooking.mutateAsync({ bookingId, reason: 'User cancelled' });
  };

  return (
    <div>
      {bookings.map(booking => (
        <BookingCard
          key={booking.id}
          booking={booking}
          onCancel={handleCancel}
        />
      ))}
    </div>
  );
};
```

## Common Migration Patterns

### Pattern 1: Firebase Direct Calls → Repository

**Before**:
```javascript
const snapshot = await getDocs(collection(db, 'bookings'));
const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

**After**:
```javascript
const bookings = await bookingRepository.getAll();
```

### Pattern 2: Inline Logic → Service

**Before**:
```javascript
const confirmBooking = async (id) => {
  await updateDoc(doc(db, 'bookings', id), { status: 'confirmed' });
  await addDoc(collection(db, 'notifications'), {
    user_id: booking.user_id,
    message: 'Your booking is confirmed'
  });
};
```

**After**:
```javascript
export const confirmBookingUseCase = async (bookingId) => {
  const booking = await bookingService.confirmBooking(bookingId);

  await notificationService.create({
    user_id: booking.userId,
    message: 'Your booking is confirmed'
  });

  return booking;
};
```

### Pattern 3: useState/useEffect → React Query

**Before**:
```javascript
const [bookings, setBookings] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetch = async () => {
    try {
      setLoading(true);
      const data = await getBookings();
      setBookings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetch();
}, []);
```

**After**:
```javascript
const { data: bookings, isLoading, error } = useBookings(userId);
```

## Import Path Updates

### Update jsconfig.json

Add path aliases if not already present:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/domains/*": ["src/domains/*"],
      "@/features/*": ["src/features/*"],
      "@/shared/*": ["src/shared/*"],
      "@/infrastructure/*": ["src/infrastructure/*"]
    }
  }
}
```

### Update Imports

**Old**:
```javascript
import { createBooking } from '../../utils/firestore';
import { Button } from '../components/ui/button';
```

**New**:
```javascript
import { bookingService } from '@/domains/booking';
import { Button } from '@/shared/components/ui/button';
```

## Testing After Migration

### 1. Test Domain Logic

```javascript
import { Booking } from '@/domains/booking';

describe('Booking Entity', () => {
  it('should allow cancellation when pending', () => {
    const booking = new Booking({ status: 'pending' });
    expect(booking.canBeCancelled()).toBe(true);
  });
});
```

### 2. Test Hooks

```javascript
import { renderHook } from '@testing-library/react-hooks';
import { useBookings } from './useBookings';

describe('useBookings', () => {
  it('should fetch user bookings', async () => {
    const { result, waitFor } = renderHook(() => useBookings('user123'));
    await waitFor(() => result.current.isSuccess);
    expect(result.current.data).toBeDefined();
  });
});
```

### 3. Test Components

```javascript
import { render, screen } from '@testing-library/react';
import { BookingCard } from './BookingCard';

describe('BookingCard', () => {
  it('should show cancel button for pending bookings', () => {
    const booking = { status: 'pending', canBeCancelled: () => true };
    render(<BookingCard booking={booking} onCancel={jest.fn()} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });
});
```

## Rollback Plan

If migration causes issues:

1. Keep old code in place during migration
2. Use feature flags to toggle new/old code
3. Monitor errors closely
4. Have a rollback commit ready

```javascript
import { OLD_ARCHITECTURE } from '@/shared/constants/featureFlags';

export const MyBookings = () => {
  if (OLD_ARCHITECTURE) {
    return <OldMyBookings />;
  }
  return <NewMyBookings />;
};
```

## Migration Priority

### High Priority (Migrate First)
1. Core features (bookings, adventures)
2. Features with complex logic
3. Features under active development

### Medium Priority
1. Admin features
2. Partner features
3. Analytics features

### Low Priority (Migrate Last)
1. Static pages
2. Rarely used features
3. Features scheduled for removal

## Tips

1. **Migrate incrementally**: One feature at a time
2. **Test thoroughly**: Don't break existing functionality
3. **Keep old code**: Until new code is proven stable
4. **Update documentation**: As you migrate
5. **Pair program**: Complex migrations benefit from collaboration
6. **Use TypeScript**: Catch errors early during migration
7. **Monitor production**: Watch for errors after deployment

## Getting Help

If you encounter issues:

1. Check `ARCHITECTURE.md` for patterns
2. Look at existing migrated features for examples
3. Ask in team chat
4. Review this guide
5. Create an issue in the project repo
