# Quick Start After Migration

## 🚀 Start Development

```bash
npm run dev
```

## 🔍 If You See Import Errors

Run these commands to fix any remaining component imports:

```bash
# Fix booking components
find src -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' 's|@/components/booking/|@/features/shared/booking-components/|g' {} +

# Fix auth components
find src -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' 's|@/components/auth/|@/features/auth/components/|g' {} +

# Fix admin components
find src -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' 's|@/components/admin/|@/features/admin/components/|g' {} +

# Fix host components
find src -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' 's|@/components/host/|@/features/host/components/|g' {} +

# Fix partner components
find src -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' 's|@/components/partner/|@/features/partner/components/|g' {} +

# Fix user/traveler components
find src -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' 's|@/components/user/|@/features/traveler/components/|g' {} +

# Fix adventure components
find src -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' 's|@/components/adventures/|@/features/traveler/adventures/components/|g' {} +

# Fix review components
find src -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' 's|@/components/reviews/|@/features/traveler/reviews/components/|g' {} +

# Fix chat components
find src -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' 's|@/components/chat/|@/features/shared/chat/|g' {} +

# Fix forum components
find src -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i '' 's|@/components/forum/|@/features/shared/forum/|g' {} +
```

## 📚 New Import Patterns

```javascript
// UI Components
import { Button } from '@/shared/components/ui/button';

// Business Logic
import { bookingService } from '@/domains/booking';
import { useBookings } from '@/features/traveler/bookings';

// Utils
import { cn } from '@/shared/utils';
```

## 📖 Read These Docs

1. `MIGRATION_COMPLETED_FINAL.md` - Full migration summary
2. `ARCHITECTURE.md` - Architecture guide
3. `QUICK_REFERENCE.md` - Code snippets

## ✅ What Changed

- All components moved to `src/features/` or `src/shared/`
- Business logic in `src/domains/`
- Infrastructure in `src/infrastructure/`
- Old `src/components/` directory deleted
- All imports automatically updated

## 🐛 Troubleshooting

**Error: Cannot find module '@/components/...'**
→ Run the import fix commands above

**Error: Component not found**
→ Check `MIGRATION_COMPLETED_FINAL.md` for new locations

**Build errors**
→ Clear node_modules and reinstall: `rm -rf node_modules && npm install`
