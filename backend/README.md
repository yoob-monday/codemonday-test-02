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
npm install
npx prisma generate
npx prisma db push
npm run start:dev
```

The API runs at `http://localhost:3000/api`.

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
