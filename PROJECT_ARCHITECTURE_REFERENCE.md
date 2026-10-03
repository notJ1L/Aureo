# Project Architecture Reference for Functional Requirements

## 1. Purpose of This Document

This document explains how the reference project is structured so it can be used as a guide when writing functional requirements for a different system.

The goal is not to copy the same features. The goal is to understand how:

- The frontend communicates with the backend
- Routes connect URLs to controllers
- Controllers implement business logic
- Models communicate with the database
- Middleware controls authentication and authorization
- External services support features such as images and email
- A user action travels through the entire system

---

# 2. Reference Technology Stack

The reference project uses the MERN stack.

## 2.1 Frontend

- Language: JavaScript
- UI library: React
- Build tool: Vite
- Routing: React Router
- HTTP client: Axios
- UI libraries: React Bootstrap and Material UI
- Notifications: React Toastify
- Charts: Recharts
- Global state: Redux, React Redux, and Redux Thunk
- UI utilities: React Helmet, SweetAlert2, and MUI Data Grid

The frontend is responsible for:

- Displaying pages
- Collecting user input
- Validating basic input
- Calling backend APIs
- Showing success and error messages
- Managing temporary interface state
- Controlling navigation

## 2.2 Backend

- Runtime: Node.js
- Web framework: Express.js
- Language: JavaScript
- API style: REST API
- Authentication: JSON Web Tokens
- Password encryption: bcrypt
- File upload handling: Multer
- Email: Nodemailer

The backend is responsible for:

- Receiving requests
- Validating and processing data
- Applying business rules
- Authenticating users
- Authorizing roles
- Reading and writing database records
- Returning responses to the frontend

## 2.3 Database

- Database: MongoDB
- Object-document mapper: Mongoose

MongoDB stores data as documents. Mongoose defines the structure and validation rules for those documents.

## 2.4 External Services

The reference project uses Cloudinary for image storage.

Instead of storing image files directly inside MongoDB, the system stores:

- Cloudinary public ID
- Image URL

Other projects may use a different image provider or local file storage.

---

# 3. Overall Architecture

The project follows a client-server architecture.

```text
User
 |
 v
React Frontend
 |
 | HTTP request using Axios
 v
Express Backend
 |
 v
Routes
 |
 v
Middleware
 |
 v
Controllers
 |
 v
Mongoose Models
 |
 v
MongoDB Database
```

The response travels back in the opposite direction:

```text
MongoDB
 |
 v
Model
 |
 v
Controller
 |
 v
JSON API response
 |
 v
Axios
 |
 v
React state
 |
 v
Updated screen
```

The main design principle is:

> The frontend displays and collects information. The backend processes information and enforces business rules. The database stores persistent information.

## 3.1 Current Implementation Snapshot

The latest implementation uses the following request and state flow:

```text
React component
    -> Redux action or local component state
    -> Axios request with credentials
    -> Express route
    -> Middleware
    -> Controller
    -> Mongoose model or Cloudinary
```

Authentication is currently cookie-based. After a successful login, the backend sends the JWT in an `httpOnly` cookie. The browser sends that cookie on later requests when Axios uses `withCredentials: true`; the frontend does not need to read the JWT directly.

The Redux store currently contains product, authentication, user, forgot-password, and new-product state. Cart items and shipping information are initialized from `localStorage` in `store.js`, while several cart and order reducers remain commented out and are not yet part of the active store.

---

# 4. Backend Application Structure

The backend is organized into layers.

```text
backend/
|
|-- server.js
|-- app.js
|
|-- config/
|   |-- database.js
|
|-- routes/
|   |-- product.js
|   |-- auth.js
|   |-- order.js
|
|-- controllers/
|   |-- product.js
|   |-- auth.js
|   |-- order.js
|
|-- models/
|   |-- product.js
|   |-- user.js
|   |-- order.js
|
|-- middlewares/
|   |-- auth.js
|
|-- utils/
    |-- apiFeatures.js
    |-- multer.js
    |-- sendEmail.js
```

## 4.1 server.js

`server.js` starts the backend server.

Its responsibilities include:

- Loading environment variables
- Connecting to MongoDB
- Configuring Cloudinary
- Starting Express on a port

Conceptually:

```js
const app = require('./app');

connectDatabase();

app.listen(PORT);
```

