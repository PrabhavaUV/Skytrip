# ✈️ SKYTRIP — Full-Stack MERN Airline Reservation Platform
### Project Specification, Architectural Blueprint & Team Roadmap
**Course**: MCA Semester III — Full Stack Application Development (MCA261IA)  
**Institution**: RV College of Engineering (RVCE), Bengaluru  
**Component**: Experiential Learning (EL Phase I & Phase II — 40 Marks) + SEE Lab  
**Architecture Pattern**: Model - View - Controller (MVC) using the MERN Stack  

---

## 📌 1. Project Vision & Executive Summary

### What is Skytrip?
**Skytrip** is a modern airline reservation and flight management web application. It allows travelers to search for domestic flights, pick seats interactively on a 2D airplane cabin map, register passenger details with strict ID verification, and pay instantly using an integrated digital wallet. It also features a transparent, time-based cancellation and refund engine that calculates refund percentages based on how many hours remain before flight departure.

### Why MERN Stack?
The project strictly implements the portions outlined in the **RVCE MCA261IA Full Stack Application Development** curriculum:
- **M**ongoDB & Mongoose (Unit III & IV): NoSQL document storage with structured schemas, custom modifiers, and validation hooks.
- **E**xpress.js (Unit I & IV): Clean RESTful routing, MVC controller logic, and custom middleware.
- **R**eact (Unit II & V): Component-driven user interface, state/props management, and dynamic forms.
- **N**ode.js (Unit I): Non-blocking, event-driven runtime using standard CommonJS modules.
- **Webpack & Babel** (Unit II): Build-time JSX compilation from separate script files into a unified bundle.

---

## 🏗️ 2. Architectural Blueprint: The MVC Pattern Explained

The project is structured according to the classic **Model-View-Controller (MVC)** architectural pattern as taught in **Unit I** of the syllabus:

```text
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                                   VIEW (V)                                  │
 │                      React Single Page Application (SPA)                    │
 │               Components, Dynamic Forms, State, React Router                │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │  HTTP Requests (JSON)
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                               CONTROLLER (C)                                │
 │                     Express Route Handlers & Business Logic                 │
 │              Auth, Flight Search, Seat Hold, Booking, Refund Math           │
 └──────────────────┬──────────────────────────────────────────┬───────────────┘
                    │                                          │
       Interacts    │                                          │  Directs Response
       with Data    ▼                                          ▼
 ┌──────────────────────────────────────┐     ┌────────────────────────────────┐
 │              MODEL (M)               │     │           MIDDLEWARE           │
 │       Mongoose Schemas & Rules       │     │   JWT Auth & Admin Verifiers   │
 │   Users, Flights, Seats, Bookings    │     │      Global Error Handler      │
 └──────────────────┬───────────────────┘     └────────────────────────────────┘
                    │ Reads & Writes
                    ▼
 ┌──────────────────────────────────────┐
 │          MONGODB DATABASE            │
 │     Local: mongodb://localhost:27017 │
 └──────────────────────────────────────┘
```

1. **Model (Data Layer)**: Defined using **Mongoose Schemas** in `server/models/`. These enforce rules, default values, pre-save hashing, and custom validation before data hits MongoDB.
2. **View (User Interface)**: Built using **React** in `src/`. It captures user inputs, renders dynamic seat grids, and displays live feedback without reloading the browser.
3. **Controller (Logic Layer)**: Defined in `server/controllers/`. When Express routes receive an HTTP request from React, the controller processes calculations, checks permissions, reads/updates Mongoose models, and sends back clean JSON responses.

---

## 🛠️ 3. Exact Tech Stack (Strictly Within Syllabus)

Every tool and package used in Skytrip maps directly to the syllabus portions:

