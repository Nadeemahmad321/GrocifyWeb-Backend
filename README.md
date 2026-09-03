# Grocify Backend

MySQL REST API for the Grocify customer website and admin panel.

## Setup

1. Create MySQL database: `CREATE DATABASE grocify CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
2. Copy `.env.example` to `.env` and set the MySQL password plus JWT secrets.
3. Run `npm install`.
4. Run `npm run db:generate`.
5. Run `npm run db:migrate -- --name init`.
6. Run `npm run db:seed`.
7. Run `npm run dev`.

API base URL: `http://localhost:5000/api/v1`. Health check: `GET /api/v1/health`.

Development OTP is returned by `POST /api/v1/auth/request-otp` only when `EXPOSE_DEV_OTP=true`. Seed admin: `admin@grocify.in` / `admin123`.
