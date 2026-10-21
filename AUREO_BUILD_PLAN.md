# Aureo Build Plan

Aureo will be built as a MERN watch-commerce system with managed authentication, media storage, and a final Render deployment. The project specification is the source of truth for requirements, while the architecture reference defines the implementation style and layering.

The required request flow is:

```text
React -> Redux/Axios -> Express route -> middleware -> controller -> Mongoose model -> MongoDB
```

The backend uses CommonJS `require`. The frontend uses ES-module `import`. Supabase handles email/password identity, Firebase handles Google sign-in, and the backend issues the Aureo Bearer JWT used by the API after either provider is verified.

## Course Assessment Alignment

The professor's requirements in `PROJECT_REQUIREMENTS.md` are acceptance criteria for the phases below:

| Assessment | Required deliverable | Planned phase |
|---|---|---|
| MP1 | Product/service CRUD datatables, multiple product photos, checkbox bulk delete | Phases 4 and 8 |
| MP2 | Combined price, category, ratings, and review filters | Phases 4 and 6 |
| MP3 | Purchaser reviews and ratings, owner update, admin delete | Phase 6 |
| Term Test Lab | Completed transactions, admin status updates, customer email with product/service list, subtotals, grand total, and attached PDF receipt | Phase 5 |
| Unit 1 | `bad-words` review filtering and Yup/Formik or React Hook Form validation | Phases 3, 4, and 6 |
| Unit 2 | Responsive CSS plus Bootstrap and MUI (or equivalent) components | Phase 11 |
| Quiz 2 | Sales line/bar charts with a date-range filter | Phase 9 |
| Quiz 3 | Homepage product-list pagination; infinite scroll is an optional higher-scoring enhancement | Phase 4 |
| Quiz 4 | Facebook or Gmail login through a supported social-auth package and Firebase, Supabase, or Clerk | Phase 3 |
| Term Test LEC | Functional completeness, error-free execution, and documented team contribution | Phase 12 |

Every assessment item must have a visible UI path, an enforced backend rule where applicable, and a verification step before its phase is complete.

## Implementation Status

Status as of **2026-10-22**. This section tracks the build against the phases below. It records
what is already implemented and verified; it does not replace the phase definitions.

Legend: **Done** = implemented and exercised. **Partial** = core path works, listed gaps remain.
**Pending** = not started.

