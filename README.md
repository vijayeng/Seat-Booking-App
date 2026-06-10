# Seat Booking App

A production-oriented seat reservation system built with Next.js 15 App Router, TypeScript, Tailwind CSS, Prisma ORM, and PostgreSQL.

This codebase was intentionally designed to demonstrate a complete booking lifecycle:
authentication, seat holding, mock payment, reservation confirmation, and protection against double booking. The implementation favors clarity and correctness over unnecessary abstraction, which is the right trade-off for an assessment setting.

## 1. Architecture Overview

The application uses a layered architecture:

- `app/` contains route handlers and pages.
- `components/` contains client-facing UI and interactive flows.
- `lib/` contains shared business utilities, auth helpers, rate limiting, and Prisma support.
- `middleware/` contains request-time protection for authenticated routes and auth endpoint rate limiting.
- `prisma/` contains the Prisma schema, migration history, and seed script.

The booking flow is intentionally split across the backend and frontend:

- The dashboard fetches seat state from the API and starts a hold.
- The payment page reviews the held seat and finalizes payment.
- The backend enforces state transitions so the UI cannot bypass the business rules.

This separation keeps the UI responsive while ensuring the database remains the source of truth.

## 2. Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript in strict mode
- Tailwind CSS 4
- Prisma ORM 7
- PostgreSQL
- `bcryptjs` for password hashing
- `jose` for JWT signing and verification
- Middleware-based auth protection
- In-memory rate limiting for authentication endpoints

## 3. Database Schema

The Prisma schema models the core reservation domain:

- `User`
  - `id`
  - `email` unique
  - `passwordHash`
  - `createdAt`

- `Seat`
  - `id`
  - `seatNumber` unique
  - `status` with `AVAILABLE`, `HELD`, `RESERVED`
  - `heldUntil` nullable
  - `heldByUserId` nullable

- `Reservation`
  - `id`
  - `userId`
  - `seatId`
  - `status` with `PENDING`, `CONFIRMED`, `FAILED`
  - `createdAt`

- `Payment`
  - `id`
  - `reservationId` unique
  - `status` with `PENDING`, `SUCCESS`, `FAILED`
  - `createdAt`

Relationship decisions:

- A user can hold seats and create reservations.
- A seat can be linked to many reservations over time, but only one active reservation should exist at a time.
- A reservation has one payment record.
- `heldByUserId` is nullable so stale holds can be cleared cleanly.

## 4. Authentication Flow

Authentication uses JWTs stored in HttpOnly cookies.

Flow:

1. The user submits email and password to `POST /api/auth/signup` or `POST /api/auth/login`.
2. Passwords are hashed with bcrypt before storage.
3. On success, the server signs a JWT with a 90-day expiry.
4. The token is stored in an HttpOnly cookie with `Secure` enabled in production and `SameSite=Lax`.
5. Middleware verifies the cookie for protected routes and redirects or returns `401` when the token is missing or invalid.

Design choices:

- HttpOnly cookies reduce XSS exposure compared to localStorage.
- JWTs keep the session stateless for the application tier.
- Middleware enforces access early, before pages or APIs do more work.

## 5. Seat Hold Flow

The seat hold flow begins from the dashboard.

Flow:

1. The dashboard loads seat state through `GET /api/seats`.
2. The user clicks `Reserve` on an `AVAILABLE` seat.
3. The client calls `POST /api/seats/hold`.
4. The server checks authentication and runs a Prisma transaction.
5. The seat is locked, verified as `AVAILABLE`, and updated to:
   - `status = HELD`
   - `heldByUserId = current user`
   - `heldUntil = now + 5 minutes`

Important detail:

- The hold operation is transactional so two users cannot successfully hold the same seat at the same time.

## 6. Payment Flow

The payment page is a review step before confirmation.

Flow:

