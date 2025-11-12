# Sawa Explorer - Hybrid Architecture Guide

## Architecture Overview

This project uses a **Hybrid Domain-Driven + Feature-Based Architecture** that combines the best of both approaches:

- **Domains**: Core business logic and rules (framework-agnostic)
- **Features**: UI features organized by user role (React-specific)
- **Shared**: Reusable components, hooks, and utilities
- **Infrastructure**: External service integrations (Firebase, APIs)

## Directory Structure

```
src/
├── domains/                        # Business logic layer
│   ├── booking/
│   │   ├── entities/              # Business entities
│   │   │   └── Booking.js
│   │   ├── repositories/          # Data access layer
│   │   │   └── bookingRepository.js
│   │   ├── services/              # Business logic
│   │   │   └── bookingService.js
│   │   ├── use-cases/             # Application use cases
│   │   │   ├── createBooking.js
│   │   │   ├── cancelBooking.js
│   │   │   └── getBookingStats.js
│   │   └── index.js               # Public API
│   │
│   ├── user/
│   ├── adventure/
│   └── payment/
│
├── features/                       # UI features by role
│   ├── admin/
│   │   ├── booking-oversight/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── pages/
│   │   │   └── index.js
│   │   ├── user-management/
│   │   └── analytics/
│   │
│   ├── host/
│   │   ├── dashboard/
│   │   ├── adventure-management/
│   │   └── bookings/
│   │
│   ├── partner/
│   │   ├── dashboard/
│   │   ├── host-registration/
│   │   └── requests/
│   │
│   └── traveler/
│       ├── bookings/
│       ├── adventures/
│       └── reviews/
│
├── shared/                         # Shared across all features
│   ├── components/
│   │   └── ui/                    # Shadcn/Radix components
│   ├── hooks/
│   ├── layouts/
│   ├── constants/
│   └── types/
│
├── infrastructure/                 # External services
│   ├── firebase/
│   │   ├── firebaseRepository.js
│   │   └── index.js
│   └── api/
│
├── app/                           # Application setup
│   ├── routes/
│   └── providers/
│
├── components/                    # Legacy (to be migrated)
├── pages/                         # Legacy (to be migrated)
└── utils/                         # Legacy (to be migrated)
```

## Layer Responsibilities

### 1. Infrastructure Layer

The infrastructure layer handles all external service integrations.

**Purpose**: Abstract away external dependencies

**Example**: `infrastructure/firebase/firebaseRepository.js`

```javascript
import { FirebaseRepository } from '@/infrastructure/firebase';

class BookingRepository extends FirebaseRepository {
  constructor() {
    super('bookings');
  }
}
```

**Rules**:
- No business logic
- Only technical operations (CRUD)
- Framework-specific code allowed

### 2. Domain Layer

The domain layer contains your core business logic.

**Purpose**: Implement business rules independent of UI or framework

**Structure**:
- **Entities**: Business objects with behavior
- **Repositories**: Data access interfaces
- **Services**: Business logic operations
- **Use Cases**: Application-specific workflows

**Example**: `domains/booking/entities/Booking.js`

```javascript
export class Booking {
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
}
```

**Rules**:
- Framework-agnostic (no React, no Firebase imports)
- Pure business logic
- Well-tested
- Self-contained

### 3. Feature Layer

Features are organized by user role and contain UI-specific code.

**Purpose**: Implement user-facing features

**Structure**:
- **Components**: UI components
- **Hooks**: React hooks for data fetching
- **Pages**: Page-level components
- **index.js**: Public API exports

**Example**: `features/traveler/bookings/hooks/useBookings.js`

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

**Rules**:
- React-specific code
- Uses domains for business logic
- Contains UI state management
- Role-specific features

### 4. Shared Layer

Shared code used across multiple features.

**Purpose**: Avoid duplication

**Contains**:
- UI components (buttons, cards, etc.)
- Common hooks (useDebounce, useToast)
- Layouts
- Constants
- Types

**Rules**:
- Must be truly reusable
- No feature-specific logic
- Well-documented

## Code Examples

### Creating a New Feature

**Step 1: Define the domain entity**

```javascript
export class Adventure {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.hostId = data.host_id;
    this.price = data.price;
    this.isActive = data.is_active;
  }

  activate() {
    this.isActive = true;
    return this;
  }

  deactivate() {
    this.isActive = false;
    return this;
  }
}
```

**Step 2: Create repository**

```javascript
import { FirebaseRepository } from '@/infrastructure/firebase';
import { Adventure } from '../entities/Adventure';

class AdventureRepository extends FirebaseRepository {
  constructor() {
    super('adventures');
  }

  async findByHostId(hostId) {
    return this.filter({ host_id: hostId });
  }
}

export const adventureRepository = new AdventureRepository();
```

**Step 3: Create service**

```javascript
import { adventureRepository } from '../repositories/adventureRepository';

export const adventureService = {
  async getHostAdventures(hostId) {
    return adventureRepository.findByHostId(hostId);
  },

  async activateAdventure(id) {
    const adventure = await adventureRepository.getById(id);
    adventure.activate();
    return adventureRepository.update(id, { is_active: true });
  },
};
```