`server.js` is the entry point for running the backend.

## 4.2 app.js

`app.js` creates and configures the Express application.

Its responsibilities include:

- Creating the Express app
- Enabling CORS
- Reading JSON request bodies
- Reading form data
- Registering route files
- Exporting the configured app

Conceptually:

```js
const express = require('express');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1', productRoutes);
app.use('/api/v1', authRoutes);
app.use('/api/v1', orderRoutes);

module.exports = app;
```

The distinction is:

```text
app.js    = configures the application
server.js = starts the server
```

## 4.3 Routes

Routes define the URLs and HTTP methods of the system.

Example:

```js
router.get('/products', getProducts);
```

This means:

```text
GET /api/v1/products
```

The route does not normally contain complicated business logic. It connects the request to the correct controller.

## 4.4 Controllers

Controllers contain the business logic.

A controller may:

- Read request data
- Validate business conditions
- Call a model
- Call an external service
- Return a response

Example:

```js
exports.getProduct = async (req, res) => {
    const product = await Product.findById(req.params.id);

    res.status(200).json({
        success: true,
        product
    });
};
```

## 4.5 Models

Models define database structures and database operations.

Example:

```js
const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    stock: Number
});

module.exports = mongoose.model('Product', productSchema);
```

Models are responsible for:

- Field definitions
- Validation rules
- Default values
- Database queries
- Relationships between records
- Model-specific methods

## 4.6 Middleware

Middleware runs between the request and the controller.

Examples:

- Authentication middleware
- Role authorization middleware
- File upload middleware
- Request parsing middleware

Example:

```js
router.post(
    '/admin/product/new',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    newProduct
);
```

The request reaches `newProduct` only if the middleware succeeds.

In the current code, authentication is implemented by `isAuthenticatedUser`, which reads the JWT from `req.cookies.token`. `authorizeRoles('admin')` restricts selected user, order, product-list, and review operations. The route file should be treated as the source of truth for access control: the current product update/delete and several dashboard sales routes are not protected by middleware, even though their paths contain `admin`.

---

# 5. Frontend Application Structure

The frontend is organized into React components.

```text
frontend/src/
|
|-- main.jsx
|-- App.jsx
|-- App.css
|-- index.css
|
|-- Components/
|   |-- Home.jsx
|   |-- Product/
|   |-- Cart/
|   |-- User/
|   |-- Order/
|   |-- Admin/
|   |-- Layout/
|   |-- Route/
|
|-- Utils/
    |-- helpers.jsx
```

## 5.1 main.jsx

`main.jsx` is the frontend entry point.

It renders the main React application into the HTML root element.

```jsx
createRoot(document.getElementById('root')).render(
    <App />
);
```

## 5.2 App.jsx

`App.jsx` is the main frontend application component.

It normally contains:

- Application routes
- Shared layout components
- Shared state
- Global notifications
- Common navigation

## 5.3 Components

Each component usually represents part of the user interface.

Examples:

```text
Login.jsx          Login page
Home.jsx           Product listing page
ProductDetails.jsx Product details page
Cart.jsx           Shopping cart page
ProductsList.jsx   Admin product list
```

## 5.4 React State

State stores information that changes during use.

```jsx
const [products, setProducts] = useState([]);
```

When state changes:

```jsx
setProducts(newProducts);
```

React renders the component again.

State can represent:

- Form values
- Loading status
- Error messages
- Product lists
- Cart contents
- Logged-in users
- Selected filters

## 5.5 React Effects

`useEffect` runs code after rendering or after selected values change.

```jsx
useEffect(() => {
    getProducts();
}, []);
```

This commonly loads data when a page opens.

## 5.6 Redux State and Actions

The frontend uses Redux with Redux Thunk for asynchronous API actions.

```text
Components
    -> actions/*.jsx
    -> Axios API request
    -> reducer
    -> Redux store
    -> component re-render
```

The active store is configured in `store.js` with product and user reducers. User actions handle login, logout, loading the current user, profile updates, password updates, and password recovery. Login, logout, and protected user requests send cookies with `withCredentials: true`.

## 5.7 Props

Props pass data from a parent component to a child component.

```jsx
<Product product={product} />
```

The child receives the data:

```jsx
function Product({ product }) {
    return <h2>{product.name}</h2>;
}
```

---

# 6. MVC Interpretation