1. The dashboard redirects the user to `/payment?seatId=...` after a successful hold.
2. The payment page loads the selected seat and shows a review screen.
3. The user clicks `Proceed To Payment`.
4. The client calls `POST /api/payment`.
5. The server verifies the seat is still `HELD`, belongs to the current user, and the hold has not expired.
6. The server creates a pending reservation, creates a pending payment, then simulates success by marking the payment `SUCCESS`.
7. The reservation is marked `CONFIRMED` and the seat becomes `RESERVED`.

This mock payment flow is intentionally simple but preserves the real-world state transitions you would expect in a production booking system.

## 7. Reservation Flow

Reservation confirmation is handled as part of the payment transaction.

Behavior:

- A reservation is first created in `PENDING`.
- If validation fails, the reservation is marked `FAILED`.
- If payment succeeds, the reservation is marked `CONFIRMED`.
- The seat is set to `RESERVED` once confirmation completes.

This design keeps reservation state explicit. Even though payment is mocked here, the database still reflects realistic lifecycle states.

## 8. Double Booking Prevention Strategy

Double booking is prevented through multiple layers:

- The seat hold endpoint uses a Prisma transaction and row-level locking.
- Only `AVAILABLE` seats can move into `HELD`.
- The payment flow requires the seat to still be `HELD` by the current user.
- Expired holds are cleaned up before seat reads and before payment confirmation.
- The `Reservation` model is checked for active records before final confirmation.

The key principle is that the database, not the UI, decides whether a seat can move forward.

## 9. Security Considerations

Security controls in this project include:

- Password hashing with bcrypt.
- JWT stored in HttpOnly cookies.
- `Secure` cookies in production.
- `SameSite=Lax` cookie protection.
- Middleware-based route protection.
- Authentication endpoint rate limiting.
- Validation of request payloads before business logic runs.
- Server-side verification of seat ownership and hold expiry.

What this does not attempt:

- It does not implement CSRF tokens.
- It does not include refresh tokens or session revocation lists.
- It does not integrate a real payment provider.

Those omissions are appropriate for this assessment, but they would need attention in a production rollout.

## 10. Trade-offs Made Due To Assessment Time Constraints

I made a few deliberate trade-offs to keep the system coherent and deliverable:

- The payment step is mocked instead of integrating Stripe or another processor.
- Rate limiting uses in-memory storage for simplicity instead of Redis.
- The booking UI is functional and responsive, but intentionally not over-animated.
- Reservation confirmation is embedded in the payment flow rather than being modeled as a separate background job.
- The current implementation favors explicit route handlers over a heavier service abstraction.

These choices keep the code approachable while still demonstrating the core booking mechanics clearly.

## 11. Setup Instructions

1. Install dependencies.

```bash
npm install
```

2. Create your local environment file.

```bash
cp .env.example .env
```

3. Update `.env` with a valid PostgreSQL connection string and a strong JWT secret.

   The `.env.example` file is intentionally a template. Replace the placeholder
   `DATABASE_URL` value with your own PostgreSQL connection string and set a
   secure `JWT_SECRET` before running the app.

4. Generate the Prisma client.

```bash
npm run prisma:generate
```

5. Apply migrations.

```bash
npm run prisma:migrate
```

6. Seed the database.

```bash
npm run seed
```

7. Start the development server.

```bash
npm run dev
```

Useful verification commands:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

## 12. Environment Variables

Required variables:

- `DATABASE_URL`
  - PostgreSQL connection string used by Prisma and the seed script.

- `JWT_SECRET`
  - Secret used to sign and verify auth tokens.

- `NEXT_PUBLIC_APP_NAME`
  - Public application name displayed in UI.

- `NEXT_PUBLIC_APP_URL`
  - Public application base URL.

Example `.env` values:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/seat_booking_app?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
NEXT_PUBLIC_APP_NAME="Seat Booking App"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Notes on Production Hardening

If this project were moving beyond assessment scope, the first upgrades I would make are:

- Replace in-memory rate limiting with Redis.
- Add a real payment processor and webhook confirmation.
- Introduce a reservation expiry job or queue worker.
- Add CSRF protection for state-changing endpoints.
- Add observability around seat state transitions and payment outcomes.

Those are the right next steps once the core booking flow is stable.
