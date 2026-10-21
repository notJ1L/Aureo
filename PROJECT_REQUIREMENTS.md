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

quiz 2 15pts
sales charts with date range filter.  line or bar chart 15pts

quiz 3
pagination on products list on homepage. 10pts
infinite scroll on products list on homepage. 15pts

quiz 4 
facebook or gmail login 15pts react-facebook-login or similar packages.
facebook or gmail login using firebase|supabase|clerk 15pts

term test LEC
functional requirements completeness 10pts
program execution (errors).  10pts
project contribution 10pts

---

## Implementation Coverage

Status as of **2026-10-22**. This matrix maps every assessment item above to the code that
satisfies it, so the requirement and its implementation can be checked side by side.

Legend: **Done** = implemented and exercised. **Partial** = part of the item is missing. **Pending** = not implemented.

| Assessment | Points | Requirement | Status | Implementation |
|---|---|---|---|---|
| MP1 | 20 | Product/Service CRUD datatables | Done | Product: `frontend/src/pages/admin/AdminProductsPage.jsx`. Service: `frontend/src/pages/admin/AdminServicesPage.jsx`. |
| MP1 | 20 | Upload multiple photos | Done | `frontend/src/pages/admin/AdminProductsPage.jsx` multi-image picker; `backend/controllers/productController.js` uploads each file to Cloudinary and stores `{ public_id, url }`. |
| MP1 | 20 | Bulk delete using checkboxes | Done | Product: `frontend/src/pages/admin/AdminProductsPage.jsx` + `POST /api/v1/admin/products/bulk-delete`. Service: `frontend/src/pages/admin/AdminServicesPage.jsx` + `POST /api/v1/admin/services/bulk-delete`. |
| MP2 | 20 | Price filter | Done | `frontend/src/pages/CatalogPage.jsx` min/max price inputs; `backend/utils/apiFeatures.js` `buildProductFilter` applies `price.$gte` / `price.$lte`. |
| MP2 | 20 | Category filter | Done | `frontend/src/pages/CatalogPage.jsx` category control; `backend/utils/apiFeatures.js` applies `filter.category`. |
| MP2 | 20 | Ratings filter | Done | `frontend/src/pages/CatalogPage.jsx` minimum rating control; `backend/utils/apiFeatures.js` applies `ratings.$gte`. |
| MP2 | 20 | Review filter | Done | `frontend/src/pages/CatalogPage.jsx` minimum review count control; `backend/utils/apiFeatures.js` applies `numOfReviews.$gte`. |
| MP3 | 20 | Purchaser can review and rate | Done | `backend/controllers/reviewController.js` `createOrUpdateReview` verifies a `Paid`, `Shipped`, or `Completed` order for that user and product; second-hand pieces are rejected. |
| MP3 | 20 | User can update their own review | Done | `PUT /api/v1/review/:id`; `backend/controllers/reviewController.js` `updateReview` enforces owner-only access. |
| MP3 | 20 | Admin can delete a review | Done | `DELETE /api/v1/review/:id`; `backend/controllers/reviewController.js` `deleteReview` allows the owner or an admin. |
| Term test lab | 30 | Completed transaction | Done | `backend/controllers/orderController.js` enforces `Pending -> Paid -> Shipped -> Completed`; `Completed` cannot move backwards. |
| Term test lab | 30 | Admin updates the transaction status | Done | `PUT /api/v1/admin/order/:id`; `frontend/src/pages/admin/AdminOrdersPage.jsx` status controls. |
| Term test lab | 30 | Email the customer of the updated transaction details with the product/service list, subtotal, and grand total | Done | `backend/controllers/orderController.js` `buildCompletedOrderEmail` writes the item list, per-item subtotals, `Subtotal:`, and `Grand total:`; `backend/utils/mockEmail.js` stores it. |
| Term test lab | 30 | Attach a PDF receipt on the email | Done | `backend/utils/generateReceipt.js` builds the PDF with pdfkit; the completed-transaction email attaches it. |
| Unit 1 | 20 | Filter/mask bad words from reviews using the `bad-words` package | Done | `backend/utils/filterBadWords.js` uses `bad-words`; applied on review create and update in `backend/controllers/reviewController.js`. |
| Unit 1 | 20 | Form validation on product and user forms (product CRUD, user login, update profile) using Yup / Formik / React Hook Form | Done | `frontend/src/utils/validationSchemas.js` holds the Yup schemas; `frontend/src/components/ui/ValidatedField.jsx` and the form pages use React Hook Form with `@hookform/resolvers`. |
| Unit 2 | 20 | User interface design CSS | Done | Black/gold tokens in `frontend/src/index.css`, component styles in `frontend/src/App.css` and `frontend/src/styles/`. |
| Unit 2 | 20 | User interface design CSS and Bootstrap components | Done | `frontend/src/components/ui/` wraps React Bootstrap `Table`, `Modal`, `Pagination`, `Form`, and `Button` with the Aureo theme. |
| Unit 2 | 20 | User interface design CSS and MUI (or similar library) components | Done | `frontend/src/components/ui/` also exposes MUI `Card`, `Chip`, `TextField`, `Dialog`, and `Rating` with a dark Aureo theme. |
| Quiz 2 | 15 | Sales charts with date range filter, line or bar chart | Done | `frontend/src/pages/admin/AdminDashboardPage.jsx` draws a Recharts bar chart and a line chart; the from/to date inputs narrow `GET /api/v1/admin/dashboard`. |
| Quiz 3 | 15 | Pagination on the products list on the homepage | Done | `frontend/src/App.jsx` page state with Previous / Next controls. |
| Quiz 3 | 15 | Infinite scroll on the products list on the homepage | Done | `frontend/src/hooks/useInfiniteScroll.js` loads the next page when the sentinel enters the viewport. |
| Quiz 4 | 15 | Facebook or Gmail login using a supported package | Done | `frontend/src/redux/actions/authActions.js` `googleLogin` uses Firebase `signInWithPopup` with `GoogleAuthProvider`. |
| Quiz 4 | 15 | Facebook or Gmail login using Firebase / Supabase / Clerk | Done | Firebase is the Google identity provider; `POST /api/v1/auth/google` verifies the provider token and issues the Aureo Bearer JWT. |
| Term test LEC | 30 | Functional requirements completeness | Done | FR 1.x through FR 7.x are implemented: authentication and access control, products and inventory, appraisals, shopping and transactions, services and aftersales, reviews, and the AI assistant. |
| Term test LEC | 30 | Program execution without errors | Partial | `npm test` in `backend/` passes 114 cases across 7 suites against a dedicated test database. The frontend has no test script yet (build plan Phase 12). |
| Term test LEC | 30 | Project contribution | Done | Two members: Marcus S. Aristain and Jonel A. Caisip (BSIT-S-3A). Instructor: Mr. Rommel M. Dalisay. |

### Remaining risks

- **Unit 1, Unit 2, and Quiz 3 rely on files that must be committed.** The Yup schemas, the shared
  component kit, the infinite scroll hook, and the 3D hero are new files. A clean clone only builds
  if they are added to Git.
- **The frontend has no test script.** `npm run lint` and `npm run build` are the only frontend
  checks. Build plan Phase 12 adds them.
- **The Render deployment has not been run.** `render.yaml` declares both services, but the
  production environment variables are not filled in and the deployment is unverified.