| Phase | Status | Evidence |
|---|---|---|
| 0. Tooling and Contracts | Partial | CommonJS backend, all provider SDKs, `dev`/`start`/`production`/`seed`/`clear:users`/`test` scripts, `backend/config/.env.example`, shared Axios instance with Bearer interceptor (`frontend/src/services/api.js`), and the `render.yaml` deployment blueprint. Gap: no backend `lint` script. |
| 1. Scaffold and Health | Done | `backend/server.js` vs `backend/app.js` split, `GET /api/v1/health`, `ErrorHandler`/`catchAsyncErrors`/404/final error middleware, all prescribed folders present. |
| 2. Models and Seed | Partial | User, Product, Order, Review, Appraisal, Service, Ticket, MockEmail, ChatHistory models exist with validation, indexes, and status enums. Gaps: `MockEmail` is implemented as `backend/models/emailLog.js`; `Order.totalPrice` is not persisted (total is computed); second-hand stock rule is enforced in the controller, not in the model `pre("validate")` hook; seed covers admin, products, and services only. |
| 3. Authentication and Access Control | Done | Supabase register/login/logout/verify, Firebase Google sign-in, provider-token verification, email-normalised account linking, Aureo JWT issuance, user reloaded per request, `authorizeRoles("admin")`, `requireVerified`, Cloudinary avatar, Redux auth slice, route guards. |
| 4. Products and Wishlist | Done | Public list/detail, keyword search, combined filters, pagination, query sanitisation, admin CRUD with Cloudinary image metadata, datatable, multi-photo, checkbox bulk delete, soft delete when referenced by orders, wishlist `$addToSet`/`$pull`. The catalog exposes the price, brand, movement, condition, case size, category, ratings, and review-count filters. |
| 5. Cart, Orders, Payments, Notifications | Partial | Cart with local persistence, server-side price recalculation, conditional `findOneAndUpdate` stock reduction, item snapshots, mock Cash/Dummy Card/E-Wallet payments, decline card `4000 0000 0000 0002`, order history/detail/cancellation, admin order list and status updates, strict status flow, stock restore on cancel, `MockEmail` on status change, PDF receipt generation. Gaps: payment logic is inlined in the controller instead of `utils/mockPayment.js`; E-Wallet has no GCash/Maya choice; a declined card creates no order so `paymentStatus: "Failed"` is unused; the PDF bytes are not persisted so the receipt cannot be re-downloaded. |
| 6. Reviews | Done | Purchaser-only check, `Paid`/`Shipped`/`Completed` gate, second-hand rejection, one review per user and product, owner update, admin delete, `bad-words` masking on create and update, rating recalculation. |
| 7. Appraisals and User Selling | Done | Multipart appraisal submission with 1�6 Cloudinary photos at 5 MB each, user appraisal list/detail, offer accept/reject, admin review and offer, conversion into a second-hand product with stock 1, sell-watch and admin appraisal pages. |
| 8. Services and Tickets | Done | `GET /api/v1/services`, admin service CRUD with a datatable and checkbox bulk delete, positive price rule, verified-user ticket creation, unique ticket numbers, admin ticket listing and status updates, timestamped status history, `MockEmail` ticket notifications, service pages and ticket timelines. |
| 9. Admin Dashboard | Done | `GET /api/v1/admin/dashboard` reports sales (Paid or later), order counts by status, inventory, and appraisal expenses. The Recharts dashboard draws a bar chart and a line chart with a from/to date-range filter. |
| 10. Rule-Based AI Chat | Done | `POST /api/v1/chat` and `GET /api/v1/chat/history`, one `ChatHistory` document per user, backend keyword extraction for budget, style, brand, and movement, matching against in-stock products, and a logged-in-only chat widget. |
| 11. 3D Experience and UI Completion | Partial | Responsive pages, gold theme, Toastify, SweetAlert2, and a lazy-loaded Three.js home hero with a primitive-watch model, a CSS watch fallback for devices without WebGL and on small screens, `prefers-reduced-motion` support, and resource disposal on unmount. Gap: the product detail page has no 3D viewer and no product-level 3D gallery. |
| 12. Hardening, Testing, Documentation | Partial | 7 backend test suites (117 cases) run against a dedicated test database and cover auth, products, orders, reviews, appraisals, services, and dashboard metrics. `README.md` documents the setup, the scripts, the seed commands, the API conventions, the assumptions, the assessment coverage, and the local development flow. Gaps: no frontend test script, and no chat isolation coverage. |
| 13. Deployment on Render | Partial | `render.yaml` defines the Express API service and the static Vite site with the health check, the build and start commands, and the SPA rewrite. `frontend/public/_redirects` provides the SPA fallback. The production environment variables are declared but not filled in, so the deployment has not been run or verified yet. |

### Assessment coverage

| Assessment | Status | Notes |
|---|---|---|
| MP1 | Done | Product datatable, multi-photo upload, checkbox bulk delete, service CRUD datatable, and service checkbox bulk delete. |
| MP2 | Done | Price, category, ratings, and review filters in the catalog, all backed by `backend/utils/apiFeatures.js`. |
| MP3 | Done | Purchaser review and rate, owner update, admin delete. |
| Term Test Lab | Done | Completed transactions, admin status updates, customer email with item list, subtotals, and grand total, PDF receipt attachment. |
| Unit 1 | Done | `bad-words` masking on review create and update. React Hook Form plus Yup validation on the login, registration, profile, and product CRUD forms via `frontend/src/utils/validationSchemas.js`. |
| Unit 2 | Done | Responsive CSS with the black/gold tokens, React Bootstrap components, and Material UI components in `frontend/src/components/ui/`. |
| Quiz 2 | Done | Recharts bar chart and line chart on the admin dashboard with a from/to date-range filter. |
| Quiz 3 | Done | Homepage pagination plus infinite scroll through `frontend/src/hooks/useInfiniteScroll.js`. |
| Quiz 4 | Done | Google sign-in through Firebase with the backend issuing the Aureo JWT. |
| Term Test LEC | Partial | Functional completeness covers FR 1.x through FR 7.x, and `README.md` documents the project end to end. The remaining gaps are the frontend test suite and the unverified Render deployment. See `PROJECT_REQUIREMENTS.md` for the per-item coverage matrix. |

## Phase 0: Tooling and Contracts

