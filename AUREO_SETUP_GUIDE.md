# Aureo Setup Guide

This guide explains how to run Aureo on another computer.

Aureo is a MERN application with:

- React + Vite frontend
- Node.js + Express backend
- MongoDB database
- Supabase email/password authentication
- Firebase Google sign-in
- Backend-issued Bearer JWT authentication
- Cloudinary image storage
- Render deployment after local development and testing

## 1. Prerequisites

Install the following:

- Git
- Node.js 24 or newer
- npm
- MongoDB access through MongoDB Atlas or a local MongoDB installation
- Supabase project
- Firebase project with Google sign-in enabled
- Cloudinary account
- Render account for the final deployment phase

Verify the tools:

```powershell
node --version
npm --version
git --version
```

Node.js 20 or newer is also acceptable, but the development machine currently uses Node.js 24.

## 2. Clone the Repository

```powershell
git clone https://github.com/notJ1L/Aureo.git
cd Aureo
```

The repository contains source code and package files. It does not contain `node_modules` or real environment secrets.

## 3. Install Backend Dependencies

```powershell
cd backend
npm install
```

## 4. Create the Backend Environment File

Create this file manually:

```text
backend/config/.env
```

Use `backend/config/.env.example` as the template. Add the correct values for the new computer:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_new_long_random_secret
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
API_URL=http://localhost:3000/api/v1

SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id
FIREBASE_CLIENT_EMAIL=your_firebase_service_account_client_email
FIREBASE_PRIVATE_KEY="your_firebase_service_account_private_key"

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

SMTP_HOST=smtp.gmail.com
SMTP_SECURE=false
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=Aureo <your_email@example.com>
VERIFICATION_CODE_EXPIRE_MINUTES=10

ADMIN_EMAIL=your_admin_email@gmail.com
ADMIN_PASSWORD=your_strong_admin_password
```

`CLIENT_URL` holds the allowed frontend origins. Use a single value during local development and a comma separated list (for example `http://localhost:5173,https://aureo.onrender.com`) once the app is deployed.

The `SMTP_*` and `EMAIL_FROM` values are optional. They are only used to deliver the six digit
verification code. Without them Aureo still works, because Supabase sends the confirmation message
itself. The Firebase service account values (`FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY`) are
only needed when the Google sign-in token has to be verified against a real Firebase project.

Never commit or upload `backend/config/.env`.

### Supabase

Create a Supabase project and enable email/password authentication. Add `http://localhost:5173` to the Supabase authentication URL allowlist. The service-role key is backend-only and must never be exposed to the frontend.

**Email template (important):** in the Supabase dashboard open **Authentication → Email Templates → Confirmation Template** and use the **"Email code" (6 digit OTP)** variant. Aureo asks the user for a 6 digit code, so a plain confirmation link will not match the interface.

**Fallback code:** Aureo also emails its own 6 digit code through the SMTP settings below. If the Supabase SMTP provider is rate limited or not configured yet, the user can still complete the verification with the Aureo code. The backend accepts either channel.

**What Supabase owns:** the email address, the password and the confirmation link. The password is never stored in MongoDB, Aureo only keeps the `supabaseUserId` provider id and issues its own Bearer JWT after the identity is confirmed.

**Unverified accounts:** a user may sign in before confirming the address, but `isVerified` stays `false` and the `requireVerified` middleware answers with **403** on orders, appraisals and tickets until the code is accepted.

### Firebase

Create a Firebase project, enable Google as a sign-in provider, and register the Vite web app. Add `localhost` to authorized domains during development. Use Firebase only for Google identity; Aureo application data remains in MongoDB.

### Cloudinary

Create an upload configuration for Aureo. Product, appraisal, and profile images are uploaded by the backend and only `{ public_id, url }` metadata is stored in MongoDB.

### MongoDB

If using MongoDB Atlas:

- Use the Atlas connection string for `MONGO_URI`.
- Add the computer's IP address to Atlas Network Access.
- Make sure the database user has permission to read and write the Aureo database.

If using local MongoDB, use a connection string such as:

```env
MONGO_URI=mongodb://127.0.0.1:27017/aureo
```

## 5. Seed the Database

