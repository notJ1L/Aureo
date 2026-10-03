# AUREO — Watch E-Commerce (MERN) — Project Spec for GitHub Copilot

> Read this file fully before generating code. It is the single source of truth for what we are building, how it is structured, and how it must look.
> Suggested location: `.github/copilot-instructions.md` (Copilot reads it automatically) or the repo root as `AUREO_PROJECT_SPEC.md`.

---

## 1. Project Summary

**AUREO** is a **local-host-only** MERN web app for buying, selling, and servicing watches.

- Visitors browse **new** and **second-hand** watches.
- Users buy watches (mock payment), sell their own watches via **appraisals**, open **service tickets**, review purchased watches, keep a wishlist, and chat with a simple **AI assistant**.
- Admins manage everything and see a dashboard.
- Nothing is deployed. Everything runs on `localhost`.

**Team:** Marcus S. Aristain, Jonel A. Caisip (BSIT-S-3A). **Instructor:** Mr. Rommel M. Dalisay.

---

## 2. Tech Stack

| Layer | Tools |
|---|---|
| Frontend | React + Vite, React Router, Axios, Redux + Redux Thunk, React Bootstrap (or MUI), React Toastify, SweetAlert2, Recharts |
| 3D (frontend) | three.js, @react-three/fiber, @react-three/drei |
| Backend | Node.js, Express (CommonJS `require`), JWT (`jsonwebtoken`), `bcryptjs`, Multer, `cors`, `dotenv` |
| Database | MongoDB (local) + Mongoose |
| External | Cloudinary (images only) |
| Mocked | Email, payment, (AI may be rule-based) |

Backend uses CommonJS (`require`). Frontend uses ES modules (`import`). Do not mix within a side.

---

## 3. UI / Design Requirements (MANDATORY)

### 3.1 Theme: **Black and Gold, luxury watch brand, with 3D elements**

**Color tokens** (define as CSS variables in `frontend/src/index.css` and use them everywhere; never hard-code random colors):

```css
:root {
  --bg-page: #0f1115;        /* near-black page background */
  --bg-card: #171a20;        /* cards, panels */
  --bg-elevated: #1f232b;    /* image wells, inputs, hover */
  --border: #2a2d33;         /* hairline borders */
  --gold: #c9a45c;           /* primary accent: CTAs, prices, active states */
  --gold-hover: #d8b574;
  --text-primary: #f4efe6;   /* warm off-white */
  --text-secondary: #b8b2a6;
  --text-muted: #7d786e;
  --danger: #e5484d;         /* errors only */
  --success: #3fb97f;        /* success only */
}
```

**Rules**

- Page background is always black/near-black. Gold is the single accent color.
- Primary button: gold background, black text. Secondary button: transparent, gold 1px border, gold text.
- Prices, active nav items, rating stars, and focus rings use gold.
- Headings: clean sans-serif (e.g. Inter/Poppins) or an elegant serif for the logo/hero. Logo `AUREO` uses wide letter-spacing in gold.
- Keep layouts clean with generous spacing. Cards: `--bg-card`, 1px `--border`, 10–12px radius.
- Override React Bootstrap/MUI defaults so no default blue/white components appear (tables, modals, forms, dropdowns, pagination, toasts must all be dark themed).
- Minimum body text 14px; maintain readable contrast (off-white on black).
- Responsive: works on laptop and mobile widths.

### 3.2 3D Design — "3D where it matters"

Do **not** build the entire site as a 3D scene. Keep catalog, forms, cart, and admin pages as clean, fast, flat UI. Use 3D for:

1. **Home hero (required):** an interactive 3D watch (rotates/tilts with mouse movement, slow idle rotation, gold case and dark dial, live-time hands if possible). Use `@react-three/fiber` + `drei` (`OrbitControls` limited to rotate, `Environment`, `Float`). A `.glb` watch model may be loaded; if no model is available, build a simple watch from primitives (cylinder case, dial, hands, crown, strap).
2. **Product detail page (nice-to-have):** a small 3D viewer or a rotatable gallery for the selected watch.
3. **Micro-interactions (optional):** card tilt on hover (CSS `perspective` + `rotateX/Y`), smooth page transitions.

