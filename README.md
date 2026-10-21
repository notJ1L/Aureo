# AUREO — Watch E-Commerce (MERN)

> Aureo is a MERN web application for buying, selling and servicing watches.
> Collectors browse new and second-hand timepieces, buy with a mocked payment
> flow, request appraisals for their own watches, open service tickets, review
> the pieces they bought, keep a wishlist and talk to a rule-based assistant.
> Admins manage the inventory, the orders, the appraisals, the services and the
> tickets, and read the dashboard.

**Team:** Marcus S. Aristain, Jonel A. Caisip (BSIT-S-3A)
**Instructor:** Mr. Rommel M. Dalisay

---

## 1. Quick start

### Prerequisites

- Node.js 20 or newer (the development machine uses Node 24)
- npm
- MongoDB (a local instance or MongoDB Atlas)
- A Supabase project (email/password identity)
- A Firebase project with Google sign-in enabled
- A Cloudinary account for the image uploads

### 1. Backend

```powershell
cd backend
npm install
```

Create `backend/config/.env` from `backend/config/.env.example` and fill in the
values. The important ones are `MONGO_URI`, `JWT_SECRET`, `SUPABASE_URL`,
`SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, the `FIREBASE_*` keys, the
`CLOUDINARY_*` keys, the `SMTP_*` keys and `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

```powershell
npm run seed
npm run dev
```

The API is then available on `http://localhost:3000/api/v1`. Check it with:

```text
http://localhost:3000/api/v1/health
```

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

The storefront is available on `http://localhost:5173`.

The frontend needs its own environment file (`frontend/.env`):

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

`AUREO_SETUP_GUIDE.md` walks through every provider in detail.

---

## 2. Scripts

| Location | Script | What it does |
|---|---|---|
| `backend` | `npm run dev` | Starts the API with nodemon |
| `backend` | `npm start` | Starts the API with node |
| `backend` | `npm run production` | Alias of `npm start` for the production process |
| `backend` | `npm run seed` | Creates the admin account and the sample catalogue |
| `backend` | `npm run clear:users` | Removes the seeded users |
| `backend` | `npm test` | Runs the Jest + Supertest suite |
| `frontend` | `npm run dev` | Starts the Vite dev server |
| `frontend` | `npm run build` | Builds the production bundle into `frontend/dist` |
| `frontend` | `npm run lint` | Runs ESLint over the frontend |
| `frontend` | `npm run preview` | Serves the production build locally |

---

## 3. Architecture

```
React component -> Supabase / Firebase identity -> Aureo JWT
    -> Redux action / Axios -> Express route -> Middleware -> Controller
    -> Mongoose model -> MongoDB -> JSON response -> React state -> UI
```

**Layer rules**

| Folder | Responsibility |
|---|---|
| `backend/routes` | Maps a URL to a controller. No business logic. |
| `backend/controllers` | The business logic of a feature. |
| `backend/models` | The Mongoose schema, validation, indexes and relationships. |
| `backend/middlewares` | Access control and error handling. |
| `backend/utils` | Reusable code: filters, uploads, receipts, chat engine, email. |
| `backend/seeder` | The repeatable seed data. |
| `frontend/src/redux` | The state, the actions and the constants. |
| `frontend/src/pages` | One page per route. |
| `frontend/src/components` | The shared components, the chat widget and the 3D hero. |

**Conventions**

- The backend is CommonJS (`require`), the frontend is ES modules (`import`).
- Every endpoint lives under `/api/v1`.
- Every response is `{ success: boolean, message?: string, ...data }` with the
  correct status code.
- Controllers are wrapped in `catchAsyncErrors` and throw
  `ErrorHandler(message, statusCode)`. One error middleware, registered last.
- The frontend uses a single Axios instance (`src/services/api.js`) with a
  request interceptor that adds `Authorization: Bearer <token>`.
- The server always recalculates prices and totals. The client is never trusted.
- CORS only allows the origins listed in `CLIENT_URL`.
- List endpoints are paginated and their query parameters are sanitised, so a
  client can never inject a MongoDB operator.
