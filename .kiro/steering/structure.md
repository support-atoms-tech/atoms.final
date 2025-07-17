# Project Structure

## Root Directory
```
atoms.tech/
├── .cursor/           # Cursor IDE configuration
├── .github/           # GitHub workflows and templates
├── .husky/            # Git hooks configuration
├── .kiro/             # Kiro AI assistant configuration
├── .next/             # Next.js build output (generated)
├── N8N/               # N8N workflow definitions
├── node_modules/      # Dependencies (generated)
├── public/            # Static assets
├── scripts/           # Build and utility scripts
├── src/               # Source code (main application)
├── supabase/          # Database migrations and config
└── package.json       # Project dependencies and scripts
```

## Source Code Organization (`src/`)
```
src/
├── app/               # Next.js App Router pages
│   ├── (auth)/        # Authentication routes
│   ├── (protected)/   # Protected/authenticated routes
│   ├── (public)/      # Public routes
│   └── test/          # Test pages
├── components/        # React components
│   ├── base/          # Base/primitive components
│   ├── custom/        # Custom business components
│   ├── ui/            # shadcn/ui components
│   └── views/         # Page-level view components
├── hooks/             # Custom React hooks
│   ├── mutations/     # Data mutation hooks
│   └── queries/       # Data fetching hooks
├── lib/               # Utility libraries and configurations
│   ├── api/           # API client configurations
│   ├── auth/          # Authentication logic
│   ├── constants/     # Application constants
│   ├── db/            # Database utilities
│   ├── providers/     # React context providers
│   ├── services/      # Business logic services
│   ├── supabase/      # Supabase client configuration
│   └── utils/         # General utilities
├── store/             # Zustand state stores
├── styles/            # Global styles and CSS
├── types/             # TypeScript type definitions
│   ├── base/          # Base type definitions
│   └── validation/    # Zod validation schemas
├── utils/             # Utility functions
├── __tests__/         # Test files
└── middleware.ts      # Next.js middleware
```

## Key Conventions

### File Naming
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Types**: PascalCase (e.g., `UserType.ts`)
- **Stores**: camelCase with `.store.ts` suffix

### Import Aliases
- `@/` - Points to `src/` directory
- Use absolute imports with `@/` instead of relative paths
- Example: `import { Button } from '@/components/ui/button'`

### Component Organization
- **ui/**: shadcn/ui components (auto-generated)
- **base/**: Reusable primitive components
- **custom/**: Business-specific components
- **views/**: Page-level components that compose other components

### State Management
- Global state in `src/store/` using Zustand
- Each store handles a specific domain (e.g., `document.store.ts`, `project.store.ts`)
- Use Immer for immutable updates

### API Integration
- Supabase client in `src/lib/supabase/`
- React Query hooks in `src/hooks/queries/` and `src/hooks/mutations/`
- API utilities in `src/lib/api/`

### Testing
- Test files in `src/__tests__/`
- Use `.test.ts` or `.test.tsx` extensions
- Jest configuration in `jest.config.mjs`

## Special Directories

### N8N Workflows
- Contains automation workflow definitions
- JSON format for N8N workflow engine
- Handles project analysis and document processing

### Public Assets
- Static files served directly
- Images, icons, and other media
- Accessible via `/filename.ext` URLs

### Supabase
- Database migration files
- Schema definitions and updates
- Currently empty but ready for migrations