1. Convert the starter backend from ESM to CommonJS.
2. Add the required backend and frontend dependencies, including the Supabase and Firebase client/admin SDKs, Cloudinary, and deployment configuration support.
3. Add development, production, seed, and test scripts.
4. Add `backend/.env.example` and verify secrets remain ignored.
5. Define the response contract: `{ success, message?, ...data }`.
6. Create the shared frontend Axios instance with a Bearer-token interceptor.
7. Define provider boundaries: MongoDB is the application database, Cloudinary stores images, Supabase provides email/password identity, Firebase provides Google identity, and Render is reserved for deployment.

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

1. Implement Supabase email/password registration, login, logout, and email verification.
2. Implement Firebase Google sign-in and configure the approved web OAuth domain.
3. Add backend provider-token verification and account linking by normalized email.
4. Issue the Aureo JWT only after Supabase or Firebase identity is verified; keep the API on Bearer JWT authentication.
5. Reload the user from MongoDB on every authenticated request.
6. Implement `authorizeRoles('admin')` and `requireVerified`.
7. Add authentication Redux state, actions, reducers, route guards, and account pages.
8. Keep provider user IDs on the User model and prevent duplicate or conflicting account links.
9. Upload avatars to Cloudinary and store `{ public_id, url }` in MongoDB.
10. Apply Yup/Formik or React Hook Form validation to product and profile forms.
11. Verify duplicate registration, generic login errors, invalid provider tokens, invalid API tokens, role boundaries, verification boundaries, ownership, social-login failures, and upload validation.

## Phase 4: Products and Wishlist

1. Implement public product listing and detail APIs.
2. Add keyword search, combined filters, pagination, query sanitization, and active/in-stock handling.
3. Implement admin product CRUD with category, ratings, and review-aware query fields, Cloudinary image metadata `{ public_id, url }`, and a datatable view.
4. Support multiple product photos, checkbox selection, and admin bulk deletion; mark products inactive when they are referenced by existing orders instead of physically deleting them.
5. Implement wishlist add, list, and remove operations using `$addToSet` and `$pull`.
6. Build the catalog, product detail, admin product, wishlist, and shared product-card interfaces.
7. Add homepage pagination and keep infinite scroll as the optional higher-scoring Quiz 3 enhancement.
8. Verify public access, combined price/category filters, ratings/review filters, pagination, admin restrictions, stock rules, bulk actions, and wishlist ownership.

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
12. Save mocked order notifications in `MockEmail` and send a completed-transaction email containing the product/service list, subtotals, and grand total.
13. Generate a PDF receipt and attach it to the completed-transaction email without storing sensitive payment data.
14. Build cart, checkout, customer order, and admin order pages, including admin transaction status controls.
15. Verify stock races, failed payments, cash orders, ownership, cancellation rules, status transitions, price recalculation, email contents, and PDF attachment generation.

## Phase 6: Reviews

1. Implement public review reads.
2. Allow reviews only from verified purchasers of new products.
3. Accept qualifying orders only when their status is `Paid`, `Shipped`, or `Completed`.
4. Reject reviews for second-hand products, cancelled orders, pending orders, and non-purchasers.
5. Enforce one review per user per product.
6. Implement owner update permissions and admin delete permissions; users cannot edit or delete another user's review.
7. Filter review text with the `bad-words` package before saving or updating.
8. Add review UI to product, account, and order flows with rating controls and filter results.
9. Verify purchaser eligibility, owner updates, admin deletion, bad-word masking, duplicate reviews, and ratings recalculation.

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
2. Implement admin service create, update, and delete operations with a service CRUD datatable and checkbox bulk-delete action.
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
5. Build the dashboard with Recharts, including line or bar sales charts and a date-range filter.
6. Verify metrics and date-filtered chart data against seeded and live orders, products, and appraisals.

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

1. Add backend tests for 400, 401, 403, 404, ownership, admin middleware, validation, atomic stock, order transitions, completed-transaction emails and PDF receipts, reviews, bad-word filtering, appraisal conversion, and chat isolation.
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
7. Verify social login, product/service datatables, multiple photos, bulk delete, all four required filter types, review ownership, form validation, bad-word masking, homepage pagination, and completed-transaction receipt email.
8. Test laptop/mobile layouts, responsive CSS, Bootstrap and MUI/equivalent components, reduced motion, WebGL fallback, and non-blocking 3D loading.
9. Document setup, scripts, seed commands, API conventions, assumptions, assessment coverage, and local development instructions in the README.

