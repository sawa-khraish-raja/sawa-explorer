sawa-explorer/
│
├─ src/
│ ├─ app/
│ │ ├─ App.tsx / main.tsx
│ │ ├─ providers/ (AppProvider, LanguageProvider, Query client, etc.)
│ │ └─ router/
│ │ ├─ index.tsx (composes feature route modules)
│ │ ├─ admin.routes.tsx
│ │ ├─ marketing.routes.tsx
│ │ └─ public.routes.tsx
│ │
│ ├─ shared/
│ │ ├─ ui/ (shadcn primitives, theme tokens)
│ │ ├─ lib/ (utils, formatters, text helpers)
│ │ ├─ hooks/ (generic hooks like useIsMobile)
│ │ ├─ config/ (feature flags, react-query defaults, GA)
│ │ ├─ i18n/ (LanguageContext, messages)
│ │ └─ styles/ (global CSS, Tailwind layer overrides)
│ │
│ ├─ entities/
│ │ ├─ client.ts (Base44 client init)
│ │ ├─ functions.ts (safe wrappers for cloud functions)
│ │ ├─ models/ (shared types/interfaces)
│ │ └─ index.ts (public barrel exports)
│ │
│ ├─ features/
│ │ ├─ booking/
│ │ │ ├─ pages/ (BookingDamascus, BookingAmman, etc.)
│ │ │ ├─ components/ (BookingPageTemplate, SimpleBookingForm)
│ │ │ ├─ hooks/ (useCityEvents, useHostList)
│ │ │ ├─ api/ (calls built on entities)
│ │ │ └─ constants.ts
│ │ ├─ chat/
│ │ ├─ notifications/
│ │ ├─ admin/
│ │ ├─ marketing/
│ │ ├─ forum/
│ │
│ │
│ ├─ assets/ (images, videos, svgs)
│ └─ index.css / tailwind setup
│
├─ server/
│ ├─ config/ (firebase.js, env helpers)
│ ├─ routes/
│ ├─ controllers/
│ ├─ services/ (Firestore access helpers)
│ ├─ middleware/
│ └─ index.js
│
├─ tests/ (mirrors feature slices for unit/e2e)
└─ docs/ (setup, env, API usage)
