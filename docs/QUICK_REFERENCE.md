# Quick Reference Guide

## Project Structure Cheat Sheet

```
src/
├── domains/           # Business logic (no React, no Firebase)
├── features/          # UI features by role (React components)
├── shared/            # Reusable across features
├── infrastructure/    # External services (Firebase, APIs)
└── app/              # App setup (routes, providers)
```

## When to Put Code Where

| Code Type | Location | Example |
|-----------|----------|---------|
| Business entity | `domains/{domain}/entities/` | `Booking`, `User`, `Adventure` |
| Data access | `domains/{domain}/repositories/` | `bookingRepository.findByUserId()` |
| Business logic | `domains/{domain}/services/` | `bookingService.createBooking()` |
| Complex workflow | `domains/{domain}/use-cases/` | `createBookingUseCase()` |
| React hooks | `features/{role}/{feature}/hooks/` | `useBookings()`, `useCancelBooking()` |
| UI components | `features/{role}/{feature}/components/` | `BookingCard`, `BookingList` |
| Pages | `features/{role}/{feature}/pages/` | `MyBookings`, `AdminBookingsPage` |
| Shared UI | `shared/components/ui/` | `Button`, `Card`, `Dialog` |
| Common hooks | `shared/hooks/` | `useDebounce`, `useToast` |
| Layouts | `shared/layouts/` | `MainLayout`, `AdminLayout` |
| Constants | `shared/constants/` | `CITIES`, `ROLES`, `ROUTES` |
| Firebase code | `infrastructure/firebase/` | `FirebaseRepository` |

## Common Commands

### Create New Domain

```bash
mkdir -p src/domains/{domain-name}/{entities,repositories,services,use-cases}
touch src/domains/{domain-name}/index.js
```

### Create New Feature

```bash
mkdir -p src/features/{role}/{feature-name}/{components,hooks,pages}
touch src/features/{role}/{feature-name}/index.js
```

## Import Patterns

### Good Imports ✅

```javascript
import { bookingService } from '@/domains/booking';
import { Button } from '@/shared/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/features/traveler/bookings';
```

### Bad Imports ❌

```javascript
import { db } from '@/config/firebase';
import { addDoc } from 'firebase/firestore';
import '../../../components/booking/BookingCard';
```

## Code Snippets

### Domain Entity Template

```javascript
export class EntityName {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.status = data.status;
  }

  static fromFirestore(data) {
    return new EntityName(data);
  }

  toFirestore() {
    return {
      name: this.name,
      status: this.status,
    };
  }

  isActive() {
    return this.status === 'active';
  }
}
```

### Repository Template

```javascript
import { FirebaseRepository } from '@/infrastructure/firebase';
import { EntityName } from '../entities/EntityName';

class EntityRepository extends FirebaseRepository {
  constructor() {
    super('collection-name');
  }

  normalizeDocument(docSnap) {
    const data = super.normalizeDocument(docSnap);
    return data ? EntityName.fromFirestore(data) : null;
  }

  async findByCustomField(value) {
    return this.filter({ custom_field: value });
  }
}

export const entityRepository = new EntityRepository();
```

### Service Template

```javascript
import { entityRepository } from '../repositories/entityRepository';

export const entityService = {
  async getById(id) {
    return entityRepository.getById(id);
  },

  async create(data) {
    if (!data.name) {
      throw new Error('Name is required');
    }
    return entityRepository.create(data);
  },

  async update(id, updates) {
    const entity = await entityRepository.getById(id);
    if (!entity) {
      throw new Error('Entity not found');
    }
    return entityRepository.update(id, updates);
  },
};
```

### Custom Hook Template

```javascript
import { useQuery } from '@tanstack/react-query';
import { entityService } from '@/domains/entity';

export const useEntity = (id) => {
  return useQuery({
    queryKey: ['entity', id],
    queryFn: () => entityService.getById(id),
    enabled: !!id,
  });
};
```

### Mutation Hook Template

```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { entityService } from '@/domains/entity';
import { toast } from 'sonner';

export const useCreateEntity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: entityService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      toast.success('Entity created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create entity');
    },
  });
};
```

### Component Template

```javascript
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';

export const EntityCard = ({ entity, onAction }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{entity.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{entity.description}</p>
        <Button onClick={() => onAction(entity.id)}>
          Action
        </Button>
      </CardContent>
    </Card>
  );
};
```

### Page Template

```javascript
import { useEntity } from '../hooks';
import { EntityCard } from '../components';

export const EntityPage = () => {
  const { data: entities, isLoading } = useEntities();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Entities</h1>
      <div className="grid grid-cols-3 gap-4">
        {entities.map((entity) => (
          <EntityCard key={entity.id} entity={entity} />
        ))}
      </div>
    </div>
  );
};
```

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Domain folder | lowercase | `booking`, `user`, `adventure` |
| Entity class | PascalCase | `Booking`, `User`, `Adventure` |
| Repository | camelCase + "Repository" | `bookingRepository`, `userRepository` |
| Service | camelCase + "Service" | `bookingService`, `userService` |
| Use case | camelCase + "UseCase" | `createBookingUseCase` |
| Hook | camelCase + "use" prefix | `useBookings`, `useCreateBooking` |
| Component | PascalCase | `BookingCard`, `BookingList` |
| Page | PascalCase + "Page" suffix | `MyBookings`, `AdminBookingsPage` |

