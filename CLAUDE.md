# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lantern Library** is a library lending system built with a monorepo structure:
- **Backend**: NestJS API (port 3001) with PostgreSQL via Prisma
- **Frontend**: Next.js App Router UI (port 3000)

The system manages book catalogs, member accounts, loans, and overdue fines with business rules around lending periods by book category.

## Repository Structure

```
codemonday-t2/
├── backend/           # NestJS API server
│   ├── src/
│   │   ├── app.module.ts       # Root module with all domain imports
│   │   ├── main.ts             # Bootstrap entry point
│   │   ├── auth/               # Authentication (JWT, login/signup)
│   │   ├── books/              # Book catalog management
│   │   ├── members/            # Member accounts and profiles
│   │   ├── loans/              # Loan checkout, returns, fines
│   │   └── prisma/             # Database service layer
│   ├── prisma/
│   │   ├── schema.prisma       # Database models (Book, Member, Loan)
│   │   └── seed.ts             # Database seeding
│   └── package.json
├── frontend/          # Next.js UI
│   ├── app/
│   │   ├── layout.tsx          # Root layout with navigation
│   │   ├── page.tsx            # Home/dashboard
│   │   ├── catalog/            # Book browsing (/catalog, /catalog/[slug])
│   │   ├── loans/              # Member's active loans
│   │   └── members/            # Member registration/login
│   ├── components/             # Reusable UI components
│   └── lib/                    # Utilities (format helpers, API calls)
└── .gitignore
```

## Development Commands

### Backend (from `backend/` directory)

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run db:setup` | **First-time setup**: generate Prisma, push schema, seed data |
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:push` | Apply schema changes to the database |
| `npm run db:seed` | Populate database with seed data |
| `npm run start:dev` | Run API in watch mode (http://localhost:3001/api) |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

### Frontend (from `frontend/` directory)

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server (http://localhost:3000) |
| `npm run build` | Build for production |
| `npm start` | Run production server |
| `npm run typecheck` | Run TypeScript type checking |

### Environment Setup

**Backend** (`backend/.env`):
- Copy from `backend/.env.example`
- Key variables: `DATABASE_URL`, `JWT_SECRET`, `LIBRARIAN_PASSWORD`, `FRONTEND_ORIGIN`

**Frontend** (`frontend/.env.local`):
- Copy from `frontend/.env.example`
- Key variable: `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:3001/api`)

## Architecture

### Backend Module Organization

The NestJS app uses feature modules (each has controller, service, DTO, entity):

- **AuthModule**: JWT-based authentication, login, signup, role guards
- **BooksModule**: CRUD operations for book catalog, search by category
- **MembersModule**: Member signup, profile management
- **LoansModule**: Loan checkout/return logic, fine calculation, PDF report generation
- **PrismaModule**: Database service abstraction

All modules import `PrismaModule` to access the database service.

### Database Schema

Three main models:

**Book**: Catalog entries with `category` (textbook, general, novel) determining loan duration
- Relations: `loans` array (one-to-many with Loan)

**Member**: User accounts with `role` (member/librarian) and tier
- Relations: `loans` array

**Loan**: Tracks checkouts with calculated `dueDate` and optional `returnedAt`
- Lending periods by category: textbook (3 days), general (7 days), novel (14 days)
- Status: "borrowed" or "returned"
- Fine calculation: 20 THB per overdue weekday (excludes weekends)

### Frontend Pages

App Router structure using dynamic and static routes:
- `/` - Dashboard showing library stats
- `/catalog` - Book listing with filters by category
- `/catalog/[slug]` - Individual book detail page
- `/loans` - Member's loan history and active checkouts
- `/members` - Login/signup interface

## Lending Business Rules

These are enforced in `LoansModule`:

1. Book lending duration by category (3/7/14 days)
2. Max 3 active loans per member
3. Member with any overdue loan cannot borrow
4. Fines: 20 THB per overdue **weekday** (Sat/Sun excluded)
5. Same-day returns are free (no fine)
6. Librarians manage returns; members request via API

## Common Development Patterns

### Adding a New API Endpoint

1. Create/update DTO in `src/[module]/dto/`
2. Add method to `[module].service.ts`
3. Add route to `[module].controller.ts`
4. Use `@UseGuards(AuthGuard)` for protected routes, `@Roles('librarian')` for librarian-only

### Modifying the Database Schema

1. Edit `prisma/schema.prisma`
2. Run `npm run db:push` to apply changes
3. Prisma client regenerates automatically

### Frontend API Integration

Use `fetch` with `NEXT_PUBLIC_API_BASE_URL` from `lib/library-data.ts` for API calls. Examples:
```ts
const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/loans/me`, {
  headers: { Authorization: `Bearer ${token}` }
})
```

### Fine Calculation Logic

Located in `loans.service.ts`. Counts only weekdays between dueDate and returnedAt, multiplies by 20 THB per day.

## Swagger API Documentation

Available at `http://localhost:3001/api/docs` when backend is running. Uses NestJS Swagger module for auto-generated API docs.

## Testing

Currently no tests configured (`npm run test` is a placeholder). Add test suites in `test/` directory and configure Jest in `nest-cli.json` when ready.