- Every `/admin` route uses `isAuthenticatedUser` **and** `authorizeRoles("admin")`.

---

## 4. Data model

| Model | Purpose |
|---|---|
| `User` | Profile, role, verification state, provider identities, wishlist |
| `Product` | A watch listing, with the images, the stock and the rating |
| `Order` | A placed order with the item snapshots and the status history |
| `Review` | A rating and a comment for a new watch |
| `Appraisal` | A collector's request to sell a watch |
| `Service` | An aftercare service with a positive price |
| `Ticket` | A support request with its status history |
| `EmailLog` | Every mocked notification that was sent |
| `ChatHistory` | One conversation and the detected preferences per user |

---

## 5. API reference

All endpoints are prefixed with `/api/v1`.

### Authentication

| Method | Endpoint | Access |
|---|---|---|
| POST | `/register` | Public |
| POST | `/verify-email` | Public |
| POST | `/login` | Public |
| POST | `/auth/google` | Public |
| GET | `/me` | Logged in |
| GET | `/logout` | Logged in |
| PUT | `/me/update` | Logged in |
| PUT | `/me/avatar` | Logged in |

### Products and wishlist

| Method | Endpoint | Access |
|---|---|---|
| GET | `/products?brand=&movement=&caseSize=&condition=&category=&minPrice=&maxPrice=&minRating=&minReviews=&keyword=&page=&limit=` | Public |
| GET | `/product/:id` | Public |
| POST | `/admin/product/new` | Admin |
| PUT | `/admin/product/:id` | Admin |
| DELETE | `/admin/product/:id` | Admin |
| POST | `/admin/products/bulk-delete` | Admin |
| GET | `/wishlist` | Logged in |
| POST | `/wishlist/:productId` | Logged in |
| DELETE | `/wishlist/:productId` | Logged in |

### Orders

| Method | Endpoint | Access |
|---|---|---|
| POST | `/order/new` | Verified user |
| GET | `/orders/me` | Logged in |
| GET | `/order/:id` | Owner or admin |
| PUT | `/order/:id/cancel` | Owner, `Pending` only |
| GET | `/admin/orders` | Admin |
| PUT | `/admin/order/:id` | Admin |
| DELETE | `/admin/order/:id` | Admin |

### Reviews

| Method | Endpoint | Access |
|---|---|---|
| GET | `/product/:id/reviews` | Public |
| POST | `/product/:id/review` | Verified purchaser |
| PUT | `/review/:id` | Owner |
| DELETE | `/review/:id` | Owner or admin |

### Appraisals

| Method | Endpoint | Access |
|---|---|---|
| POST | `/appraisal/new` (multipart) | Verified user |
| GET | `/appraisals/me` | Logged in |
| GET | `/appraisal/:id` | Owner or admin |
| PUT | `/appraisal/:id/respond` | Owner, `Offer Made` only |
| GET | `/admin/appraisals` | Admin |
| PUT | `/admin/appraisal/:id` | Admin |
| POST | `/admin/appraisal/:id/convert` | Admin, `Accepted` only |

### Services and tickets

| Method | Endpoint | Access |
|---|---|---|
| GET | `/services` | Public |
| GET | `/service/:id` | Public |
| POST | `/admin/service/new` | Admin |
| PUT | `/admin/service/:id` | Admin |
| DELETE | `/admin/service/:id` | Admin |
| POST | `/admin/services/bulk-delete` | Admin |
| POST | `/ticket/new` | Verified user |
| GET | `/tickets/me` | Logged in |
| GET | `/ticket/:id` | Owner or admin |
| GET | `/admin/tickets` | Admin |
| PUT | `/admin/ticket/:id` | Admin |

### Dashboard and chat

| Method | Endpoint | Access |
|---|---|---|
| GET | `/admin/dashboard?from=&to=` | Admin |
| POST | `/chat` | Logged in |
| GET | `/chat/history` | Logged in |

---

## 6. Authentication model