The project is similar to an MVC architecture.

## Model

The model represents the database structure.

Examples:

```text
User model
Product model
Order model
```

## View

The React frontend acts as the view layer.

Examples:

```text
Login page
Product page
Admin product page
Order page
```

## Controller

The backend controller contains the application logic.

Examples:

```text
Product controller
Authentication controller
Order controller
```

## Routes

Routes connect frontend API requests to controllers.

```text
Frontend request
    -> Route
    -> Middleware
    -> Controller
    -> Model
```

A practical interpretation is:

```text
React component = user interface
Route           = API entry point
Middleware      = request gatekeeper
Controller      = business logic
Model           = database interface
MongoDB         = permanent storage
```

---

# 7. CRUD Fundamentals

CRUD means:

```text
Create
Read
Update
Delete
```

These operations form the basis of most functional requirements.

## Create

Create a new record.

```text
POST /api/v1/resource
```

Example:

```text
An administrator creates a product.
```

Typical flow:

```text
Form
    -> POST request
    -> validation
    -> controller
    -> Model.create()
    -> database
    -> success response
```

## Read

Retrieve one or more records.

```text
GET /api/v1/resources
GET /api/v1/resource/:id
```

Example:

```text
A customer views available products.
```

## Update

Modify an existing record.

```text
PUT /api/v1/resource/:id
```

Example:

```text
An administrator changes a product's price.
```

## Delete

Remove a record.

```text
DELETE /api/v1/resource/:id
```

Example:

```text
An administrator removes an unavailable product.
```

---

# 8. Example Product CRUD Structure

The reference product feature uses the following endpoints:

```text
POST   /api/v1/admin/product/new
GET    /api/v1/products
GET    /api/v1/product/:id
PUT    /api/v1/admin/product/:id
DELETE /api/v1/admin/product/:id
```

The current backend also exposes these feature groups:

```text
Authentication and users
POST   /api/v1/register
POST   /api/v1/login
GET    /api/v1/logout
GET    /api/v1/me
PUT    /api/v1/me/update
PUT    /api/v1/password/update
POST   /api/v1/password/forgot
PUT    /api/v1/password/reset/:token
GET    /api/v1/admin/users
GET    /api/v1/admin/user/:id
PUT    /api/v1/admin/user/:id
DELETE /api/v1/admin/user/:id

Orders
POST   /api/v1/order/new
GET    /api/v1/orders/me
GET    /api/v1/order/:id
GET    /api/v1/admin/orders/
PUT    /api/v1/admin/order/:id
DELETE /api/v1/admin/order/:id

Reviews and reporting
PUT    /api/v1/review
GET    /api/v1/reviews
DELETE /api/v1/reviews
GET    /api/v1/admin/product-sales
GET    /api/v1/admin/total-orders
GET    /api/v1/admin/total-sales
GET    /api/v1/admin/customer-sales
GET    /api/v1/admin/sales-per-month
```

The product image flow accepts image data from the frontend and uploads it to Cloudinary. Multer is registered on relevant routes, but the active product form converts selected images to data URLs; this is different from storing uploaded files in MongoDB.

The same structure can be adapted to another project.

For example, a library system might use:

```text
POST   /api/v1/admin/books
GET    /api/v1/books
GET    /api/v1/books/:id
PUT    /api/v1/admin/books/:id
DELETE /api/v1/admin/books/:id
```

The feature changes, but the architecture remains similar.

---

# 9. Request and Response Structure

A request may contain:

## URL parameters

```text
/product/:id
```

Accessed by:

```js
req.params.id
```

## Query parameters

```text
/products?keyword=laptop&page=1
```

Accessed by:

```js
req.query.keyword;
req.query.page;
```

## Request body

```json
{
    "name": "Laptop",
    "price": 1000
}
```

Accessed by:

```js
req.body.name;
req.body.price;
```

## Response

```js
res.status(200).json({
    success: true,
    data
});
```

A consistent response structure makes it easier for the frontend to process results.

---

# 10. Authentication and Authorization

## Authentication

Authentication verifies the user's identity.

Typical process:

```text
User enters email and password
    -> Backend finds user
    -> Password is compared
    -> JWT is created
    -> Backend sends JWT in an httpOnly cookie
    -> Browser sends cookie with credentialed requests
```

