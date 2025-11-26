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
- **Auth**: better-auth
- **Styling**: Tailwind CSS v4 with tw-animate-css
- **State**: Zustand
- **Data Fetching**: TanStack React Query
- **Forms**: React Hook Form with Zod validation (@hookform/resolvers)
- **Animations**: Framer Motion
- **UI Utilities**: class-variance-authority, clsx, tailwind-merge, lucide-react

## Project Structure

```
src/
├── app/           # Next.js App Router pages and layouts
├── lib/
│   └── utils.ts   # Utility functions (cn for className merging)
```

## Code Conventions

- Path alias: `@/*` maps to `./src/*`
- Use `cn()` from `@/lib/utils` for conditional className merging
- TypeScript strict mode is enabled