**3D requirements**

- Lazy-load the 3D canvas (`React.lazy` + `Suspense`) with a dark skeleton loader.
- Provide a **fallback** (static image or CSS 3D watch) when WebGL is unavailable or on very small screens.
- Respect `prefers-reduced-motion` (disable idle auto-rotation).
- Never block navigation or checkout behind 3D loading.
- Limit to one `<Canvas>` per page; dispose resources on unmount.

### 3.3 Page / Layout Map

- **Navbar:** `AUREO` logo (gold), Shop, Sell your watch, Services, Wishlist, search, cart (badge), user menu. Admin link only for admins.
- **Home:** 3D hero + CTA ("Shop watches", "Sell yours") + featured watches grid.
- **Catalog:** filter sidebar (brand, movement, case size, condition, price range), search, product grid, pagination. Second-hand cards show a "Second-hand" badge; sold items show a "Sold" badge.
- **Product details:** gallery/3D viewer, specs, price, stock, add to cart, wishlist heart, reviews.
- **Cart / Checkout:** shipping info, payment method (Cash, Dummy Credit Card, E-Wallet GCash/Maya), order summary.
- **My Account:** profile (photo upload, edit details), my orders, my appraisals, my tickets, wishlist.
- **Sell Your Watch:** appraisal form with multi-photo upload.
- **Services & Tickets:** services list, open ticket form, ticket status timeline.
- **Chat widget:** floating button (bottom-right), logged-in users only.
- **Admin:** dashboard (Recharts), products, orders, appraisals, services, tickets, users, mock emails — all in the same black/gold theme.

---

## 4. Architecture (follow the course reference)

Client–server REST architecture. Every feature follows this chain:

```
React component -> Redux action / Axios -> Express route -> Middleware -> Controller -> Mongoose model -> MongoDB
                                                                          -> JSON response -> React state -> UI
```

Principle: **frontend displays and collects; backend validates and enforces rules; database stores.**

### 4.1 Folder structure

```
aureo/
|-- backend/
|   |-- server.js            # starts server: env, DB connect, listen
|   |-- app.js               # configures Express: cors, json, routes, error handler
|   |-- config/              # database.js, cloudinary.js, .env
|   |-- routes/              # auth, product, order, review, appraisal, service, ticket, dashboard, chat
|   |-- controllers/         # same names as routes
|   |-- models/              # user, product, order, review, appraisal, service, ticket, mockEmail, chatHistory
|   |-- middlewares/         # auth.js, errors.js, requireVerified.js
|   |-- utils/               # apiFeatures, multer, cloudinary, mockEmail, mockPayment, chatEngine,
|   |                        # catchAsyncErrors, errorHandler
|   |-- seeder/              # seed.js
|
|-- frontend/src/
    |-- main.jsx, App.jsx
    |-- components/          # Layout, Product, Cart, Order, User, Review, Chat, Admin, three (3D)
    |-- pages/
    |-- routes/              # ProtectedRoute.jsx, AdminRoute.jsx
    |-- redux/               # store.js, actions/, reducers/, constants/
    |-- services/            # api.js (single Axios instance)
    |-- utils/
```

**Layer rules:** routes only map URL → controller. Controllers hold business logic. Models hold schema, validation, queries. Middleware guards access. Utils hold reusable code.

### 4.2 Conventions

- All API URLs start with `/api/v1`.
- Every response: `{ success: true|false, message?, ...data }` with correct HTTP status (200, 201, 400, 401, 403, 404, 500).
- Wrap controllers with `catchAsyncErrors`; throw `ErrorHandler(message, statusCode)`; one central error middleware, registered **last** in `app.js`.
- Secrets only in `backend/config/.env`; commit `.env.example`; `.env` is git-ignored.
- Frontend uses **one** shared Axios instance (`services/api.js`) with `baseURL` and a request interceptor adding `Authorization: Bearer <token>`.
- CORS allows only `http://localhost:5173`.
- Always paginate list endpoints.
- Never return passwords, verification tokens, or stack traces to the client.
- Validate on the backend even if the frontend validates.

---

## 5. Authentication & Security Decisions

