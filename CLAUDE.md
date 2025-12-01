# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev          # Start development server (http://localhost:3000)
pnpm build        # Production build
pnpm start        # Start production server

# Code Quality
pnpm lint         # Run ESLint on .ts/.tsx files
pnpm type-check   # TypeScript type checking without emitting
pnpm validate     # Run lint, type-check, and build sequentially

# Database (Drizzle ORM with Neon)
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations
pnpm db:push      # Push schema changes directly
pnpm db:studio    # Open Drizzle Studio
```

## Tech Stack

- **Framework**: Next.js 16 with App Router (React 19)
- **Database**: Drizzle ORM with Neon (serverless PostgreSQL)
- **Auth**: Cookie-based OAuth via backend (Google, Kakao, Naver)
- **Styling**: Tailwind CSS v4 with tw-animate-css
- **State**: Zustand (persisted auth, in-memory storybooks)
- **Data Fetching**: TanStack React Query
- **Forms**: React Hook Form with Zod validation (@hookform/resolvers)
- **Animations**: Framer Motion
- **UI Components**: Radix UI primitives with shadcn/ui patterns

## Architecture

### Route Groups
- `(auth)/` - Public routes (login page)
- `(main)/` - Protected routes wrapped with `AuthGuard` and `AppLayout`
- `/auth/callback` - OAuth callback handler

### Authentication Flow
- Backend handles OAuth at `BACKEND_ORIGIN/oauth2/authorization/{provider}`
- Frontend uses cookie-based sessions with automatic token refresh
- `AuthGuard` component bootstraps session and redirects unauthenticated users
- Guest mode allows limited access to `/library` page only

### State Management (Zustand)
- `useAuthStore` - Auth state with localStorage persistence
- `useStorybooksStore` - Storybook data and viewer modal state
- Import stores from `@/store` barrel export

### API Layer (`src/lib/api.ts`)
- `apiFetch()` - Wrapper with automatic 401 handling and token refresh
- `authApi` - Auth-specific endpoints (login, logout, profile, session bootstrap)
- `API_BASE` configured via `NEXT_PUBLIC_API_BASE` env var (default: `http://localhost:8080/api`)

### Layout Structure
- `AppLayout` wraps main content with responsive sidebar/bottom nav
- `Sidebar` - Desktop navigation (left side)
- `BottomNav` - Mobile navigation (bottom)
- `StoryBookViewerPage` - Modal overlay controlled via Zustand store

## Code Conventions

- Path alias: `@/*` maps to `./src/*`
- Use `cn()` from `@/lib/utils` for conditional className merging
- TypeScript strict mode is enabled
- UI components in `src/components/ui/` follow shadcn/ui patterns with CVA for variants
