#!/bin/bash

echo "Starting full migration..."

# Move all booking components to shared or features
echo "Moving booking components..."
mkdir -p src/features/shared/booking-components

for file in src/components/booking/*.{jsx,js} 2>/dev/null; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    echo "  - Moving $filename"
    cp "$file" "src/features/shared/booking-components/$filename"
  fi
done

# Move auth components
echo "Moving auth components..."
mkdir -p src/features/auth/components
cp -r src/components/auth/* src/features/auth/components/ 2>/dev/null || echo "  - Auth components not found or already moved"

# Move admin components  
echo "Moving admin components..."
mkdir -p src/features/admin/components
cp -r src/components/admin/* src/features/admin/components/ 2>/dev/null || echo "  - Admin components not found"

# Move host components
echo "Moving host components..."
mkdir -p src/features/host/components
cp -r src/components/host/* src/features/host/components/ 2>/dev/null || echo "  - Host components not found"

# Move partner components
echo "Moving partner components..."
mkdir -p src/features/partner/components
cp -r src/components/partner/* src/features/partner/components/ 2>/dev/null || echo "  - Partner components not found"

# Move user components
echo "Moving user components..."
mkdir -p src/features/traveler/components
cp -r src/components/user/* src/features/traveler/components/ 2>/dev/null || echo "  - User components not found"

# Move adventures components
echo "Moving adventure components..."
mkdir -p src/features/traveler/adventures/components
cp -r src/components/adventures/* src/features/traveler/adventures/components/ 2>/dev/null || echo "  - Adventure components not found"

# Move review components
echo "Moving review components..."
mkdir -p src/features/traveler/reviews/components  
cp -r src/components/reviews/* src/features/traveler/reviews/components/ 2>/dev/null || echo "  - Review components not found"

# Move chat components
echo "Moving chat components..."
mkdir -p src/features/shared/chat
cp -r src/components/chat/* src/features/shared/chat/ 2>/dev/null || echo "  - Chat components not found"

# Move forum components
echo "Moving forum components..."
mkdir -p src/features/shared/forum
cp -r src/components/forum/* src/features/shared/forum/ 2>/dev/null || echo "  - Forum components not found"

# Move common components to shared
echo "Moving common components to shared..."
cp -r src/components/common/* src/shared/components/ 2>/dev/null || echo "  - Common components not found"

# Move forms to shared
echo "Moving form components to shared..."
mkdir -p src/shared/components/forms
cp -r src/components/forms/* src/shared/components/forms/ 2>/dev/null || echo "  - Form components not found"

echo "Migration script completed!"
