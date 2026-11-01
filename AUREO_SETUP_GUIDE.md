# Aureo — Teammate & Setup Guide

This guide provides step-by-step instructions for teammates, partners, and collaborators to clone, configure, run, and test **Aureo** on their local machine.

Aureo is a luxury haute horlogerie e-commerce platform built on the **MERN** stack:
- **Frontend**: React 18, Vite, Redux Toolkit, React Router 6, Vanilla CSS (Haute Horlogerie dark luxury design system)
- **Backend**: Node.js, Express, MongoDB (Mongoose)
- **Authentication**: Dual-provider integration (Supabase email/password with 6-digit OTP, Firebase Google OAuth, backend-issued Bearer JWT)
- **Cloud Assets**: Cloudinary for watch and appraisal photography
- **Deployment**: Render (user-managed deployment)

---

## 1. Prerequisites

Before starting, ensure your system has:
- **Node.js**: v20 or newer (v24 recommended)
- **npm**: v10 or newer
- **Git**: installed and configured
- **MongoDB**: Access to the project's MongoDB Atlas cluster (ask the project lead to whitelist your public IP) OR a local MongoDB instance (`mongodb://127.0.0.1:27017/aureo`)

Check your installed versions in PowerShell or Terminal:
```bash
node --version
npm --version
git --version
```

---

## 2. Quick Start for Partners / Collaborators

If your teammate has already shared the `.env` credentials with you, follow these 6 quick steps:

```bash
# 1. Clone repository
git clone https://github.com/notJ1L/Aureo.git
cd Aureo

# 2. Setup backend
cd backend
npm install
# Create backend/config/.env from the template or paste the team credentials
npm run seed     # Seeds admin account, sample watches, and services
npm run dev      # Runs API at http://localhost:3000

# 3. Setup frontend (in a separate terminal)
cd ../frontend
npm install
# Create frontend/.env from frontend/.env.example
npm run dev      # Runs Storefront at http://localhost:5173
```

---

## 3. Clone the Repository

```bash
git clone https://github.com/notJ1L/Aureo.git
cd Aureo
```

---

## 4. Backend Configuration & Setup

### 4.1 Install Dependencies
From the project root:
```bash
cd backend
npm install
```

### 4.2 Create the Environment File
Create the file `backend/config/.env` manually (you can copy `backend/config/.env.example` as a template):

```bash
# Windows PowerShell:
Copy-Item config/.env.example config/.env

# macOS / Linux:
cp config/.env.example config/.env
```

Fill in `backend/config/.env`:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_jwt_secret
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173

# Supabase Auth
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Firebase Google Sign-In
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id
FIREBASE_CLIENT_EMAIL=your_firebase_service_account_email
FIREBASE_PRIVATE_KEY="your_firebase_private_key"

# Cloudinary Media
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# SMTP Email Verification (Optional fallback)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=Aureo <your_email@gmail.com>
VERIFICATION_CODE_EXPIRE_MINUTES=10

# Initial Admin Credentials (used during npm run seed)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_strong_admin_password
```

> [!IMPORTANT]
> **MongoDB Atlas IP Access**: If using the team's MongoDB Atlas cluster, verify that your current public IP address is added to the Atlas **Network Access** IP whitelist. Otherwise, Mongoose will throw a `MongooseServerSelectionError`.

---

## 4.3 How Your Partner Can Access the MongoDB Database Directly

Your partner can inspect, query, and manage the database collections (`users`, `products`, `orders`, `appraisals`, `services`, `tickets`, `reviews`) using any of the following methods:

### Method A: MongoDB Compass (Desktop GUI — Recommended)
MongoDB Compass provides a full visual desktop client to browse, search, and edit database documents without opening a terminal.

1. **Download Compass**: Install [MongoDB Compass](https://www.mongodb.com/try/download/compass) (available for Windows, macOS, and Linux).
2. **Whitelist IP Address**:
   - The cluster owner logs into [MongoDB Atlas](https://cloud.mongodb.com/).
   - Go to **Security** → **Network Access**.
   - Click **Add IP Address** and either enter your partner's IP or click **Allow Access from Anywhere** (`0.0.0.0/0`) during collaborative development.
3. **Get the Connection URI**:
   - Copy the `MONGO_URI` from `backend/config/.env` (e.g. `mongodb+srv://<username>:<password>@cluster0.wkulir9.mongodb.net/aureo`).
4. **Connect**:
   - Open MongoDB Compass.
   - Paste the connection string into the **URI connection field**.
   - Click **Connect**.
   - Select the `aureo` database from the left sidebar to view and edit all collections in real time.

---

### Method B: MongoDB Atlas Web Dashboard (No Install Required)
If you want to grant your partner direct browser access to the cloud database:

1. **Invite Partner to the Atlas Project**:
   - The cluster owner goes to **Project Access Manager** (or **Access Management**) in MongoDB Atlas.
   - Click **Add New Member**.
   - Enter your partner's email address and assign the role:
     - `Project Data Access Read/Write` (or `Project Read Only` if they only need to view).
   - Click **Save**.
2. **Partner Access**:
   - Your partner accepts the email invitation and logs in at [cloud.mongodb.com](https://cloud.mongodb.com/).
   - Click **Database** under Deployment.
   - Click the **Browse Collections** button on `Cluster0`.
   - Under the `aureo` database, they can view all live documents, search with queries, and view indexes.

---

### Method C: Visual Studio Code MongoDB Extension
If your partner uses VS Code, they can view the database without leaving their code editor:

1. In VS Code, go to the **Extensions** tab (`Ctrl+Shift+X` or `Cmd+Shift+X`).
2. Search for and install **"MongoDB for VS Code"** (official extension by MongoDB).
3. Click the green MongoDB leaf icon in the VS Code sidebar.
4. Click **Add Connection** → **Connect with Connection String**.
5. Paste the `MONGO_URI` connection string and press Enter.
6. Expand `Cluster0` → `aureo` to inspect documents and run queries directly inside VS Code.

---

### Method D: Terminal via `mongosh` (Command Line)
If your partner prefers the command line:

1. Install `mongosh` (MongoDB Shell):
   ```bash
   npm install -g mongosh
   ```
2. Connect directly:
   ```bash
   mongosh "your_mongodb_connection_string"
   ```
3. Helpful commands to explore:
   ```javascript
   show dbs                  // Lists available databases
   use aureo                 // Switches to the Aureo database
   show collections          // Lists: users, products, orders, appraisals, services, tickets, reviews
   db.products.countDocuments() // Shows count of seeded watches
   db.products.find({ category: "diver" }).pretty() // Finds diver watches
   db.users.find({ role: "admin" }) // Confirms admin account exists
   ```

---

### 4.4 Seed the Database
Initialize sample watches, categories, services, and the admin account:
```bash
npm run seed
```

Expected output:
```text
MongoDB connected
Admin account created
Sample products and services seeded
```

### 4.5 Start the Backend Server
```bash
npm run dev
```

The backend starts at `http://localhost:3000`. Test the health check endpoint in your browser:
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

---

## 5. Frontend Configuration & Setup

### 5.1 Install Dependencies
Open a **second terminal** from the project root:
```bash
cd frontend
npm install
```

### 5.2 Create the Frontend Environment File
Create the file `frontend/.env` manually by copying `frontend/.env.example`:

```bash
# Windows PowerShell:
Copy-Item .env.example .env

# macOS / Linux:
cp .env.example .env
```

Ensure `frontend/.env` contains the required `VITE_` variables:

```env
# Backend API endpoint (v1)
VITE_API_URL=http://localhost:3000/api/v1

# Supabase Authentication Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key

# Firebase Google Authentication Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_web_app_id
```

> [!TIP]
> Frontend environment variables in Vite **must** start with `VITE_`. If you change anything in `frontend/.env`, restart the Vite dev server for the changes to take effect.

### 5.3 Verify the Production Build
```bash
npm run build
```
This builds the production bundle in `frontend/dist/` in under 1 second with 0 errors.

### 5.4 Start the Frontend Dev Server
```bash
npm run dev
```
Vite will serve the application at:
```text
http://localhost:5173/
```

Open `http://localhost:5173/` in your browser.

---

## 6. Frontend Pages & Navigation Routes

Aureo features a complete dark-theme Haute Horlogerie design:

| Route | Page & Key Features |
|---|---|
| `http://localhost:5173/` | **Storefront Landing**: Trust marquee, luxury editorial hero slider with CADRAN-inspired floating glass spotlight card, 4-column metrics proof bar (`2,400+ Delivered`, `100% Escapement Verified`, `±2s Variance`, `4.9 Collector Trust`), Four Pillars department banners, Curated Vault Collection with interactive filter tabs (`All Curations`, `Chronographs`, `Divers`, `Heritage Dress`, `Pre-Owned`), CADRAN-inspired interactive parameter selector ("Not Sure Which Reference Fits?"), Master Horology Atelier craftsmanship feature with 3 diagnostic pillars, verified collector testimonials, and private maison services. |
| `http://localhost:5173/catalog` | **Curated Catalog**: Search keyword, filter by brand, movement (`automatic`, `manual`, `quartz`), condition (`new`, `second-hand`), category (`dress`, `diver`, `chronograph`, `sports`, `luxury`), price range, case size (`36mm` to `44mm`), ratings (`4+`, `3+`), reviews count (`1+`, `5+`, `10+`), URL query sync, and pagination. |
| `http://localhost:5173/product/:id` | **Product Detail**: Image gallery, stock badge, price in champagne gold, 4-item Maison Assurance Matrix (Provenance, 2-Year Warranty, Armored Courier, Escrow), chronometric specifications table, customer reviews, and verified buyer review submission. |
| `http://localhost:5173/services` | **Horological Services**: Movement overhauls, ultrasonic demagnetization, bezel restoration, case polish, water resistance recertification, and service ticket submission. |
| `http://localhost:5173/sell` | **Sell / Consign Watch**: High-resolution appraisal submission form with image uploads. |
| `http://localhost:5173/cart` | **Cart**: Item quantity management, live calculation, persistent local storage. |
| `http://localhost:5173/checkout` | **Checkout**: Shipping address, payment method selection (Cash, Card, GCash, Bank Transfer), dynamic order pricing (total is calculated dynamically and never stored in the database). |
| `http://localhost:5173/orders` | **Customer Orders**: Track orders, invoice generation, status tracking. |
| `http://localhost:5173/me` | **Collector Profile**: Profile management, order history, appraisals, service tickets, and wishlist. |

### Protected Admin Routes (Requires Admin Role)
| Admin Route | Capabilities |
|---|---|
| `http://localhost:5173/admin/dashboard` | Sales charts, revenue analytics, order status breakdown with date-range filters. |
| `http://localhost:5173/admin/products` | Watch product management, inventory tracking, photo uploads, bulk delete. |
| `http://localhost:5173/admin/orders` | Transaction management, payment verification, status updates (`Paid` → `Shipped` → `Completed`), PDF receipt generation. |
| `http://localhost:5173/admin/appraisals` | Review customer appraisal submissions, issue valuations/offers, convert accepted offers into certified pre-owned watches. |
| `http://localhost:5173/admin/services` | Manage available maison horology services. |
| `http://localhost:5173/admin/tickets` | Manage service requests and horological diagnostic tickets. |

---

## 7. Running Backend Automated Tests

Aureo has an extensive automated test suite covering all functional milestones:

```bash
cd backend
npm test
```

Expected output:
```text
Test Suites: 7 passed, 7 total
Tests:       119 passed, 119 total
Snapshots:   0 total
Time:        ~8.5s
```

The test suites cover:
1. `auth.test.js` — Supabase registration, email OTP verification, Firebase Google auth, JWT validation, profile updates.
2. `product.test.js` — Keyword search, brand, category, movement, condition, price range, case size, rating & review filters, pagination.
3. `order.test.js` — Cart checkout, payment methods, dynamic total calculation without database persistence, order lifecycle status transitions, PDF receipts.
4. `review.test.js` — Verified buyer restriction, star rating aggregation, profanity filtering.
5. `appraisal.test.js` — Watch appraisal submissions, offers, conversion to pre-owned inventory.
6. `service.test.js` — Service catalog management, ticket dispatching, diagnostic updates.
7. `dashboard.test.js` — Analytics, revenue aggregations, date-range filtering.

---

## 8. Troubleshooting & Common Teammate Issues

### Problem 1: `MongooseServerSelectionError: connection timed out`
- **Cause**: Your public IP address is not whitelisted in the MongoDB Atlas cluster.
- **Solution**: Ask the project lead to add your current IP under Atlas **Network Access**, or add `0.0.0.0/0` (allow access from anywhere) during collaborative development.

### Problem 2: Authentication buttons or Google Sign-In not working
- **Cause**: Missing or incorrect `frontend/.env` file.
- **Solution**: Ensure `frontend/.env` exists and contains valid `VITE_SUPABASE_*` and `VITE_FIREBASE_*` keys. Restart the Vite dev server with `npm run dev`.

### Problem 3: `Port 3000` or `Port 5173` already in use
- **Cause**: A previous process was not terminated cleanly.
- **Solution**:
  - Windows PowerShell:
    ```powershell
    Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
    ```
  - Or terminate the terminal running the previous server with `Ctrl + C`.

### Problem 4: Seed script reports `admin already exists`
- **Note**: This is normal and expected. The seed script is idempotent (`npm run seed`) and safely updates existing records without creating duplicates.
- If you need a complete user table reset:
  ```bash
  cd backend
  npm run clear:users
  npm run seed
  ```

---

## 9. Security & Repository Hygiene

1. **Never commit `.env` files**:
   - `backend/config/.env` and `frontend/.env` are in `.gitignore`. Never use `git add -f` to force them.
2. **Never commit `node_modules` or `dist`**:
   - Always verify with `git status` before committing.
3. **Keep branches clean**:
   - Work on feature branches or pull latest `main` before pushing:
     ```bash
     git pull origin main
     ```