- **JWT in the `Authorization: Bearer <token>` header** (per FRD FR 1.1; NOT cookies). Token stored in `localStorage` on the client.
- `isAuthenticatedUser` verifies the token and **re-loads the user from MongoDB on each request**.
- `authorizeRoles("admin")` enforces roles. **Every route under `/admin` must use both middlewares.**
- Admin accounts are created only by the seed script, never by public registration.
- Login errors use one generic message: `Invalid email or password`.
- Passwords hashed with bcrypt in a Mongoose `pre("save")` hook; `password` field has `select: false`.
- The server **always recalculates prices and totals** from the database. Never trust client prices.
- Card numbers/CVV are never stored or logged.
- Use `findOneAndUpdate` with a stock condition for atomic stock reduction (no transactions; local MongoDB is standalone).

---

## 6. Data Model

| Model | Key fields | Rules |
|---|---|---|
| **User** | name, email (unique), password (hashed, select:false), contactNumber, address, avatar `{public_id,url}`, role (`user`\|`admin`), isVerified, verificationToken, wishlist `[ProductId]` | Admin by seeding only. Wishlist uses `$addToSet`/`$pull`. |
| **Product** | name, brand, movement, caseSize, condition (`new`\|`second-hand`), price, description, images `[{public_id,url}]`, stock, isActive, ratings, numOfReviews | Second-hand ⇒ stock must be exactly 1 (enforce in model `pre("validate")` and controller). |
| **Order** | user, orderItems `[{product,name,price,quantity,image}]`, shippingInfo, paymentMethod, paymentStatus, totalPrice, status (`Pending`\|`Paid`\|`Shipped`\|`Completed`\|`Cancelled`), statusHistory, createdAt | Snapshot name and price at purchase time. |
| **Review** | user, product, rating (int 1–5), comment, createdAt | **Unique index on (user, product).** |
| **Appraisal** | user, brand, model, movement, caseSize, condition, year, hasBox, hasPapers, askingPrice, photos `[{public_id,url}]`, status (`Pending`\|`Offer Made`\|`Accepted`\|`Rejected`), offerPrice, convertedProduct | |
| **Service** | name, description, price (> 0) | |
| **Ticket** | ticketNumber (unique), user, service, watchBrand, watchModel, problemDescription, status (`Received`\|`Diagnosing`\|`Waiting for Parts`\|`Completed`), statusHistory `[{status, changedAt}]` | |
| **MockEmail** | to, subject, body, type (`verification`\|`order`\|`ticket`), relatedId, sentAt | Shared by FR 1.5, 4.5, 5.4. |
| **ChatHistory** | user (unique), messages `[{role,content,timestamp}]`, preferences `{budget,style,brand,movement}` | One document per user. |

**Relationships:** User 1—N Order/Appraisal/Ticket/Review; User 1—1 ChatHistory; Order N—N Product (embedded orderItems); Product 1—N Review; Service 1—N Ticket; Appraisal 0..1—1 Product (when converted).

---

## 7. Functional Requirements (from the FRD)

### 1. User Authentication & Access Control

**FR 1.1 — User Registration, Login (JWT) & Authentication**
A visitor can register with name, email, and password. A registered user can log in with email and password; the server returns a JWT that is attached to later requests.
- Passwords hashed before storing; never plain text.
- Email unique; duplicate registration rejected with a clear error.
- Protected routes reject missing, invalid, or expired tokens (401).
- Token sent in the `Authorization` header as a Bearer token.

**FR 1.2 — User Page & Personal Details**
Every logged-in user has a User Page showing name, email, contact number, delivery address, profile photo, and role. The user can edit and save these details.
- A user can only view/edit their own profile.
- Email and role cannot be changed from the edit form.
- Required fields validated before saving.

**FR 1.3 — Profile Photo Upload**
A user can upload a profile photo from the User Page; it replaces any earlier photo.
- Only images (JPG, PNG) with a maximum file size.
- Uploaded to Cloudinary; only the returned URL (and public_id) saved on the user.

**FR 1.4 — Role-Based Access Control**
Middleware checks the user's role and separates Admin from Standard User. Standard users are blocked from all admin CRUD pages/routes (products, orders, services, tickets, users, dashboard).
- Returns 403 Forbidden when a Standard User calls an admin route.
- Admin pages hidden in the frontend for non-admins.
- Admin accounts created by seeding, not public registration.

