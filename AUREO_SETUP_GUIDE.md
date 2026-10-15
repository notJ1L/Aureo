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

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

ADMIN_EMAIL=your_admin_email@gmail.com
ADMIN_PASSWORD=your_strong_admin_password
```

Never commit or upload `backend/config/.env`.

### Supabase

Create a Supabase project and enable email/password authentication. Add `http://localhost:5173` to the Supabase authentication URL allowlist. The service-role key is backend-only and must never be exposed to the frontend.

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

Supabase and Firebase users are created through their authentication flows. The Aureo seed script creates the local MongoDB admin profile and must not create provider passwords.

Expected output includes:

```text
MongoDB connected
Admin account updated
Sample products and services seeded
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
http://localhost:5173/
http://localhost:5173/login
http://localhost:5173/register
```

## 10. Basic Test Flow

Use the frontend to test:

1. Open the store landing page.
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

## 11. Final Deployment on Render

Deployment is intentionally last. Complete the local smoke test and production build first.

1. Create a Render web service for `backend` and a static site for `frontend`.
2. Set the backend start command to `npm start` and the frontend build command to `npm run build`.
3. Add production environment variables without committing them.
4. Use MongoDB Atlas for `MONGO_URI` in production.
5. Set the production frontend URL in Render, Supabase redirect URLs, Firebase authorized domains, Cloudinary settings, and backend CORS.
6. Verify `/api/v1/health`, email/password auth, Google sign-in, JWT-protected requests, image uploads, and the SPA fallback.

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

The following project documents may be ignored by Git depending on the current `.gitignore` configuration:

- `AUREO_PROJECT_SPEC.md`
- `PROJECT_ARCHITECTURE_REFERENCE.md`
- `AUREO_BUILD_PLAN.md`

Copy them separately to another computer if they are not present after cloning, or remove their ignore rules if they should be versioned in Git.