**Step 4: Create feature hook**

```javascript
import { useQuery } from '@tanstack/react-query';
import { adventureService } from '@/domains/adventure';

export const useHostAdventures = (hostId) => {
  return useQuery({
    queryKey: ['adventures', 'host', hostId],
    queryFn: () => adventureService.getHostAdventures(hostId),
    enabled: !!hostId,
  });
};
```

**Step 5: Create feature component**

```javascript
import { useHostAdventures } from '../hooks';

export const HostAdventuresList = ({ hostId }) => {
  const { data: adventures, isLoading } = useHostAdventures(hostId);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {adventures.map((adventure) => (
        <AdventureCard key={adventure.id} adventure={adventure} />
      ))}
    </div>
  );
};
```

## Data Flow

```
User Action
    ↓
Component
    ↓
Feature Hook (useBookings)
    ↓
Domain Service (bookingService)
    ↓
Repository (bookingRepository)
    ↓
Infrastructure (FirebaseRepository)
    ↓
Firebase/Firestore
```

## Import Rules

### Good Imports

```javascript
import { bookingService } from '@/domains/booking';
import { Button } from '@/shared/components/ui/button';
import { useAuth } from '@/app/providers/AuthProvider';
import { FirebaseRepository } from '@/infrastructure/firebase';
```

### Bad Imports

```javascript
import { db } from '@/config/firebase';
import { addDoc } from 'firebase/firestore';
```

**Rule**: Features and domains should NEVER import Firebase directly. Use repositories.

## Migration Strategy

### Phase 1: New Features (Current)
- All new features use the new architecture
- Existing features remain unchanged

### Phase 2: Incremental Migration
- Migrate one feature at a time
- Start with smallest features
- Update imports as you go

### Phase 3: Cleanup
- Remove old code
- Update all imports
- Remove legacy folders

## Testing Strategy

### Unit Tests (Domains)

```javascript
import { Booking } from './Booking';

describe('Booking', () => {
  it('should allow cancellation of pending bookings', () => {
    const booking = new Booking({ status: 'pending' });
    expect(booking.canBeCancelled()).toBe(true);
  });

  it('should throw error when cancelling completed bookings', () => {
    const booking = new Booking({ status: 'completed' });
    expect(() => booking.cancel()).toThrow();
  });
});
```

### Integration Tests (Features)

```javascript
import { renderHook } from '@testing-library/react-hooks';
import { useBookings } from './useBookings';

describe('useBookings', () => {
  it('should fetch user bookings', async () => {
    const { result, waitFor } = renderHook(() => useBookings('user123'));
    await waitFor(() => result.current.isSuccess);
    expect(result.current.data).toHaveLength(3);
  });
});
```

## Benefits of This Architecture

1. **Separation of Concerns**: Business logic separated from UI
2. **Testability**: Easy to test domains without UI
3. **Scalability**: Easy to add new features per role
4. **Maintainability**: Clear structure and responsibilities
5. **Reusability**: Share domains across features
6. **Team Collaboration**: Different teams can own different features
7. **Type Safety**: Better TypeScript support
8. **Code Discovery**: Easy to find related code

## Common Patterns

### Pattern 1: Feature Sharing Components

```javascript
import { BookingCard } from '@/features/traveler/bookings';

export const AdminBookingsList = () => {
  const { data: bookings } = useAllBookings();

  return (
    <div>
      {bookings.map(booking => (
        <BookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  );
};
```

### Pattern 2: Cross-Domain Operations

```javascript
import { bookingService } from '@/domains/booking';
import { notificationService } from '@/domains/notification';

export const confirmBookingUseCase = async (bookingId) => {
  const booking = await bookingService.confirmBooking(bookingId);

  await notificationService.sendEmail({
    to: booking.travelerEmail,
    subject: 'Booking Confirmed',
    body: `Your booking #${booking.id} has been confirmed!`,
  });

  return booking;
};
```

### Pattern 3: Optimistic Updates

```javascript
export const useConfirmBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bookingService.confirmBooking,
    onMutate: async (bookingId) => {
      await queryClient.cancelQueries(['bookings']);

      const previousBookings = queryClient.getQueryData(['bookings']);

      queryClient.setQueryData(['bookings'], (old) =>
        old.map((b) =>
          b.id === bookingId ? { ...b, status: 'confirmed' } : b
        )
      );

      return { previousBookings };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['bookings'], context.previousBookings);
    },
  });
};
```

## FAQ

**Q: Where should I put API calls?**
A: In the infrastructure layer (repositories).

**Q: Can features import from other features?**
A: Yes, but only from their public API (index.js). Avoid tight coupling.

**Q: Where do I put form validation?**
A: Complex validation goes in domains. Simple UI validation can stay in features.

**Q: Should I always create a use-case?**
A: Only for complex workflows involving multiple services.

**Q: What about existing code?**
A: Leave it as-is and migrate incrementally. New features use the new architecture.

## Next Steps

1. Create additional domains (user, adventure, payment, review)
2. Migrate existing features one by one
3. Add comprehensive tests for domains
4. Document each domain's business rules
5. Set up Storybook for shared components
6. Add TypeScript for better type safety