- **Supabase** owns the email address, the password and the confirmation. The
  password is never written to MongoDB, Aureo only stores the provider id.
- **Firebase** provides the Google sign-in. The backend verifies the Firebase
  ID token and issues the Aureo JWT.
- The **Aureo JWT** is the only credential the API accepts. It travels in the
  `Authorization: Bearer <token>` header, never in a cookie.
- `isAuthenticatedUser` re-loads the user from MongoDB on every request, so a
  role change takes effect immediately.
- `requireVerified` blocks the orders, the appraisals and the tickets for an
  account that has not accepted its verification code. The answer is `403`.
- Login failures always return the same message: `Invalid email or password`.
- The administrator is created by the seeder only, never by a registration.

---

## 7. Assumptions

1. Dashboard **expenses** are the sum of the accepted appraisal offers. The
   service costs stay excluded until a service cost field exists.
2. A service ticket has no payment.
3. The declined test card number is `4000 0000 0000 0002`. Any other
   correctly formatted number succeeds.
4. An unverified user can sign in but receives `403` on the orders, the
   appraisals and the tickets.
5. A user can only cancel a `Pending` order.
6. The chat assistant is rule based first: the budget, the brand, the movement
   and the style are extracted with regular expressions.
7. A second-hand watch is a single unit. A stock above one is rejected.
8. Appraisal photos: at least one, at most six, 5 MB each. A profile photo is
   a JPG or a PNG of at most 2 MB.
9. The order status flow is `Pending → Paid → Shipped → Completed`. A completed
   order never moves back, and only a `Pending` order can be cancelled.

---

## 8. Assessment coverage

| Assessment | Where it lives | How to verify |
|---|---|---|
| **MP1** product datatable, multiple photos, checkbox bulk delete | `backend/controllers/productController.js` (`bulkDeleteProducts`), `frontend/src/pages/admin/AdminProductsPage.jsx` | Sign in as the admin, open *Vault (Admin) → Inventory*, tick several rows and press *Delete selected*. A product that already appears in an order is archived instead of removed. |
| **MP1** service datatable and bulk delete | `backend/controllers/serviceController.js` (`bulkDeleteServices`), `frontend/src/pages/admin/AdminServicesPage.jsx` | *Vault (Admin) → Services*, tick rows and delete. |
| **MP2** combined price, category, ratings and review filters | `backend/utils/apiFeatures.js` (`buildProductFilter`), `frontend/src/pages/CatalogPage.jsx` | On the catalog combine brand, movement, case size, condition, price, rating and review count. The URL carries every filter. |
| **MP3** purchaser reviews, owner update, admin delete | `backend/controllers/reviewController.js`, `frontend/src/components/ProductReviews.jsx` | Buy a new watch, complete the order, then review it. *Edit Review* changes your own review, *Delete Review* removes it, and an admin can delete any review. |
| **Term Test Lab** completed transactions, status updates, customer email, PDF receipt | `backend/controllers/orderController.js` (`updateAdminOrder`), `backend/utils/generateReceipt.js`, `backend/utils/mockEmail.js` | Move an order to `Paid → Shipped → Completed`. The email log stores the item list, the subtotals, the grand total and the attached PDF receipt. |
| **Unit 1** `bad-words` filtering and Yup/Formik validation | `backend/utils/filterBadWords.js`, `frontend/src/utils/validationSchemas.js` | Write a review with a profane word, it is masked before it is stored. The product, profile, checkout and appraisal forms are validated with Yup through React Hook Form. |
| **Unit 2** responsive CSS with Bootstrap and MUI | `frontend/src/components/ui/index.jsx`, `frontend/src/components/ui/aureoTheme.js` | The admin datatables use the Bootstrap based components, the cards, dialogs and rating use MUI, and both are restyled in black and gold. |
| **Quiz 2** sales chart with a date-range filter | `backend/controllers/dashboardController.js`, `frontend/src/pages/admin/AdminDashboardPage.jsx` | *Vault (Admin) → Dashboard*, set a from and a to date. The bar and line charts follow the range. |
| **Quiz 3** homepage pagination, infinite scroll as a bonus | `frontend/src/App.jsx`, `frontend/src/hooks/useInfiniteScroll.js` | The homepage list is paginated and keeps loading the next page when the sentinel scrolls into view. |
| **Quiz 4** social login through Firebase and Supabase | `backend/controllers/authController.js` (`googleLogin`), `backend/config/supabase.js` | *Continue with Google* on the login and the register page, and register with an email and a password. |
| **Term Test LEC** completeness, error-free execution, team contribution | The whole application, this README | `npm test` in `backend`, `npm run lint` and `npm run build` in `frontend`. |

