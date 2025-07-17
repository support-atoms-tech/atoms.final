# Technology Stack

## Core Framework
- **Next.js 15.3.1** - React framework with App Router
- **React 19.1.0** - UI library with React Compiler enabled
- **TypeScript 5.8.3** - Type-safe JavaScript

## Database & Backend
- **Supabase** - PostgreSQL database with real-time subscriptions
- **@supabase/ssr** - Server-side rendering support
- **@tanstack/react-query** - Data fetching and caching

## UI & Styling
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **shadcn/ui** - Component library (New York style)
- **Radix UI** - Headless UI primitives
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

## State Management
- **Zustand 5.0.3** - Lightweight state management
- **Immer 10.1.1** - Immutable state updates

## Rich Text & Data Visualization
- **TipTap** - Rich text editor
- **ReactFlow** - Interactive node-based diagrams
- **Excalidraw** - Drawing and diagramming
- **@glideapps/glide-data-grid** - High-performance data grid

## Development Tools
- **ESLint** - Code linting with Next.js config
- **Prettier** - Code formatting with import sorting
- **Husky** - Git hooks for pre-commit/pre-push
- **Jest** - Testing framework
- **TypeScript** - Static type checking

## Package Manager
- **Yarn 4.5.1** - Package management (preferred)
- **Bun** - Alternative runtime (supported)

## Common Commands

### Development
```bash
yarn dev          # Start development server
yarn dev:clean    # Clean .next and start dev
yarn dev:reset    # Full reset (node_modules cache + .next)
yarn clean:all    # Complete cleanup and reinstall
```

### Build & Deploy
```bash
yarn build        # Production build
yarn start        # Start production server
```

### Code Quality
```bash
yarn lint         # Run ESLint
yarn format       # Format code with Prettier
yarn format:check # Check formatting
yarn type-check   # TypeScript type checking
```

### Testing
```bash
yarn test         # Run tests
yarn test:watch   # Run tests in watch mode
```

## Code Style Rules
- **Indentation**: 4 spaces (not tabs)
- **Quotes**: Single quotes preferred
- **Semicolons**: Required
- **Import Order**: Third-party → @/ imports → relative imports
- **No relative imports**: Use @/ alias instead of ../
- **Unused variables**: Prefix with _ to ignore