The backend uses `cookie-parser` to read the cookie. The frontend configures Axios requests with `withCredentials: true`. This prevents normal frontend JavaScript from reading the JWT, while still allowing protected requests to authenticate.

## Authorization

Authorization determines whether the user has permission.

Example roles:

```text
user
admin
staff
manager
```

Example rule:

```text
Only administrators can delete records.
```

The backend should enforce this using middleware:

```js
isAuthenticatedUser
authorizeRoles('admin')
```

The frontend may hide restricted pages, but the backend must enforce the real security rule.

---

# 11. Functional Requirement Structure

A functional requirement should describe what the system must do.

Each requirement should identify:

- Requirement ID
- Feature name
- Actor
- Trigger
- Preconditions
- Main process
- Expected result
- Alternative or error cases
- Data involved
- Access restrictions

## Functional Requirement Template

```text
Requirement ID:
FR-001

Requirement Name:
Create a new record

Actor:
Administrator

Description:
The system shall allow an authorized administrator to create a new record.

Preconditions:
- The user is logged in.
- The user has administrator privileges.
- Required information is available.

Trigger:
The administrator submits the creation form.

Main Flow:
1. The administrator opens the creation page.
2. The administrator enters the required information.
3. The frontend validates required fields.
4. The frontend sends a POST request to the backend.
5. The backend authenticates the request.
6. The backend validates the submitted data.
7. The controller creates the database record.
8. The backend returns a success response.
9. The frontend displays a success message.
10. The new record appears in the list.

Alternative Flows:
- If required data is missing, the system displays a validation message.
- If the user is not authenticated, the system rejects the request.
- If the user is not authorized, the system rejects the request.
- If the database operation fails, the system displays an error message.

Expected Result:
A new record is stored in the database and displayed to the user.
```

---

# 12. Example Functional Requirements

## FR-001: View Records

The system shall allow users to view a list of available records.

The system shall retrieve records from the backend database.

The system shall display the records in a readable list or table.

If no records exist, the system shall display an appropriate message.

## FR-002: View Record Details

The system shall allow users to select one record and view its complete details.

The system shall use the record ID to retrieve the correct database document.

If the record does not exist, the system shall display an error message.

## FR-003: Create Record

The system shall allow authorized users to create a new record.

The system shall validate all required fields before saving.

The system shall store the record in the database after successful validation.

## FR-004: Update Record

The system shall allow authorized users to update an existing record.

The system shall identify the record using its unique ID.

The system shall validate the updated information before saving.

## FR-005: Delete Record

The system shall allow authorized users to delete an existing record.

The system shall request confirmation before deletion.

The system shall remove the record from the database after confirmation.

## FR-006: Search Records

The system shall allow users to search records using keywords.

The backend shall compare the search term against relevant fields.

The system shall display matching records.

## FR-007: Filter Records

The system shall allow users to filter records based on selected criteria.

The system shall return only records matching the selected criteria.

## FR-008: Authenticate User

The system shall allow registered users to log in using valid credentials.

The system shall reject invalid credentials.

The system shall create an authenticated session or token after successful login.

## FR-009: Restrict Access

The system shall prevent unauthenticated users from accessing protected features.

The system shall prevent users from accessing features outside their assigned roles.

## FR-010: Display Errors

The system shall display a clear error message when an operation fails.

The system shall not expose sensitive technical information to normal users.

---

# 13. How to Convert a Feature into Requirements

For every feature, ask these questions:

## Actor

Who uses the feature?

```text
Customer
Administrator
Staff member
Manager
Guest
```

## Trigger

What starts the feature?

```text
User clicks a button
User submits a form
User opens a page
System reaches a scheduled time
```

## Data

What information is required?

```text
Name
Email
Status
Quantity
Date
Image
```

## Backend Operation

What must the backend do?

```text
Create a record
Read records
Update a record
Delete a record
Calculate a value
Send an email
Upload a file
```

## Database Operation

What model and database action are involved?

```text
Model.find()
Model.findById()
Model.create()
Model.findByIdAndUpdate()
Model.findByIdAndDelete()
```

## Permissions

Who is allowed to perform the operation?

```text
Any visitor
Logged-in user
Administrator
Owner of the record
```

## Success Result

What should happen after success?

```text
Show confirmation
Redirect to another page
Refresh a table
Display the new record
Update the status
```

## Failure Result

What should happen after failure?