| Layer | Technology | Version / Tool | Syllabus Unit Reference | Purpose |
|---|---|---|---|---|
| **Server Runtime** | Node.js | v18+ LTS | **Unit I** | Event-driven JavaScript runtime using CommonJS (`require`). |
| **Web Framework** | Express.js | ^4.18.0 | **Unit I & IV** | Application, request, response objects, routing handlers, middleware mounting. |
| **Database** | MongoDB | Local (v6.0+) | **Unit III** | Document database running on `mongodb://localhost:27017/skytrip`. |
| **Data Modeling** | Mongoose | ^8.0.0 | **Unit III** | Schemas, Models, default values, predefined & custom modifiers, `.save()`, `.find()`. |
| **Authentication** | `jsonwebtoken` & `bcryptjs` | Latest | **Unit I & IV** | Stateless JWT bearer token issuance and secure salt-and-hash password storage. |
| **Build & Compiler**| Webpack + Babel | ^5.x / ^7.x | **Unit II** | Build-time JSX compilation (`babel-loader`, `@babel/preset-react`), bundling into `app.bundle.js`. |
| **Client UI** | React | ^18.2.0 | **Unit II** | Functional components, Hooks (`useState`, `useEffect`, `useContext`), event handling. |
| **Client Routing** | `react-router-dom` | ^6.x | **Unit V** | Simple routing, dynamic route params (`/flight/:id`), query strings, programmatic navigation. |
| **Styling** | Vanilla CSS | CSS3 | **Unit II** | Dark luxury theme (`#0a0f1f`, `#D4AF37` Gold), flexbox/grid cabin seat layouts. |

---

## 🔄 4. Complete User Flow of Action (Step-by-Step UX)

### Phase 1: Discovery & Flight Search (Open to All Guests)
```text
[Landing Page] ➔ [Enter Origin, Destination, Date] ➔ [Browse Flight Cards with Price & Times]
```
1. **Homepage Hero Search**: A visitor visits `http://localhost:5000`. They can search flights immediately without creating an account.
2. **Search Results (`/flights?from=BLR&to=DEL`)**:
   - The user sees cards for matching flights.
   - Dynamic filters allow adjusting price sliders, departure times (Morning / Evening), and airlines.
   - If seats are low, a badge displays: *"🔥 Only 4 seats left at this price!"*
3. The guest clicks **"Select Seats"** on their chosen flight.

### Phase 2: Interactive 2D Seat Selection (The Cabin Experience)
```text
[View 2D Fuselage Grid] ➔ [Click Desired Seats] ➔ [Live Price Calculation] ➔ [5-Min Hold Timer]
```
1. The user enters `/flight/:id`.
2. A top-down 2D diagram of the airplane cabin displays:
   - **Business Class** (front rows, wider seats, `2x2` layout).
   - **Economy Class** (main rows, `3x3` layout with central aisle).
3. **Seat Legend**:
   - 🟢 **Green (Available)**: Free to click.
   - 🔵 **Gold/Blue (Selected)**: Seats selected by the current user.
   - 🟡 **Amber (Hold)**: Temporarily reserved by someone else completing checkout.
   - 🔴 **Dark Gray (Booked)**: Permanently booked, disabled.
4. Clicking a Window seat shows a subtle surcharge (+₹150). The bottom bar updates live: *"2 Seats Selected (E12A, E12B) • Total: ₹7,300"*.
5. The user clicks **"Proceed to Book"**.

### Phase 3: The Seamless Authentication Gate (Frictionless Login)
```text
[Guest Clicks 'Proceed'] ➔ [Check Auth Status] ➔ [If Guest: Prompt Login] ➔ [Redirect Back with Seats Intact]
```
- If already logged in, the user proceeds directly to passenger entry.
- If visiting as a guest:
  - React preserves their selected flight and seat numbers in state.
  - Redirects to `/login` with a banner: *"Please log in or register to complete your reservation"*.
  - Upon logging in or registering, React automatically brings them **straight back to their chosen flight with their selected seats already highlighted!**

### Phase 4: Passenger Registry & Regulatory Validation
```text
[Enter Primary Passenger Info] ➔ [Add Co-passengers] ➔ [Aadhaar & Duplicate Check]
```
1. Skytrip displays a passenger card for each selected seat.
2. The user fills in:
   - Full Name, Age, Email, Phone Number, Meal Preference (Veg/Non-Veg).
   - **Aadhaar Number** (Mandatory 12 digits).
   - **Passport Number** (Optional, 6–20 alphanumeric).
