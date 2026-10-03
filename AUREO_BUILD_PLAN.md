# Aureo Build Plan

Aureo will be built as a local MERN watch-commerce system. The project specification is the source of truth for requirements, while the architecture reference defines the implementation style and layering.

The required request flow is:

```text
React -> Redux/Axios -> Express route -> middleware -> controller -> Mongoose model -> MongoDB
```

The backend uses CommonJS `require`. The frontend uses ES-module `import`. Authentication uses Bearer JWT tokens as required by the Aureo specification.

## Phase 0: Tooling and Contracts

1. Convert the starter backend from ESM to CommonJS.
2. Add the required backend and frontend dependencies.
3. Add development, production, seed, and test scripts.
4. Add `backend/.env.example` and verify secrets remain ignored.
5. Define the response contract: `{ success, message?, ...data }`.
6. Create the shared frontend Axios instance with a Bearer-token interceptor.

## Phase 1: Application Scaffold and Health

1. Separate startup responsibilities between `server.js` and `app.js`.
2. Add JSON parsing, CORS restricted to `http://localhost:5173`, and route registration.
3. Add `GET /api/v1/health`.
4. Add `ErrorHandler`, `catchAsyncErrors`, 404 handling, and final error middleware.
5. Create the prescribed backend folders: `controllers`, `models`, `middlewares`, `utils`, and `seeder`.
6. Initialize the React/Vite frontend, routing shell, shared layout, and black/gold design tokens.

## Phase 2: Models and Seed Data

1. Implement the User, Product, Order, Review, Appraisal, Service, Ticket, MockEmail, and ChatHistory models.
2. Add model validation, indexes, status enums, and relationship rules.
3. Hide passwords with `select: false` and hash them with bcrypt.
4. Enforce unique email and unique `(user, product)` reviews.
5. Enforce second-hand stock of exactly one.
6. Add repeatable seed data, including an admin account, products, and services.
7. Verify the models and seed process before adding protected features.

## Phase 3: Authentication and Access Control

1. Implement registration, login, logout, email verification, current-user, profile updates, and avatar uploads.
2. Save mocked verification emails in `MockEmail` and log them to the server.
3. Implement `isAuthenticatedUser` using Bearer JWT authentication.
4. Reload the user from MongoDB on every authenticated request.
5. Implement `authorizeRoles('admin')` and `requireVerified`.
6. Add authentication Redux state, actions, reducers, route guards, and account pages.
7. Verify duplicate registration, generic login errors, invalid tokens, role boundaries, verification boundaries, ownership, and upload validation.

## Phase 4: Products and Wishlist

1. Implement public product listing and detail APIs.
2. Add keyword search, combined filters, pagination, query sanitization, and active/in-stock handling.
3. Implement admin product CRUD and Cloudinary image metadata: `{ public_id, url }`.
4. Mark products inactive when they are referenced by existing orders instead of physically deleting them.
5. Implement wishlist add, list, and remove operations using `$addToSet` and `$pull`.
6. Build the catalog, product detail, admin product, wishlist, and shared product-card interfaces.
7. Verify public access, filters, pagination, admin restrictions, stock rules, and wishlist ownership.

## Phase 5: Cart, Orders, Payments, and Notifications

1. Implement frontend cart and shipping state with local persistence.
2. Build checkout using server-side prices, totals, user identity, and stock.
3. Implement conditional `findOneAndUpdate` stock reduction.
4. Store order-item name, price, and image snapshots.
5. Implement mock Cash, Dummy Credit Card, and E-Wallet payments.
6. Use `4000 0000 0000 0002` as the designated failed card number.
7. Never store card numbers or CVV values.
8. Implement customer order history, order detail, and cancellation.
9. Implement admin order listing, status updates, and deletion of invalid/test orders.
10. Enforce the status flow: `Pending -> Paid -> Shipped -> Completed`.
11. Restore stock only when a valid cancellation allows it.
12. Save mocked order notifications in `MockEmail`.
13. Build cart, checkout, customer order, and admin order pages.
14. Verify stock races, failed payments, cash orders, ownership, cancellation rules, status transitions, and price recalculation.

## Phase 6: Reviews

1. Implement public review reads.
2. Allow reviews only from verified purchasers of new products.
3. Accept qualifying orders only when their status is `Paid`, `Shipped`, or `Completed`.
4. Reject reviews for second-hand products, cancelled orders, pending orders, and non-purchasers.
5. Enforce one review per user per product.
6. Implement owner update/delete and admin delete permissions.
7. Add review UI to product, account, and order flows.

## Phase 7: Appraisals and User Selling

1. Implement verified-user appraisal submission, listing, detail, and response flows.
2. Add multipart appraisal photo uploads with one to six images and a five MB per-file limit.
3. Store Cloudinary photo metadata.
4. Implement admin appraisal review, offer creation, and rejection.
5. Implement user offer acceptance or rejection.
6. Convert accepted appraisals into active second-hand products with stock equal to one.
7. Add sell-watch, appraisal status, admin review, and conversion interfaces.
8. Verify validation, photo limits, ownership, state transitions, rejection, acceptance, conversion idempotency, and expense data.