**FR 1.5 — Mocked Email Verification**
After registration the system creates a verification link and "sends" it. Opening the link marks the account as verified.
- Mocked: no real email. Message printed to the server console and saved in the `MockEmail` collection.
- Unverified users can log in but cannot place orders, submit appraisals, or open tickets until verified.

### 2. Watch Product Management & Inventory

**FR 2.1 — Admin Product CRUD**
Admins create, view, update, and delete watch listings (new and second-hand). Each has name, brand, movement, case size, condition, price, description, images, stock. Anyone can browse.
- Only Admins can create, update, delete.
- Images uploaded to Cloudinary, stored as URLs.
- Deleting a product that appears in existing orders marks it **inactive** instead of removing it.

**FR 2.2 — Single-Unit Inventory Enforcement**
A second-hand watch is unique: exactly one unit. Brand new watches can have multiple.
- Second-hand forced to stock = 1; any other value rejected on create and update.
- When a second-hand watch is ordered, stock becomes 0 and the listing shows **Sold**.
- Orders requesting more than available stock are rejected.
- Stock reduced when an order is placed and restored if the order is cancelled.

**FR 2.3 — Advanced Search & Filter**
Search/filter by brand, movement (automatic, quartz, manual), case size, condition, and price range. Filters can be combined.
- Query params, e.g. `?brand=Seiko&condition=new&minPrice=100&maxPrice=500`.
- Empty filters ignored; results show in-stock or clearly marked sold items.
- Available to all visitors without login.

**FR 2.4 — Wishlist Functionality**
A logged-in user can save new or pre-owned watches to a wishlist, view it, and remove items.
- A watch appears only once per wishlist.
- Users only see/change their own wishlist.
- If a wishlisted second-hand watch is sold, it stays listed but marked Sold.

### 3. Watch Buying & Appraisals (User Selling)

**FR 3.1 — Appraisal Submission (Sell Your Watch)**
A logged-in user submits an appraisal form: brand, model, movement, case size, condition, year, box/papers included, asking price.
- Only verified, logged-in users can submit.
- All specification fields required and validated.
- Status: Pending, Offer Made, Accepted, or Rejected.
- Users can view only their own appraisals.

**FR 3.2 — Appraisal Photo Upload**
User uploads photos (front, back, movement, box) with the appraisal.
- Uploaded to Cloudinary; URLs saved on the appraisal.
- At least one photo required; max photo count and file size enforced.

**FR 3.3 — Admin Appraisal Review**
Admins view all appraisals, inspect specs and photos, and set an offer price or reject. The user then accepts or rejects the offer.
- Admin only.
- When an offer is accepted, the admin can convert the appraisal into a second-hand product with stock = 1.
- Accepted offer amounts count as expenses in the Admin Dashboard (FR 4.4).

### 4. Shopping & Transactions

**FR 4.1 — Order CRUD**
A logged-in user adds watches to a cart, places an order with delivery address, views order history/details, and cancels an order not yet paid or shipped.
- Each order stores items, quantities, prices at time of purchase, total, payment method, status.
- Statuses: Pending, Paid, Shipped, Completed, Cancelled.
- Stock checked and reduced at creation (see FR 2.2).
- Users only see their own orders.

**FR 4.2 — Admin Order Management**
Admins view all orders, open any order, update status (Paid → Shipped → Completed), and delete invalid/test orders.
- Admin only.
- Every status change triggers a mocked email (FR 4.5).
- Completed orders cannot move back to an earlier status.

**FR 4.3 — Mock Payment Integration**
At checkout the user chooses Cash, Dummy Credit Card, or E-Wallet. The system simulates payment and marks the order paid or failed.
- Mocked: no real processing, no payment provider.
- Dummy card details validated for format only and never stored.
- E-Wallet simulated with a choice such as GCash or Maya; no real login.
- Cash = pay-on-delivery: order stays Pending until an Admin marks it Paid.
- Mock payment succeeds by default; a designated test card number simulates failure.