## Phase 13: Deployment on Render

1. Create separate Render services for the Express API and the Vite frontend using production environment variables.
2. Use MongoDB Atlas as the production MongoDB connection; do not run MongoDB inside Render.
3. Configure Render build, start, health-check, and SPA fallback settings.
4. Register the Render frontend and API URLs in Supabase, Firebase, Cloudinary, and CORS configuration.
5. Verify production authentication redirects, Bearer JWT requests, Cloudinary uploads, MongoDB reads/writes, email verification, Google sign-in, and protected routes.
6. Perform a production smoke test only after all local phases pass.

## Key Decisions

- Aureo's specification takes precedence over conflicting details in the reference snapshot.
- Authentication uses Bearer JWT headers, not cookies.
- The backend uses CommonJS and the frontend uses ES modules.
- All APIs use the `/api/v1` prefix.
- Features are built as vertical slices: model, route, controller, middleware, Redux logic, and UI.
- Supabase provides email/password identity and verification; Firebase provides Google sign-in; the backend still issues the application JWT.
- Cloudinary is used for image storage and MongoDB/Mongoose remains the application data store.
- Email notifications, payments, and AI remain mocked unless a later requirement changes them.
- Dashboard expenses initially mean accepted appraisal offers only.
- Local development comes first. Render deployment is planned only in Phase 13 after hardening and documentation.

### Recorded deviations

These are deliberate departures from the literal wording of `AUREO_PROJECT_SPEC.md`. Each one keeps
the observable behaviour required by the FRD intact.

| Deviation | Reason |
|---|---|
| Email verification is `POST /api/v1/verify-email` with an `{ email, code }` body instead of `GET /api/v1/verify-email/:token`. | The provider sends a six-digit code, not a link token. A `GET` with a code in the path would leak the code into server logs and browser history. |
| The provider id for Google sign-in is stored as `googleId` on the User model. | `firebaseUserId` was reserved for a future provider switch. The field remains `select: false`. |
| `MockEmail` is implemented as `backend/models/emailLog.js` exporting an `EmailLog` model. | The collection keeps its original name so seeded and existing records stay readable. The FRD-visible behaviour (emails are logged and stored) is unchanged. |
| The `MockEmail.attachments` field stores attachment filenames, not file bytes. | Mocked email must not persist binary payloads. The receipt is still generated and attached to the mocked send. |
| `PUT /api/v1/me/update` accepts JSON, and the avatar is uploaded through a separate `PUT /api/v1/me/avatar` route. | One route cannot cleanly accept both a multipart form and a JSON profile update. Splitting them keeps each validator simple. |
| The second-hand stock rule is enforced in the product controller, not in the model `pre("validate")` hook. | A second-hand watch reaches stock 0 once it is sold, so the model permits 0 and the controller forces 1 on create and update. |
| `utils/mockPayment.js` is planned but not yet extracted. | Payment logic currently lives inside the order controller. Extraction happens with the Phase 12 cleanup. |
| The service CRUD datatable and service bulk delete use `POST /api/v1/admin/services/bulk-delete`, mirroring the product route. | The specification's REST table lists only the single-service delete. MP1 requires a bulk delete, so the batch route follows the product pattern. |

## Reference Files

- [AUREO_PROJECT_SPEC.md](AUREO_PROJECT_SPEC.md) - functional requirements, data model, API table, design requirements, assumptions, and build order.
- [PROJECT_ARCHITECTURE_REFERENCE.md](PROJECT_ARCHITECTURE_REFERENCE.md) - reference layering, backend responsibilities, frontend responsibilities, and request flow.
- [PROJECT_REQUIREMENTS.md](PROJECT_REQUIREMENTS.md) - the assessment items and the coverage matrix that maps them to the implementation.
- [AUREO_CHANGE_LOG.md](AUREO_CHANGE_LOG.md) - what was changed, why each change was needed, and the commands that were run.
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

Both are complete. Phases 0 through 10 are implemented, and Phase 13 has its Render blueprint in
`render.yaml`. The remaining work is Phase 11's product-level 3D viewer, the frontend test suite and
the chat isolation test in Phase 12, and running the Render deployment itself.
