ITCP318 Integrative Programming and Technology  1st Term 2026

MP1 20pts
Product/Service CRUD datatables. upload multiple photos. bulk delete using checkboxes 20pts

mp2 filter functions 20pts
price filter 5pts
category filter 5pts 
ratings filter 5pts
review filter 5pts

mp3 review ratings 20pts 
users who availed of the product/service can write a review and rate the product|service 10pts
users can update their own review/rating. 5pts
admin can delete a review 5pts.

term test lab 30pts
completed transaction. 10pts
admin updates the status of the transaction. 5pts 
email the customer of the updated transaction details. the email contains the list of products/services, their subtotal and grand total. 5pts
attach a pdf receipt on the email 10pts

unit 1 20pts 
filter/mask bad words from reviews. bad-words package 10pts
form validation on product and user forms. (product crud, user login, update profile) YUP formik React Hook Form 10pts

unit 2 20pts
user interface design css 10pts
user interface design css and bootstrap components 15pts
user interface design css and Material UI (MUI) or similar library components 20pts

quiz 1 15pts
sales charts with date range filter.  line or bar chart 15pts

quiz 2 15pts
pagination on products list on homepage. 10pts
infinite scroll on products list on homepage. 15pts

quiz 3 15pts
facebook or gmail login 15pts react-facebook-login or similar packages.
facebook or gmail login using firebase|supabase|clerk 15pts

quiz 4 15 pts 
use Redux for state management

term test LEC
functional requirements completeness 10pts
program execution (errors).  10pts
project contribution 10pts

---

## Implementation Coverage

Status as of **2026-11-04**. This matrix maps every assessment item above to the code that
satisfies it, so the requirement and its implementation can be checked side by side.

Legend: **Done** = implemented and exercised. **Partial** = part of the item is missing. **Pending** = not implemented.