3. **Instant Validation**:
   - If Aadhaar is not 12 numeric digits: *"Aadhaar must be exactly 12 digits"*.
   - If the same Aadhaar, phone, or name is entered for two different passengers: *"Duplicate passenger detected. Every passenger must have unique identification"*.

### Phase 5: Digital Wallet Checkout & Atomic Booking
```text
[Order Review] ➔ [Check Wallet Balance] ➔ [One-Click Debit] ➔ [Commit Booking]
```
1. The **Checkout Summary** presents base fare, taxes, seat surcharges, and total amount.
2. The user sees their **Skytrip Wallet Balance** (e.g., `₹10,000`):
   - **Case A: Sufficient Balance**: User clicks **"Pay ₹7,300 via Wallet"**. The server atomically deducts the balance, locks seats as `BOOKED`, and generates an official Booking ID.
   - **Case B: Insufficient Balance**: The button disables and shows: *"Short by ₹1,500"*. A **"Quick Top-Up"** modal allows them to add funds right on the page without losing their booking.

### Phase 6: E-Ticket Boarding Pass
```text
[Booking Confirmed] ➔ [Generate SKY-YYMMDD-XXXXX Reference] ➔ [Printable Boarding Pass]
```
1. User lands on `/confirmation/:bookingId`.
2. A printable ticket card renders containing:
   - Unique Booking Reference: `SKY-261018-8A3F`.
   - Flight number, route (BLR ➔ DEL), boarding gate, departure time, seat numbers.
   - Decorative barcode and passenger names.
3. User can click **"Print Ticket"** (`window.print()`).

### Phase 7: Post-Booking Management & Tiered Refund Cancellation
```text
[My Bookings] ➔ [Click Cancel] ➔ [Live Refund Tier Preview] ➔ [Confirm] ➔ [Instant Wallet Credit]
```
1. User visits `/my-bookings` to view all their reservations with badges (`[CONFIRMED]` or `[CANCELLED]`).
2. When the user clicks **"Cancel Booking"**, an **Interactive Refund Estimator Modal** opens before anything is finalized:
   - Calculates exact hours remaining until departure:
     - **$\ge 96$ hours (4+ days)**: **75% refund**
     - **$48$ to $96$ hours (2–4 days)**: **50% refund**
     - **$24$ to $48$ hours (1–2 days)**: **25% refund**
     - **$< 24$ hours**: **0% refund (Non-refundable)**
   - Shows: *"Total Paid: ₹4,000 | Eligible Refund: 50% (₹2,000) | Cancellation Fee: ₹2,000"*.
3. User confirms ➔ The booking status changes to `CANCELLED`.
4. The ₹2,000 is immediately credited back to their wallet passbook.
5. The seats immediately revert to `AVAILABLE` on the cabin seat map for other passengers.

---

### Phase 8: Airline Admin Experience (Simple & Functional)
```text
[Admin Login: /admin/login] ➔ [Add Flight Form] ➔ [Auto-Generate Cabin Grid] ➔ [Monitor Occupancy]
```
1. Admin logs in with `role: 'ADMIN'`.
2. Admin opens `/admin/add-flight`:
   - Enters Flight Number, Source, Destination, Departure Time, Arrival Time.
   - Defines Cabin Layout: e.g., Business rows (2) × columns (2), Economy rows (10) × columns (6).
   - Sets Base Fare and Business Class multiplier (e.g., `1.5x`).
3. On submission, the backend automatically generates the complete seat matrix.
4. Admin can view a live flight list with an **Occupancy Bar** (*"34/40 Seats Booked — 85%"*) and total revenue collected for that flight.

---

## 👥 5. Detailed Team Division (4-Man Work Breakdown)

Each team member has their own distinct domain covering Models, Controllers, Routes, and React UI. This prevents git merge conflicts and gives everyone a full MVC vertical slice to present for their viva!