## File Organization

### Domain Module

```
domains/booking/
├── entities/
│   └── Booking.js              # Business entity
├── repositories/
│   └── bookingRepository.js    # Data access
├── services/
│   └── bookingService.js       # Business logic
├── use-cases/
│   ├── createBooking.js        # Create workflow
│   ├── cancelBooking.js        # Cancel workflow
│   └── getBookingStats.js      # Stats calculation
└── index.js                    # Public API
```

### Feature Module

```
features/traveler/bookings/
├── components/
│   ├── BookingCard.jsx
│   ├── BookingList.jsx
│   └── index.js
├── hooks/
│   ├── useBookings.js
│   ├── useCreateBooking.js
│   ├── useCancelBooking.js
│   └── index.js
├── pages/
│   └── MyBookings.jsx
└── index.js                    # Public API
```

## Public API Pattern

Always export through `index.js`:

```javascript
export { Booking, BookingStatus } from './entities/Booking';
export { bookingRepository } from './repositories/bookingRepository';
export { bookingService } from './services/bookingService';
export { createBookingUseCase } from './use-cases/createBooking';
```

Then import like:

```javascript
import { bookingService, BookingStatus } from '@/domains/booking';
```

## React Query Best Practices

### Query Keys Structure

```javascript
['bookings']                          // All bookings
['bookings', 'user', userId]          // User's bookings
['bookings', 'host', hostId]          // Host's bookings
['bookings', 'admin', 'all']          // Admin view
['bookings', 'stats']                 // Statistics
```

### Invalidation

```javascript
queryClient.invalidateQueries({ queryKey: ['bookings'] });
```

### Optimistic Updates

```javascript
onMutate: async (newData) => {
  await queryClient.cancelQueries(['bookings']);
  const previous = queryClient.getQueryData(['bookings']);
  queryClient.setQueryData(['bookings'], (old) => [...old, newData]);
  return { previous };
},
onError: (err, newData, context) => {
  queryClient.setQueryData(['bookings'], context.previous);
},
```

## Error Handling

### Domain Layer

```javascript
export const bookingService = {
  async createBooking(data) {
    if (!data.traveler_email) {
      throw new Error('Traveler email is required');
    }

    if (!data.city_id) {
      throw new Error('City is required');
    }

    return bookingRepository.create(data);
  },
};
```

### Feature Layer

```javascript
export const useCreateBooking = () => {
  return useMutation({
    mutationFn: bookingService.createBooking,
    onError: (error) => {
      toast.error(error.message || 'Failed to create booking');
    },
  });
};
```

## Testing Quick Reference

### Test Domain

```javascript
import { Booking } from './Booking';

describe('Booking', () => {
  it('should...', () => {
    const booking = new Booking({ status: 'pending' });
    expect(booking.canBeCancelled()).toBe(true);
  });
});
```

### Test Hook

```javascript
import { renderHook } from '@testing-library/react-hooks';
import { useBookings } from './useBookings';

test('useBookings', async () => {
  const { result, waitFor } = renderHook(() => useBookings('user123'));
  await waitFor(() => result.current.isSuccess);
  expect(result.current.data).toBeDefined();
});
```

### Test Component

```javascript
import { render, screen } from '@testing-library/react';
import { BookingCard } from './BookingCard';

test('BookingCard', () => {
  const booking = { id: '1', cityName: 'Damascus' };
  render(<BookingCard booking={booking} />);
  expect(screen.getByText('Damascus')).toBeInTheDocument();
});
```

## Common Pitfalls

1. Don't import Firebase directly in domains or features
2. Don't put business logic in components
3. Don't create circular dependencies between features
4. Don't forget to export from index.js
5. Don't skip React Query for data fetching
6. Don't hardcode values, use constants
7. Don't forget error handling

## Useful VSCode Snippets

Add to `.vscode/snippets.json`:

```json
{
  "Domain Entity": {
    "prefix": "entity",
    "body": [
      "export class ${1:EntityName} {",
      "  constructor(data) {",
      "    this.id = data.id;",
      "    this.${2:field} = data.${2:field};",
      "  }",
      "",
      "  static fromFirestore(data) {",
      "    return new ${1:EntityName}(data);",
      "  }",
      "",
      "  toFirestore() {",
      "    return {",
      "      ${2:field}: this.${2:field},",
      "    };",
      "  }",
      "}"
    ]
  }
}
```

## Getting Started Checklist

- [ ] Read ARCHITECTURE.md
- [ ] Review example code in domains/booking
- [ ] Review example code in features/traveler/bookings
- [ ] Try creating a simple feature
- [ ] Review MIGRATION_GUIDE.md
- [ ] Migrate one small feature
- [ ] Share learnings with team