## Phase 8: Services and Tickets

1. Implement public service listing.
2. Implement admin service create, update, and delete operations.
3. Require positive service prices.
4. Implement verified-user ticket creation, listing, and detail views.
5. Implement admin ticket listing and status updates.
6. Generate unique ticket numbers.
7. Save timestamped ticket status history.
8. Save mocked ticket notifications in `MockEmail`.
9. Build service pages and ticket status timelines.
10. Verify public access, verification requirements, ownership, admin transitions, status progression, and notifications.

## Phase 9: Admin Dashboard

1. Implement the admin dashboard aggregate endpoint.
2. Report sales, order counts by status, current inventory, and appraisal expenses.
3. Follow the FRD assumption that expenses equal accepted appraisal offers.
4. Keep service costs excluded until a service-cost field and payment rule are added.
5. Build the dashboard with Recharts.
6. Verify metrics against seeded and live orders, products, and appraisals.

## Phase 10: Rule-Based AI Chat

1. Implement authenticated chat and history endpoints.
2. Store one ChatHistory document per user.
3. Extract budget, style, brand, and movement preferences using backend keyword/regex logic.
4. Match recommendations against currently in-stock products.
5. Persist messages and updated preferences.
6. Build the logged-in-only chat widget or page.
7. Verify history isolation, preference retention, product matching, empty recommendations, and unauthenticated rejection.

## Phase 11: 3D Experience and UI Completion

1. Add a lazy-loaded home hero using one Three.js canvas.
2. Provide a primitive-watch fallback when no model is available.
3. Provide WebGL, small-screen, and reduced-motion fallbacks.
4. Dispose 3D resources on unmount.
5. Ensure 3D loading never blocks navigation or checkout.
6. Complete responsive home, catalog, product, cart, account, and admin interfaces.
7. Apply consistent black/gold theme overrides, focus states, Toastify messages, and SweetAlert2 confirmations.

## Phase 12: Hardening, Testing, and Documentation

1. Add backend tests for 400, 401, 403, 404, ownership, admin middleware, validation, atomic stock, order transitions, reviews, appraisal conversion, and chat isolation.
2. Add frontend checks for route guards, loading states, error states, empty states, responsive layout, authentication, and checkout.
3. Run backend test, lint, and build checks.
4. Run frontend build and test checks.
5. Run seed/reset checks against local MongoDB.
6. Complete an end-to-end local smoke test:
   - Register and verify an account.
   - Log in and browse/filter products.
   - Add a wishlist item.
   - Complete checkout and order status changes.
   - Submit a qualifying product review.
   - Submit an appraisal and convert it as an admin.
   - Create and update a service ticket.
   - Verify dashboard metrics.
   - Verify chat history and preferences.
7. Test laptop/mobile layouts, reduced motion, WebGL fallback, and non-blocking 3D loading.
8. Document setup, scripts, seed commands, API conventions, assumptions, and local development instructions in the README.

## Key Decisions

- Aureo's specification takes precedence over conflicting details in the reference snapshot.
- Authentication uses Bearer JWT headers, not cookies.
- The backend uses CommonJS and the frontend uses ES modules.
- All APIs use the `/api/v1` prefix.
- Features are built as vertical slices: model, route, controller, middleware, Redux logic, and UI.
- Email, payments, and AI remain mocked. Cloudinary is used for image storage.
- Dashboard expenses initially mean accepted appraisal offers only.
- The application is local-host-only; deployment, real payments, real email, and external LLM integration are out of scope.

## Reference Files

- [AUREO_PROJECT_SPEC.md](AUREO_PROJECT_SPEC.md) - functional requirements, data model, API table, design requirements, assumptions, and build order.
- [PROJECT_ARCHITECTURE_REFERENCE.md](PROJECT_ARCHITECTURE_REFERENCE.md) - reference layering, backend responsibilities, frontend responsibilities, and request flow.
- [backend/package.json](backend/package.json) - current backend module configuration and dependency list.
- [backend/app.js](backend/app.js) - current backend starter application.
- [backend/config/db.js](backend/config/db.js) - current MongoDB connection helper.
- `backend/server.js` - planned server entry point.
- `backend/controllers`, `backend/models`, `backend/middlewares`, `backend/utils`, and `backend/seeder` - planned backend feature layers.
- `frontend/src` - planned frontend source structure.

## First Implementation Target

The first implementation slice is Phase 0 and Phase 1:

1. Align the backend with CommonJS.
2. Separate `server.js` from `app.js`.
3. Add API middleware and centralized errors.
4. Add `GET /api/v1/health`.
5. Confirm the backend starts successfully before implementing models or authentication.