```text
┌────────────────────────────────────────────────────────────────────────┐
│                      ✈️ SKYTRIP 4-MAN ROSTER                           │
├────────────────────┬────────────────────┬──────────────────────────────┤
│ Member 1           │ Member 2           │ Member 3                     │
│ Auth & Wallet      │ Flight & Admin     │ Seats & Passenger Registry   │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ Member 4                                                               │
│ Bookings, Orders & Tiered Refunds                                      │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 👤 Member 1 — Auth, User & Digital Wallet
**Domain**: User security, session management, and the digital payment wallet.

#### 1. Files Owned:
- `server/models/User.js`
- `server/controllers/authController.js`
- `server/controllers/walletController.js`
- `server/routes/authRoutes.js`
- `server/routes/walletRoutes.js`
- `server/middleware/auth.js`
- `src/context/AuthContext.jsx`
- `src/pages/Login.jsx` & `src/pages/Register.jsx`
- `src/components/WalletModal.jsx`

#### 2. Key Tasks:
- Design the `User` schema with embedded `walletBalance: Number` and `walletTransactions: Array`.
- Implement `bcryptjs` password hashing in Mongoose `User.pre('save')` hooks.
- Implement JWT token generation upon login and verification in `middleware/auth.js`.
- Build the `POST /api/wallet/topup` endpoint with MongoDB `$inc` for atomic balance updates.
- Build the React Login/Register pages and the Navbar Wallet Balance pill with top-up modal.

#### 3. Syllabus Concepts to Explain in Viva:
- *Unit I*: CommonJS modules (`require/module.exports`), Node closures in auth callbacks.
- *Unit III*: Schema definitions, predefined modifiers (`lowercase`, `trim`), default values.
- *Unit IV*: Request authorization headers (`Bearer <token>`), error handling.

---

### 👤 Member 2 — Flight Catalog, Search Engine & Admin Portal
**Domain**: Flight scheduling, search filters, and airline management.

#### 1. Files Owned:
- `server/models/Flight.js` (Core flight fields)
- `server/controllers/flightController.js`
- `server/routes/flightRoutes.js`
- `server/middleware/admin.js`
- `server/seed/seedFlights.js`
- `src/components/FlightCard.jsx`
- `src/components/FlightFilter.jsx`
- `src/pages/Home.jsx`
- `src/pages/SearchFlights.jsx`
- `src/pages/admin/AdminLogin.jsx` & `src/pages/admin/AddFlight.jsx`

#### 2. Key Tasks:
- Design the `Flight` Mongoose schema (flight number, source, destination, times, base fare).
- Build the search API (`GET /api/flights`) parsing Express query parameters (`req.query.from`, `req.query.to`, `req.query.date`, `req.query.sort`).
- Build the Admin flight creation form calculating Economy & Business pricing tiers.
- Build the initial database seeder (`seedFlights.js`) with 5–8 realistic domestic flights.
- Build the React Search results page with filter sliders and sorting options.

#### 3. Syllabus Concepts to Explain in Viva:
- *Unit III*: Mongoose `.find()`, query conditions, `.sort()`, `.limit()`.
- *Unit IV*: REST List API, HTTP query strings (`req.query`).
- *Unit V*: React Router query strings, programmatic navigation with `useNavigate()`.

---

### 👤 Member 3 — Seats, Cabin Dynamics & Passenger Registry
**Domain**: The interactive 2D cabin seat map and passenger validation.

#### 1. Files Owned:
- `server/models/Flight.js` (Embedded `SeatSchema` subdocuments)
- `server/controllers/seatController.js`
- `server/routes/seatRoutes.js`
- `server/utils/passengerValidator.js`
- `src/components/SeatMap.jsx`
- `src/components/PassengerForm.jsx`
- `src/pages/FlightDetails.jsx`
- `src/styles/seatmap.css`

#### 2. Key Tasks:
- Design the embedded `SeatSchema` (`seatNumber`, `seatClass`, `seatType`, `seatStatus`, `price`).
- Implement the seat-hold mechanism (`POST /api/seats/hold`) marking seats as `HOLD` with a 5-minute timeout.
- Implement passenger uniqueness validation (ensuring unique Aadhaar, Passport, Phone, Email across co-passengers).
- Build the React 2D SeatMap component with visual aisles, window seats, and dynamic color indicators.
- Build the dynamic passenger form generating input fields matching the count of selected seats.

#### 3. Syllabus Concepts to Explain in Viva:
- *Unit II*: React component hierarchy, state vs props, child-to-parent communication (`onSeatSelect`).
- *Unit III*: Mongoose embedded subdocuments, custom validation functions.
- *Unit V*: Controlled forms, input validation rules.

---

### 👤 Member 4 — Bookings, Checkout & Tiered Refunds
**Domain**: The booking lifecycle, wallet payment execution, ticket generation, and refunds.

#### 1. Files Owned:
- `server/models/Booking.js`
- `server/controllers/bookingController.js`
- `server/routes/bookingRoutes.js`
- `server/utils/refundCalculator.js`
- `src/pages/BookingSummary.jsx` (Checkout)
- `src/pages/Confirmation.jsx` (E-Ticket / Boarding Pass)
- `src/pages/MyBookings.jsx` (Reservations & Cancellation)
- `src/components/RefundModal.jsx`

#### 2. Key Tasks:
- Design the `Booking` schema (linking `userId`, `flightId`, seats, passengers, total paid, status).
- Build the checkout handler: deduct wallet balance, mark seats as `BOOKED`, save booking entity.
- Build the tiered cancellation math in `refundCalculator.js` (75%, 50%, 25%, 0% based on hours to departure).
- Build the cancellation endpoint: calculate refund, credit user's wallet, release seats to `AVAILABLE`, update status to `CANCELLED`.
- Build the printable E-Ticket card and the My Bookings reservation history dashboard.

#### 3. Syllabus Concepts to Explain in Viva:
- *Unit I & IV*: Express POST/PUT handler functions, request body parsing, error status codes.
- *Unit III*: Document updates (`findByIdAndUpdate`), Mongoose status transitions.
- *Unit V*: Route parameters (`/confirmation/:bookingId`), print styles with CSS media queries.

---

## 🗄️ 6. Database Schema Design (Mongoose)

### 1. `User` Schema (`server/models/User.js`)
```javascript
const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['TOPUP', 'DEBIT', 'REFUND'], required: true },
  amount: { type: Number, required: true },
  description: { type: String, default: '' },
  date: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String, required: true, trim: true },
  role: { type: String, enum: ['CUSTOMER', 'ADMIN'], default: 'CUSTOMER' },
  walletBalance: { type: Number, default: 5000.00, min: 0 }, // Starts with complimentary ₹5,000 for testing
  walletTransactions: [walletTransactionSchema]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
