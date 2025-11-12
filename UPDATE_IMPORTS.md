# Import Update Guide

## Automated Import Updates

Run these commands to update imports across your codebase:

```bash
cd /Users/mosleh.alnakib@new10.com/Desktop/sawa-explorer

# Update UI component imports
find src -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' 's|@/components/ui/|@/shared/components/ui/|g' {} +

# Update lib/utils imports
find src -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' 's|@/lib/utils|@/shared/utils|g' {} +

# Update AuthContext imports
find src -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' 's|@/contexts/AuthContext|@/app/providers/AuthProvider|g' {} +
find src -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' 's|../contexts/AuthContext|@/app/providers/AuthProvider|g' {} +
find src -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' 's|../../contexts/AuthContext|@/app/providers/AuthProvider|g' {} +

# Update firestore utils imports (for files still using old pattern)
find src -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' 's|@/utils/firestore|@/infrastructure/firebase|g' {} +

# Update hooks imports
find src -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' 's|@/hooks/use-mobile|@/shared/hooks/use-mobile|g' {} +

# Update common component imports
find src -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' 's|@/components/common/|@/shared/components/|g' {} +

# Update form component imports
find src -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' 's|@/components/forms/|@/shared/components/forms/|g' {} +
```

## Manual Updates Needed

### Booking Components
Old: `@/components/booking/BookingCard`
New: `@/features/shared/booking-components/BookingCard`

### Auth Components
Old: `@/components/auth/LoginForm`
New: `@/features/auth/components/LoginForm`

### Admin Components
Old: `@/components/admin/UserTable`
New: `@/features/admin/components/UserTable`

### Host Components
Old: `@/components/host/HostDashboard`
New: `@/features/host/components/HostDashboard`

### Partner Components
Old: `@/components/partner/PartnerDashboard`
New: `@/features/partner/components/PartnerDashboard`

### User/Traveler Components
Old: `@/components/user/UserProfile`
New: `@/features/traveler/components/UserProfile`

### Adventure Components
Old: `@/components/adventures/AdventureCard`
New: `@/features/traveler/adventures/components/AdventureCard`

### Review Components
Old: `@/components/reviews/ReviewCard`
New: `@/features/traveler/reviews/components/ReviewCard`

### Chat Components
Old: `@/components/chat/ChatWindow`
New: `@/features/shared/chat/ChatWindow`

### Forum Components
Old: `@/components/forum/ForumPost`
New: `@/features/shared/forum/ForumPost`