```text
Display validation error
Display unauthorized message
Display not-found message
Allow the user to try again
```

---

# 14. Recommended Requirement Categories

A complete project requirements document should normally include:

## User Management

- Register user
- Log in
- Log out
- Update profile
- Change password
- Reset forgotten password
- Assign roles

## Main Entity Management

- Create entity
- View entities
- View entity details
- Search entities
- Filter entities
- Update entity
- Delete entity

## Transactions

- Create transaction
- View personal transactions
- View transaction details
- Update transaction status
- Cancel or delete transaction

## Administration

- View dashboard
- Manage users
- Manage records
- Manage transactions
- View reports
- Manage reviews or feedback

## Notifications

- Show success messages
- Show validation errors
- Send email notifications
- Show status updates

## File Management

- Upload files
- Validate file types
- Store files externally
- Display uploaded files
- Replace or delete files

---

# 15. Non-Functional Requirements

Functional requirements describe what the system does.

Non-functional requirements describe how well the system should operate.

Important categories include:

## Performance

- Pages should load within an acceptable time.
- API requests should respond efficiently.
- Large lists should use pagination.

## Security

- Passwords must not be stored as plain text.
- Protected endpoints must require authentication.
- Admin endpoints must require appropriate roles.
- Sensitive environment variables must not be committed publicly.

## Usability

- Forms should provide clear validation messages.
- Users should receive confirmation after important actions.
- Navigation should be consistent.

## Reliability

- Database errors should be handled.
- Failed requests should not crash the application.
- Invalid input should not corrupt stored data.

## Maintainability

- Routes, controllers, models, and middleware should remain separated.
- Repeated logic should be placed in reusable utilities.
- Code should use consistent naming and response formats.

## Scalability

- Lists should support pagination.
- Images should use external storage.
- The system should allow additional features without rewriting the entire application.

---

# 16. Generic Architecture for a New Project

A new project based on this reference could use:

```text
project/
|
|-- frontend/
|   |-- src/
|       |-- components/
|       |-- pages/
|       |-- routes/
|       |-- services/
|       |-- utils/
|
|-- backend/
    |-- server.js
    |-- app.js
    |-- config/
    |-- routes/
    |-- controllers/
    |-- models/
    |-- middlewares/
    |-- utils/
```

A typical feature should connect like this:

```text
Page or component
    -> API service
    -> Backend route
    -> Middleware
    -> Controller
    -> Model
    -> Database
```

---

# 17. AI Prompt for Generating Functional Requirements

Use the following prompt when asking an AI to help create functional requirements:

```text
I am creating a software project based on a client-server architecture.

Use the following architecture as a reference:

- Frontend: JavaScript and React
- Backend: Node.js and Express
- Database: MongoDB using Mongoose
- API style: REST API
- Authentication: JWT-based authentication
- Structure: frontend components, backend routes, middleware, controllers, models, and database
- External services may be used for file storage, email, or payments

Do not copy the reference project's business features. Adapt the architecture to my project.

For each functional requirement, provide:

1. Requirement ID
2. Requirement name
3. Actor
4. Description
5. Preconditions
6. Trigger
7. Main success flow
8. Alternative and error flows
9. Required input data
10. Expected output
11. Authentication requirements
12. Authorization requirements
13. Related frontend component
14. Related backend API endpoint
15. Related controller responsibility
16. Related database model
17. CRUD operation involved

Also provide:

- A complete list of system actors
- A list of database entities
- A list of relationships between entities
- A list of REST API endpoints
- Authentication and authorization requirements
- Non-functional requirements
- Validation rules
- Error-handling requirements
- Assumptions and limitations

Keep the requirements specific, testable, and written using "The system shall..." statements.

Do not invent features that were not described. Identify unclear areas as questions or assumptions.
```

---

# 18. Final Mental Model

The most important pattern is:

```text
User action
    -> React component
    -> Axios request
    -> Express route
    -> Authentication/authorization middleware
    -> Controller
    -> Mongoose model
    -> MongoDB
    -> JSON response
    -> React state update
    -> Updated interface
```

When writing requirements for a new project, describe each feature using this same chain.

The business feature may change from products to books, appointments, equipment, students, or reports. The structure remains:

```text
Frontend
    -> API
    -> Route
    -> Middleware
    -> Controller
    -> Model
    -> Database
```