```

---

### 2. `Flight` Schema (`server/models/Flight.js`)
```javascript
const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  seatNumber: { type: String, required: true }, // e.g., 'E1A', 'B2C'
  seatClass: { type: String, enum: ['ECONOMY', 'BUSINESS'], required: true },
  seatType: { type: String, enum: ['WINDOW', 'AISLE', 'MIDDLE'], default: 'MIDDLE' },
  seatStatus: { type: String, enum: ['AVAILABLE', 'HOLD', 'BOOKED'], default: 'AVAILABLE' },
  heldUntil: { type: Date, default: null }, // 5-minute timeout tracking
  price: { type: Number, required: true }
});

const flightSchema = new mongoose.Schema({
  flightNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  aircraftType: { type: String, default: 'Boeing 737' },
  sourceAirport: { type: String, required: true, uppercase: true, trim: true }, // 'BLR'
  destinationAirport: { type: String, required: true, uppercase: true, trim: true }, // 'DEL'
  departureTime: { type: Date, required: true },
  arrivalTime: { type: Date, required: true },
  baseFare: { type: Number, required: true },
  taxes: { type: Number, default: 350 },
  businessMultiplier: { type: Number, default: 1.5 },
  seats: [seatSchema]
}, { timestamps: true });

module.exports = mongoose.model('Flight', flightSchema);
```

---

### 3. `Booking` Schema (`server/models/Booking.js`)
```javascript
const mongoose = require('mongoose');

const passengerDetailSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  age: { type: Number, required: true, min: 1, max: 120 },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  aadhaarNumber: { type: String, required: true, trim: true }, // 12-digit validator
  passportNumber: { type: String, trim: true },
  mealPreference: { type: String, default: 'VEG' },
  seatNumber: { type: String, required: true }
});