| Assessment | Points | Requirement | Status | Implementation |
|---|---|---|---|---|
| MP1 | 20 | Product/Service CRUD datatables | Done | Product: `frontend/src/pages/admin/AdminProductsPage.jsx` + `backend/controllers/productController.js`. Service: `frontend/src/pages/admin/AdminServicesPage.jsx` + `backend/controllers/serviceController.js`. Includes search, filter tabs, sorting, and soft-delete / archive recovery. |
| MP1 | 20 | Upload multiple photos | Done | `frontend/src/pages/admin/AdminProductsPage.jsx` multi-image picker; `backend/controllers/productController.js` uploads each file to Cloudinary and stores `{ public_id, url }`. Tickets (`ServicesPage.jsx`) and Appraisals (`SellWatchPage.jsx`) also support multi-photo uploads. |
| MP1 | 20 | Bulk delete using checkboxes | Done | Product: `frontend/src/pages/admin/AdminProductsPage.jsx` + `POST /api/v1/admin/products/bulk-delete`. Service: `frontend/src/pages/admin/AdminServicesPage.jsx` + `POST /api/v1/admin/services/bulk-delete`. Users: `frontend/src/pages/admin/AdminUsersPage.jsx` + `POST /api/v1/admin/users/bulk-delete`. |
| MP2 | 20 | Price filter (5 pts) | Done | `frontend/src/pages/CatalogPage.jsx` min/max price inputs; `backend/utils/apiFeatures.js` `buildProductFilter` applies `price.$gte` / `price.$lte`. |
| MP2 | 20 | Category filter (5 pts) | Done | `frontend/src/pages/CatalogPage.jsx` category control; `backend/utils/apiFeatures.js` applies `filter.category`. |
| MP2 | 20 | Ratings filter (5 pts) | Done | `frontend/src/pages/CatalogPage.jsx` minimum rating control; `backend/utils/apiFeatures.js` applies `ratings.$gte`. |
| MP2 | 20 | Review filter (5 pts) | Done | `frontend/src/pages/CatalogPage.jsx` minimum review count control; `backend/utils/apiFeatures.js` applies `numOfReviews.$gte`. |
| MP3 | 20 | Purchaser can review and rate (10 pts) | Done | `backend/controllers/reviewController.js` `createOrUpdateReview` verifies a delivered (`status: "Completed"`) order for that user and product (`frontend/src/components/ProductReviews.jsx` and `frontend/src/pages/OrderDetailPage.jsx`). |
| MP3 | 20 | User can update their own review (5 pts) | Done | `PUT /api/v1/review/:id`; `backend/controllers/reviewController.js` `updateReview` enforces owner-only access and recalculates product ratings inside a Mongoose transaction. |
| MP3 | 20 | Admin can delete a review (5 pts) | Done | `DELETE /api/v1/review/:id`; `backend/controllers/reviewController.js` `deleteReview` allows the owner or an admin and recalculates product ratings inside a Mongoose transaction. |
| Term test lab | 30 | Completed transaction (10 pts) | Done | `backend/controllers/orderController.js` executes `createOrder`, `cancelOrder`, `updateAdminOrder`, and `deleteAdminOrder` inside Mongoose ACID transactions (`startSession` / `startTransaction` / `commitTransaction` / `abortTransaction`) and enforces `Pending -> Paid -> Shipped -> Completed`. |
| Term test lab | 30 | Admin updates the transaction status (5 pts) | Done | `PUT /api/v1/admin/order/:id`; `frontend/src/pages/admin/AdminOrdersPage.jsx` and `frontend/src/pages/admin/AdminOrderDetailPage.jsx` status controls. |
| Term test lab | 30 | Email the customer of the updated transaction details with the product/service list, subtotal, and grand total (5 pts) | Done | `backend/controllers/orderController.js` (`buildCheckoutOrderEmail`, `buildCheckoutOrderHtml`, `buildCompletedOrderEmail`, `buildCompletedOrderHtml`) and `backend/utils/sendEmail.js` send real SMTP HTML + plain-text emails on checkout and on every status update with itemized products, per-item subtotals, `Subtotal:`, and `Grand Total:`, plus a Registration Acknowledgement Email in `backend/controllers/authController.js`. |
| Term test lab | 30 | Attach a PDF receipt on the email (10 pts) | Done | `backend/utils/generateReceipt.js` builds the luxury PDF invoice with `pdfkit`; attached to checkout and status-update emails (`aureo-receipt-<id>.pdf`) and downloadable via embedded tokenized link (`GET /api/v1/order/:id/receipt`). |
| Unit 1 | 20 | Filter/mask bad words from reviews using the `bad-words` package (10 pts) | Done | `backend/utils/filterBadWords.js` uses `bad-words`; applied on review create and update in `backend/controllers/reviewController.js`. |
| Unit 1 | 20 | Form validation on product and user forms (product CRUD, user login, update profile) using Yup / Formik / React Hook Form (10 pts) | Done | `frontend/src/utils/validationSchemas.js` holds the Yup schemas; `frontend/src/components/ui/ValidatedField.jsx` and form pages (`LoginPage.jsx`, `RegisterPage.jsx`, `ProfilePage.jsx`, `AdminProductsPage.jsx`, `AdminServicesPage.jsx`, `AdminUsersPage.jsx`, `CheckoutPage.jsx`, `SellWatchPage.jsx`, `ServicesPage.jsx`, `ProductReviews.jsx`) use React Hook Form with `@hookform/resolvers/yup`. |
| Unit 2 | 20 | User interface design CSS (10 pts) | Done | Black/gold luxury design system in `frontend/src/index.css`, `frontend/src/App.css`, and `frontend/src/styles/`. |
| Unit 2 | 20 | User interface design CSS and Bootstrap components (15 pts) | Done | `frontend/src/components/ui/index.jsx` wraps React Bootstrap `Table`, `Modal`, `Pagination`, `Form`, `Button`, `Badge`, `Alert`, `Spinner`, and `ProgressBar` with the Aureo theme. |
| Unit 2 | 20 | User interface design CSS and MUI (or similar library) components (20 pts) | Done | `frontend/src/components/ui/index.jsx` exposes Material UI (`@mui/material`) `Card`, `Chip`, `TextField`, `Select`, `Checkbox`, `Dialog`, `Rating`, `Stack`, and `Button` with a dark Aureo theme (`frontend/src/theme/aureoTheme.js`). |
| Quiz 1 | 15 | Sales charts with date range filter, line or bar chart (15 pts) | Done | `frontend/src/pages/admin/AdminDashboardPage.jsx` draws both a Recharts bar chart and line chart; the from/to date inputs filter `GET /api/v1/admin/dashboard` (`backend/controllers/dashboardController.js`). |
| Quiz 2 | 15 | Pagination on the products list on the homepage (10 pts) | Done | `frontend/src/App.jsx` paginated product query (`page`, `limit: 8`) and `frontend/src/pages/CatalogPage.jsx` numbered pagination controls. |
| Quiz 2 | 15 | Infinite scroll on the products list on the homepage (15 pts) | Done | `frontend/src/hooks/useInfiniteScroll.js` + `frontend/src/App.jsx` automatically loads the next page when the sentinel enters the viewport on the homepage (with 20 seeded products across multiple pages). |
| Quiz 3 | 15 | Facebook or Gmail login using a supported package (15 pts) | Done | `frontend/src/redux/actions/authActions.js` `googleLogin` uses Firebase `signInWithPopup` with `GoogleAuthProvider`. |
| Quiz 3 | 15 | Facebook or Gmail login using Firebase / Supabase / Clerk (15 pts) | Done | Firebase Authentication is the Google identity provider; `POST /api/v1/auth/google` (`backend/controllers/authController.js`) verifies the Firebase ID token via `firebase-admin` and issues the Aureo Bearer JWT. |
| Quiz 4 | 15 | Use Redux for state management (15 pts) | Done | `redux`, `react-redux`, and `redux-thunk` manage global application state in `frontend/src/redux/store.js` (28 combined reducer slices across 7 reducers in `frontend/src/redux/reducers/`, 7 thunk action modules in `frontend/src/redux/actions/`, and 7 constant modules in `frontend/src/redux/constants/`), provided at root in `frontend/src/main.jsx`. |
| Term test LEC | 30 | Functional requirements completeness (10 pts) | Done | FR 1.x through FR 7.x are implemented: authentication and access control, products and inventory (20 seeded watches), appraisals, shopping and ACID transactions, services (10 seeded services) and expandable aftersales tickets with optional photos, verified-delivery reviews, and the AI assistant. |
| Term test LEC | 30 | Program execution without errors (10 pts) | Done | Backend controllers pass syntax and runtime validation with Mongoose transactions; frontend compiles cleanly via `vite build` with zero errors. |
| Term test LEC | 30 | Project contribution (10 pts) | Done | Two members: Marcus S. Aristain and Jonel A. Caisip (BSIT-S-3A). Instructor: Mr. Rommel M. Dalisay. |