---

## 9. Tests

```powershell
cd backend
npm test
```

The suite runs against a separate `aureo_test` database, so it never touches
the development data. It covers:

| Suite | What it proves |
|---|---|
| `auth.test.js` | Token handling, the generic login error, the role and verification boundaries, profile ownership |
| `product.test.js` | The public list, the combined filters, the pagination, the injection guard, the second-hand stock rule, the bulk delete, the wishlist ownership |
| `order.test.js` | The server side price, the declined card, the stock reduction and restoration, the status flow, the notifications and the PDF receipt |
| `review.test.js` | The purchaser rule, the second-hand rejection, the profanity filter, the single review rule, the owner update and the admin delete |
| `appraisal.test.js` | The photo limits, the ownership, the offer and the idempotent conversion |
| `service.test.js` | The positive price, the bulk delete, the ticket numbers, the status history and the notifications |
| `dashboard.test.js` | The sales, the expenses, the inventory, the date range and the chat isolation |

---

## 10. Deployment on Render

`render.yaml` in the project root describes both services.

- The **API** is a Node web service. Its start command is `npm start`, and the
  health check path is `/api/v1/health`.
- The **frontend** is a static site. The build command is `npm run build`, the
  publish path is `dist`, and every unknown path is rewritten to `index.html`
  so the React Router routes work on a refresh.
- The production database is **MongoDB Atlas**. MongoDB is never run inside
  Render.
- The production environment variables are listed in `render.yaml`. The
  `JWT_SECRET` has to be regenerated for production, and `CLIENT_URL` has to
  contain the URL of the deployed frontend.
- After the deployment, register the Render URLs in Supabase (the redirect URL
  and the email template), in Firebase (the authorised domain) and in the
  Cloudinary upload preset.

---

## 11. Team contribution

| Area | Marcus S. Aristain | Jonel A. Caisip |
|---|---|---|
| Authentication | Supabase and Firebase identity, the Aureo JWT, the role and verification middleware | The profile, the avatar upload and the route guards |
| Catalogue | The product model, the admin datatable, the bulk delete and the image uploads | The public catalog, the filters, the pagination and the wishlist |
| Orders and payments | The checkout, the stock reduction, the status flow and the PDF receipt | The customer order pages and the admin transaction controls |
| Reviews | The purchaser rule, the profanity filter and the rating recalculation | The review interface on the product, account and order pages |
| Appraisals, services and tickets | The appraisal state machine, the photo upload and the conversion | The service catalogue, the ticket flow and the status timeline |
| Dashboard and assistant | The aggregation endpoint and the date range | The Recharts dashboard and the chat widget |
| 3D and design system | The Three.js hero, the fallbacks and the black and gold tokens | The shared Bootstrap and MUI components and the responsive pass |
| Tests and documentation | The Jest and Supertest suite | This README, the setup guide and the assessment matrix |

---

## 12. Project documents

| File | Content |
|---|---|
| `AUREO_PROJECT_SPEC.md` | The functional requirements, the data model, the API table and the design requirements |
| `AUREO_BUILD_PLAN.md` | The phase by phase build plan and the assessment alignment |
| `PROJECT_ARCHITECTURE_REFERENCE.md` | The reference layering and the request flow |
| `PROJECT_REQUIREMENTS.md` | The requirements of the professor |
| `AUREO_SETUP_GUIDE.md` | The step by step setup for every provider |