const bookingSchema = new mongoose.Schema({
  bookingReference: { type: String, required: true, unique: true }, // SKY-YYMMDD-XXXXX
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  flightId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight', required: true },
  passengers: [passengerDetailSchema],
  seatNumbers: [{ type: String, required: true }],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['CONFIRMED', 'CANCELLED'], default: 'CONFIRMED' },
  refundAmount: { type: Number, default: 0 },
  cancelledAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
```

---

## 📡 7. RESTful API Directory (Unit IV Spec)

| Category | Method | Endpoint | Access | Purpose |
|---|---|---|---|---|
| **Auth** | `POST` | `/api/auth/register` | Public | Register new customer or admin. |
| **Auth** | `POST` | `/api/auth/login` | Public | Verify credentials, return JWT token and user info. |
| **Auth** | `GET` | `/api/auth/me` | Protected | Fetch current logged-in user details. |
| **Wallet** | `GET` | `/api/wallet` | Protected | Get live wallet balance & transaction passbook. |
| **Wallet** | `POST` | `/api/wallet/topup` | Protected | Add funds to digital wallet. |
| **Flights** | `GET` | `/api/flights` | Public | Search flights with query params (`?from=BLR&to=DEL`). |
| **Flights** | `GET` | `/api/flights/:id` | Public | Get flight details and 2D seat cabin layout. |
| **Flights** | `POST` | `/api/flights` | Admin | Create a new flight and generate cabin seats. |
| **Flights** | `DELETE`| `/api/flights/:id` | Admin | Delete an empty flight from schedule. |
| **Seats** | `POST` | `/api/seats/hold` | Protected | Place temporary 5-minute hold on selected seats. |
| **Seats** | `POST` | `/api/seats/release` | Protected | Release seat hold back to `AVAILABLE`. |
| **Bookings**| `POST` | `/api/bookings` | Protected | Finalize checkout: deduct wallet and mark seats booked. |
| **Bookings**| `GET` | `/api/bookings/user`| Protected | Get booking history for current user. |
| **Bookings**| `GET` | `/api/bookings/:id` | Protected | Get single booking receipt details. |
| **Bookings**| `POST` | `/api/bookings/:id/cancel` | Protected | Calculate tiered refund, credit wallet, release seats. |

---

## 📁 8. Project Directory Structure

```text
Skytrip/
├── plan.md                           # This Master Plan File
├── server/                           # Backend (Node + Express + Mongoose)
│   ├── config/
│   │   └── db.js                     # Mongoose connection logic
│   ├── models/                       # [Unit III] Mongoose Models
│   │   ├── User.js                   # Member 1
│   │   ├── Flight.js                 # Member 2 & 3
│   │   └── Booking.js                # Member 4
│   ├── controllers/                  # [Unit IV] Business Logic
│   │   ├── authController.js         # Member 1
│   │   ├── walletController.js       # Member 1
│   │   ├── flightController.js       # Member 2
│   │   ├── seatController.js         # Member 3
│   │   └── bookingController.js      # Member 4
│   ├── routes/                       # [Unit IV] Express Routes
│   │   ├── authRoutes.js             # Member 1
│   │   ├── walletRoutes.js           # Member 1
│   │   ├── flightRoutes.js           # Member 2
│   │   ├── seatRoutes.js             # Member 3
│   │   └── bookingRoutes.js          # Member 4
│   ├── middleware/                   # Express Middlewares
│   │   ├── auth.js                   # JWT verification
│   │   ├── admin.js                  # Admin role verification
│   │   └── errorHandler.js           # Central error formatting
│   ├── utils/                        # Utilities
│   │   ├── passengerValidator.js     # Aadhaar & uniqueness logic
│   │   └── refundCalculator.js       # Tiered refund percentage math
│   ├── seed/
│   │   └── seedFlights.js            # Initial flights seed script
│   └── server.js                     # Express root server file
│
├── src/                              # Frontend Source (React)
│   ├── components/                   # [Unit II] Reusable UI Components
│   │   ├── Navbar.jsx                # Brand logo, wallet pill, login links
│   │   ├── Footer.jsx                # Footer
│   │   ├── FlightCard.jsx            # Flight search item card
│   │   ├── FlightFilter.jsx          # Route query filter form
│   │   ├── SeatMap.jsx               # Interactive 2D airplane cabin
│   │   ├── PassengerForm.jsx         # Dynamic passenger cards + validation
│   │   ├── WalletModal.jsx           # Wallet top-up modal
│   │   └── RefundModal.jsx           # Pre-cancellation refund estimator
│   ├── pages/                        # [Unit V] Routed Views
│   │   ├── Home.jsx                  # Hero search & popular routes
│   │   ├── SearchFlights.jsx         # Search results page
│   │   ├── FlightDetails.jsx         # Seat selection & passenger entry
│   │   ├── BookingSummary.jsx        # Checkout & wallet payment
│   │   ├── Confirmation.jsx          # Printable E-Ticket receipt
│   │   ├── MyBookings.jsx            # Reservations history & cancel button
│   │   ├── Login.jsx                 # Login form
│   │   ├── Register.jsx              # Register form
│   │   └── admin/                    # Admin Portal
│   │       ├── AdminLogin.jsx
│   │       └── AddFlight.jsx
│   ├── context/
│   │   └── AuthContext.jsx           # User & token state
│   ├── styles/
│   │   ├── styles.css                # Global theme variables & layout
│   │   └── seatmap.css               # 2D airplane cabin grid
│   ├── App.jsx                       # React Router configuration
│   └── index.jsx                     # ReactDOM entry point
│
├── public/                           # Static Webpack Output
│   ├── index.html                    # Single HTML mounting root
│   └── app.bundle.js                 # Compiled bundle generated by Webpack
│
├── .babelrc                          # Babel JSX compilation presets
├── webpack.config.js                 # Webpack compiler configuration
├── .env                              # PORT=5000, MONGO_URI, JWT_SECRET
└── package.json                      # Single root scripts: start, compile, watch
```

---

## 🚀 9. Step-by-Step Implementation Roadmap

```text
┌────────────────────────────────────────────────────────┐
│ PHASE 1: FOUNDATION & CORE BROWSING (EL Phase I)       │
│ • Setup package.json, Webpack, Babel & server.js       │
│ • Setup MongoDB connection in server/config/db.js      │
│ • M1: User model, Auth API, JWT middleware & Login UI  │
│ • M2: Flight model, Seed script, Search API & Cards UI │
├────────────────────────────────────────────────────────┤
│ PHASE 2: CABIN SEATS & BOOKING (EL Phase II)           │
│ • M3: Embedded SeatSchema, 2D SeatMap & Hold Logic     │
│ • M3: PassengerForm with Aadhaar & Duplicate check     │
│ • M4: Booking model, Wallet checkout transaction       │
│ • M4: Printable E-Ticket Boarding Pass View            │
├────────────────────────────────────────────────────────┤
│ PHASE 3: CANCELLATIONS, ADMIN & VIVA PREPARATION       │
│ • M4: Tiered refund calculator modal & wallet refund   │
│ • M1: Wallet passbook transaction statement            │
│ • M2: Admin Add Flight portal & occupancy stats        │
│ • Testing with Postman & SEE Lab Viva Preparation      │
└────────────────────────────────────────────────────────┘
```

---

## 🎯 10. Summary Checklist for Full Marks (CIE & SEE Lab)

- ✅ **MVC Structure**: Clear separation between `server/models/`, `src/` (views), and `server/controllers/`.
- ✅ **Unit I (Node & Express)**: Proper CommonJS `require`, Express routes, custom middleware.
- ✅ **Unit II (React & Webpack)**: Webpack bundling JSX to `app.bundle.js`, props/state hierarchy.
- ✅ **Unit III (MongoDB & Mongoose)**: Embedded subdocuments (`seats`, `passengers`), schema modifiers, default values, CRUD.
- ✅ **Unit IV (REST APIs)**: Proper HTTP verbs (`GET`, `POST`, `DELETE`), clean status codes, JSON responses.
- ✅ **Unit V (React Router & Forms)**: Route parameters (`/flight/:id`), query strings (`?from=BLR`), dynamic forms.

*Plan locked and ready for execution!*