From the `backend` directory:

```powershell
npm run seed
```

The seed script creates or updates:

- The admin account
- Sample watch products
- Sample services

The products use the categories `dress`, `diver`, and `chronograph`, so the category filter in the
catalogue has something to match on the first run.

Supabase and Firebase users are created through their authentication flows. The Aureo seed script creates the local MongoDB admin profile and must not create provider passwords.

Expected output includes:

```text
MongoDB connected
Admin account created
Sample products and services seeded
```

The script is safe to run more than once. It updates the admin account and the sample records
instead of creating duplicates.

If the admin password is ever lost, reset it with:

```powershell
npm run clear:users
```

## 6. Start the Backend

From `backend`:

```powershell
npm run dev
```

Expected output:

```text
MongoDB connected
Aureo server running on port 3000
```

Test the backend in a browser:

```text
http://localhost:3000/api/v1/health
```

Expected response:

```json
{
  "success": true,
  "message": "Aureo API is running"
}
```

Keep this terminal running.

## 7. Install Frontend Dependencies

Open a second terminal from the project root:

```powershell
cd frontend
npm install
```

## 8. Build the Frontend

From `frontend`:

```powershell
npm run build
```

A successful build creates `frontend/dist/`. This directory is generated output and is ignored by Git.

## 9. Start the Frontend

From `frontend`:

```powershell
npm run dev
```

Vite will display a URL similar to:

```text
http://localhost:5173/
```

Open that URL in a browser. Do not type the URL into PowerShell.

The current frontend routes include:

```text
http://localhost:5173/                  store landing page with the 3D hero
http://localhost:5173/catalog           catalogue with the price, category, ratings and review filters
http://localhost:5173/product/:id       product detail with reviews
http://localhost:5173/services          watch servicing services
http://localhost:5173/sell              sell your watch (appraisal form)
http://localhost:5173/login
http://localhost:5173/register
http://localhost:5173/me                profile, orders, appraisals, tickets, wishlist
http://localhost:5173/cart
http://localhost:5173/checkout
http://localhost:5173/orders
http://localhost:5173/order/:id
```

The signed-in routes are protected, and the `/admin` routes additionally require the admin role:

```text
http://localhost:5173/admin/products    product datatable with bulk delete
http://localhost:5173/admin/services    service datatable with bulk delete
http://localhost:5173/admin/orders      transaction status controls
http://localhost:5173/admin/appraisals  appraisal offers and conversion
http://localhost:5173/admin/tickets     ticket status updates
http://localhost:5173/admin/dashboard   sales charts with a date-range filter
```

## 10. Basic Test Flow

Use the frontend to test:

1. Open the store landing page. The 3D hero loads on its own and never blocks the page.
2. Open the registration page.
3. Register with a real recipient email.
4. Enter the six-digit email verification code.
5. Sign in.
6. Confirm the JWT is saved in the browser.
7. Update the profile.
8. Sign out.

The backend API can also be tested at:

```text
http://localhost:3000/api/v1/products
```

## 10.1 Full Feature Test Flow

Once the basic flow works, the rest of Aureo can be checked in the browser:

1. Filter the catalogue by price, category, ratings, and review count. The results and the URL
   update together.
2. Save a watch to the wishlist and remove it again.
3. Add a watch to the cart, pick a payment method at checkout, and place the order.
4. Pay the cash order from **Admin → Orders** and watch the status move to `Paid`, then `Shipped`,
   then `Completed`. The customer receives a mocked email with the item list, the subtotals, the
   grand total, and a PDF receipt.
5. Submit a product review. Only a verified purchaser of a brand new watch is allowed to do this.
6. Submit an appraisal with photos, then accept the offer from **Admin → Appraisals** and convert it
   into a second-hand product.
7. Open a service ticket and move it through its statuses from **Admin → Tickets**.
8. Open **Admin → Dashboard** and narrow the sales chart with the from/to date fields.
9. Open the chat widget, state a budget and a brand, and confirm the assistant remembers them.

## 10.2 Backend Tests

The backend has an automated test suite. It uses the database from `MONGO_URI` with the name
`_test` appended, so it never touches the development data.