**FR 4.4 — Admin Dashboard**
Dashboard shows totals for sales, expenses, number of orders, and current inventory.
- Sales = total of orders that are Paid or later.
- Expenses = total of accepted appraisal offers plus service costs.
- Orders = count by status. Inventory = count of in-stock new and second-hand watches.
- Admin only.

**FR 4.5 — Mocked Order Notifications**
The system emails the customer when an order is placed and every time its status changes.
- Mocked: logged to console and saved in `MockEmail`.
- Each email contains order number, new status, and order total.

### 5. Services & Aftersales

**FR 5.1 — Service CRUD**
Platform offers watch servicing (cleaning, repairing, adjusting). Admins create/update/delete services (name, description, price). All users can view them.
- Only Admins can create, update, delete.
- Price must be a positive number.

**FR 5.2 — Ticket-Based Support System**
A logged-in user opens a support ticket with the chosen service, watch details (brand, model), and a problem description. The user views all their own tickets.
- Only verified, logged-in users can open tickets.
- Users see only their own tickets; Admins see all.
- Each ticket gets a unique ticket number.

**FR 5.3 — Service Ticket State Tracking**
Every ticket has a status. Users track it on their ticket page; Admins update it.
- Statuses: Received, Diagnosing, Waiting for Parts, Completed.
- Only Admins can change status.
- Each status change saved with date and time so the user sees history.

**FR 5.4 — Mocked Service Notifications**
The system emails the user whenever their ticket status changes.
- Mocked: console + `MockEmail` collection.
- Each email contains ticket number and new status.

### 6. Product Reviews

**FR 6.1 — Reviews CRUD**
Users write, edit, and delete reviews (star rating + comment) for brand new watches. All visitors can read reviews.
- Brand new watches only; second-hand cannot be reviewed.
- Rating is a whole number 1–5.
- Users edit/delete only their own reviews; Admins can delete any.

**FR 6.2 — Automated Review Verification**
Before saving, the system checks orders to confirm the user successfully purchased that specific watch; otherwise the review is rejected.
- Only orders with status Paid, Shipped, or Completed count.
- Cancelled or pending orders do not qualify.
- One review per user per watch.

### 7. AI Assistant Integration

**FR 7.1 — Simple AI Chat**
A chat box lets a logged-in user talk to an AI helper that matches watches to the user's preferences (style, brand, movement) and budget and answers general questions about watches and the platform.
- Recommendations come from products currently in stock.
- Response may be mocked or rule-based.
- Only logged-in users can use the chat.

**FR 7.2 — Context Retention**
Every message and reply is saved. When the user returns, the assistant loads previous interactions and remembers budget and style preferences.
- Stored per user in `ChatHistory`.
- Detected preferences saved on the user's chat record and updated when new ones are stated.
- Recent messages and saved preferences sent as context with each new chat request.
- Users can only access their own chat history.

---

## 8. REST API (all under `/api/v1`)

