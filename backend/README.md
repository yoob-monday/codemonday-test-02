# Library Lending Backend

NestJS backend for a library lending system using Prisma with PostgreSQL.

## Features

- Public catalog browsing
- Member signup and login
- Member loan checkout plus history
- Librarian login from `.env`
- Book returns with overdue fine calculation
- Overdue loan listing and PDF report export

## Getting started

```bash
cp .env.example .env
npm install
npm run db:setup
npm run start:dev
```

The API runs at `http://localhost:3001/api`.

## Lending rules

- `textbook`: 3 days
- `general`: 7 days
- `novel`: 14 days
- Overdue fines are `20 THB` per overdue weekday
- Saturday and Sunday do not count toward overdue fines
- Same-day returns are always free
- A member can hold at most 3 active loans
- A member with any overdue loan cannot borrow more

## Main endpoints

- `GET /api`
- `GET /api/summary`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/books`
- `POST /api/books`
- `PATCH /api/books/:id`
- `GET /api/loans`
- `POST /api/loans`
- `GET /api/loans/me`
- `POST /api/loans/:id/return`
- `GET /api/loans/overdue/report.pdf`