```powershell
cd backend
npm test
```

Expected output:

```text
Test Suites: 7 passed, 7 total
Tests:       114 passed, 114 total
```

The suite covers authentication, the product catalogue and filters, orders and the mock payment,
reviews and the bad-word filter, appraisals, services and tickets, and the dashboard metrics. It
needs a reachable MongoDB instance.

## 11. Final Deployment on Render

Deployment is intentionally last. Complete the local smoke test and production build first.

`render.yaml` in the repository root is the blueprint. It declares two services:

- `aureo-api` — the Express API, built with `npm install`, started with `npm start`, and health
  checked at `/api/v1/health`.
- `aureo-storefront` — the Vite storefront, built with `npm install && npm run build`, published
  from `./dist`, with the SPA fallback rewrite for every unknown path.

Steps:

1. Push the repository to GitHub.
2. In Render choose **New → Blueprint**, select the repository, and apply `render.yaml`.
3. Fill in every environment variable marked `sync: false`. The API needs `MONGO_URI`,
   `CLIENT_URL`, the Supabase keys, the Firebase keys, the Cloudinary keys, the SMTP keys, and the
   admin credentials. The storefront needs `VITE_API_URL` and the `VITE_SUPABASE_*` and
   `VITE_FIREBASE_*` keys.
4. Use MongoDB Atlas for `MONGO_URI` in production.
5. Set the production frontend URL in Render, Supabase redirect URLs, Firebase authorized domains,
   Cloudinary settings, and the backend CORS list.
6. Verify `/api/v1/health`, email/password auth, Google sign-in, JWT-protected requests, image
   uploads, and the SPA fallback.

The frontend build reads `VITE_API_URL` at build time. Because Render rebuilds the static site on
every deploy, a changed API URL only takes effect after a new build.

## 12. Common Problems

### Backend cannot connect

Check:

- MongoDB is running or Atlas is reachable.
- `MONGO_URI` is correct.
- Atlas Network Access allows the computer.
- The database password has not expired or changed.

### `Cannot find module`

Run the install command from the correct folder:

```powershell
cd backend
npm install
```

or:

```powershell
cd frontend
npm install
```

### Frontend does not load

Start Vite from the `frontend` folder:

```powershell
npm run dev
```

The browser URL belongs in the browser, not in the terminal.

### Verification email does not arrive

Check:

- Supabase email provider settings.
- Supabase redirect and site URL settings.
- Spam or junk folder.
- The user's email address and verification state in Supabase.

### Port already in use

Stop the old backend or frontend terminal with:

```text
Ctrl + C
```

Then restart the correct project.

## 13. Security Rules

Never commit:

```text
backend/config/.env
```

Never share:

- MongoDB passwords
- Supabase service-role keys
- Firebase admin credentials
- Cloudinary API secrets
- JWT secrets
- Admin passwords
- JWT tokens

If a secret is accidentally exposed, rotate it immediately in MongoDB Atlas, Google, or the local environment configuration.

## 14. Documentation Files

The project documents live in the repository root:

- `AUREO_BUILD_PLAN.md` — the build phases and the current implementation status
- `AUREO_PROJECT_SPEC.md` — the functional requirements, data model, and API table
- `PROJECT_ARCHITECTURE_REFERENCE.md` — the layering, responsibilities, and request flow
- `PROJECT_REQUIREMENTS.md` — the assessment items and the coverage matrix
- `AUREO_SETUP_GUIDE.md` — this guide
- `AUREO_CHANGE_LOG.md` — what was changed, why it was needed, and the commands that were run

If a `.gitignore` rule hides any of them, remove that rule so the documents travel with the clone:

```text
git check-ignore -v AUREO_BUILD_PLAN.md
```

## 15. Repository Hygiene

Two habits keep the repository clean:

- `backend/node_modules` and `frontend/node_modules` are ignored. If they were ever committed, run
  `git rm -r --cached backend/node_modules frontend/node_modules` to untrack them.
- Every new source file has to be added to Git. A file that exists on disk but is not tracked breaks
  a clean clone, which is exactly what Render builds from. Use `git status` before pushing and
  confirm that no new file is listed as untracked.