| Area | Method | Endpoint | Access |
|---|---|---|---|
| Auth | POST | `/register` | Public |
| | POST | `/login` | Public |
| | GET | `/logout` | Logged in (client discards token) |
| | GET | `/verify-email/:token` | Public |
| | GET | `/me` | Logged in |
| | PUT | `/me/update` (multipart) | Logged in |
| Users (admin) | GET | `/admin/users` | Admin |
| | GET/PUT/DELETE | `/admin/user/:id` | Admin |
| | GET | `/admin/mock-emails` | Admin |
| Products | GET | `/products?brand=&movement=&caseSize=&condition=&minPrice=&maxPrice=&keyword=&page=` | Public |
| | GET | `/product/:id` | Public |
| | POST | `/admin/product/new` | Admin |
| | PUT/DELETE | `/admin/product/:id` | Admin |
| Wishlist | GET | `/wishlist` | Logged in |
| | POST/DELETE | `/wishlist/:productId` | Logged in |
| Orders | POST | `/order/new` | Verified user |
| | GET | `/orders/me` | Logged in |
| | GET | `/order/:id` | Owner or admin |
| | PUT | `/order/:id/cancel` | Owner, Pending only |
| | GET | `/admin/orders` | Admin |
| | PUT/DELETE | `/admin/order/:id` | Admin |
| Reviews | GET | `/product/:id/reviews` | Public |
| | POST | `/product/:id/review` | Verified purchaser |
| | PUT/DELETE | `/review/:id` | Owner (admin may delete any) |
| Appraisals | POST | `/appraisal/new` (multipart) | Verified user |
| | GET | `/appraisals/me` | Logged in |
| | GET | `/appraisal/:id` | Owner or admin |
| | PUT | `/appraisal/:id/respond` | Owner (status = Offer Made) |
| | GET | `/admin/appraisals` | Admin |
| | PUT | `/admin/appraisal/:id` | Admin (offer or reject) |
| | POST | `/admin/appraisal/:id/convert` | Admin (Accepted only) |
| Services | GET | `/services` | Public |
| | POST | `/admin/service/new` | Admin |
| | PUT/DELETE | `/admin/service/:id` | Admin |
| Tickets | POST | `/ticket/new` | Verified user |
| | GET | `/tickets/me` | Logged in |
| | GET | `/ticket/:id` | Owner or admin |
| | GET | `/admin/tickets` | Admin |
| | PUT | `/admin/ticket/:id` | Admin |
| Dashboard | GET | `/admin/dashboard` | Admin |
| Chat | POST | `/chat` | Logged in |
| | GET | `/chat/history` | Logged in |

---

## 9. Assumptions (FRD gaps — keep unless the instructor says otherwise)

1. Dashboard **Expenses** = sum of accepted appraisal offers (service costs excluded unless a cost field is added later).
2. Service tickets have no payment.
3. Decline test card number for mock payment: `4000 0000 0000 0002`; any other valid-format number succeeds.
4. Unverified users can log in but get **403** with a "verify your email" message on orders, appraisals, and tickets.
5. Users can cancel only **Pending** orders.
6. AI chat is **rule-based** first (regex/keyword extraction for budget, brand, movement, style); a real LLM is optional and must be called from the backend only.
7. Second-hand watches: quantity above 1 is rejected.
8. Appraisal photos: min 1, max 6, 5 MB each. Profile photo: JPG/PNG, max 2 MB.
9. Order status flow: Pending → Paid → Shipped → Completed; Completed can never go back.

---

## 10. Instructions for Copilot

**Do**

- Follow the folder structure and layering in section 4. One feature = model, route, controller, (middleware), Redux action/reducer, page/component.
- Build in **vertical slices**, one FR at a time; do not scaffold everything at once.
- Use the black and gold tokens from section 3 for all UI; use the 3D hero as described.
- Add loading, error, and empty states to every list/detail page; confirm destructive actions with SweetAlert2.
- Use Toastify for success/error messages.
- Use the shared Axios instance; never hard-code API URLs in components.
- Validate input in Mongoose schemas and controllers; sanitize query params (strip keys starting with `$`).
- Add ownership checks on every "my …" and `:id` endpoint.
- Write small, readable code with consistent camelCase naming and short comments only where the logic is non-obvious.

**Do not**

- Do not use cookies for auth; use the Bearer header.
- Do not trust prices, totals, roles, or user IDs from the request body.
- Do not leave any `/admin` route without `isAuthenticatedUser` + `authorizeRoles("admin")`.
- Do not store card data, passwords in plain text, or secrets in code.
- Do not add real email or payment providers.
- Do not make the whole site a 3D scene; keep 3D to the hero and product viewer.
- Do not invent features outside this spec. If something is unclear, list it as a question or assumption.

**Build order (follow it)**

0. Tooling → 1. Scaffold + `/health` → 2. Models + seed → 3. Auth (FR 1.x) → 4. Products (FR 2.x) → 5. Cart/Orders/Payment/Notifications (FR 4.1–4.3, 4.5) → 6. Reviews (FR 6.x) → 7. Appraisals (FR 3.x) → 8. Services/Tickets (FR 5.x) → 9. Dashboard (FR 4.4) → 10. AI chat (FR 7.x) → 11. Hardening, tests, README.

**Definition of done for each feature:** model + route + controller + middleware + UI page; happy path and failure paths tested (400/401/403/404); correct role blocked; UI uses the black and gold theme.
