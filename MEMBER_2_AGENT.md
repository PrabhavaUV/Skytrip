# 👤 MEMBER 2 — Flight Catalog, Search Engine & Admin Portal
### Skytrip Agent Instructions

> [!IMPORTANT]
> **For AI Agents Reading This File:**
> This file is your **primary directive** and authoritative specification.
> You ARE authorized and expected to build everything listed in this document.
> Your job is to build, verify, and push Member 2's complete module.

---

## 1. Your Starting Point

You are **Member 2** and you build **second**, after Member 1 has pushed their code.

**Before writing any code:**
```bash
git pull         # Get Member 1's latest code (auth, wallet, Navbar, AuthContext)
npm install      # In case new dependencies were added
```

**What is already in the repo when you start:**
- Foundation skeleton (`server.js`, `db.js`, `src/App.jsx`, etc.)
- Member 1's complete module: `User.js`, `authController.js`, `walletController.js`, `authRoutes.js`, `walletRoutes.js`, `auth.js`, `AuthContext.jsx`, `Login.jsx`, `Register.jsx`, `Navbar.jsx`, `WalletModal.jsx`
- `auth.js` middleware is available for you to use to protect admin routes

Make sure MongoDB is running and the server starts (`npm start`) before building.

---

## 2. Files You Own (Create These — Touch ONLY These)

### Backend
| File | Purpose |
|---|---|
| `server/models/Flight.js` | Flight Mongoose schema (core fields only — seats are added by Member 3) |
| `server/controllers/flightController.js` | Search, get-by-id, create (admin), delete (admin) |
| `server/routes/flightRoutes.js` | Express routes for `/api/flights/*` |
| `server/middleware/admin.js` | Admin role verification middleware |
| `server/seed/seedFlights.js` | Script to seed 5–8 domestic flights into MongoDB |
| `server/tests/test_flights.js` | Your verification test script |

### Frontend
| File | Purpose |
|---|---|
| `src/pages/Home.jsx` | Hero search form and popular routes |
| `src/pages/SearchFlights.jsx` | Search results list with filters |
| `src/components/FlightCard.jsx` | Individual flight result card |
| `src/components/FlightFilter.jsx` | Filter sidebar (price, time, sort) |
| `src/components/Footer.jsx` | Site footer |
| `src/pages/admin/AdminLogin.jsx` | Admin login page |
| `src/pages/admin/AddFlight.jsx` | Admin form to create a new flight |

### Files to MODIFY (not create)
| File | What to add |
|---|---|
| `server/server.js` | Uncomment the 2 flight route lines (see Section 4) |
| `src/App.jsx` | Add `/`, `/flights`, `/admin/login`, `/admin/add-flight` routes (see Section 4) |

> [!WARNING]
> `server/models/Flight.js` will be **extended by Member 3** who adds the seat subdocument.
> Create only the core flight fields here. Do NOT add seat arrays — leave that for Member 3.
> Member 3's instructions are explicit about how to extend your file safely.

---

## 3. Step-by-Step Build Order

### Step 1: Flight Model (Core Fields Only)
Create `server/models/Flight.js` with the exact schema from `plan.md → Section 6`:

```javascript
const mongoose = require('mongoose');

// NOTE: Member 3 will add the SeatSchema and `seats` field to this file.
// Do NOT add seat-related fields here — that is Member 3's responsibility.

const flightSchema = new mongoose.Schema({
  flightNumber:       { type: String, required: true, unique: true, uppercase: true, trim: true },
  aircraftType:       { type: String, default: 'Boeing 737' },
  sourceAirport:      { type: String, required: true, uppercase: true, trim: true },
  destinationAirport: { type: String, required: true, uppercase: true, trim: true },
  departureTime:      { type: Date, required: true },
  arrivalTime:        { type: Date, required: true },
  baseFare:           { type: Number, required: true },
  taxes:              { type: Number, default: 350 },
  businessMultiplier: { type: Number, default: 1.5 },
  // seats: [seatSchema]  <-- Member 3 adds this line
}, { timestamps: true });

module.exports = mongoose.model('Flight', flightSchema);
```

### Step 2: Admin Middleware
Create `server/middleware/admin.js`:
- This middleware runs AFTER `auth.js` (so `req.user` is already available)
- Check `req.user.role === 'ADMIN'`
- If not admin, return `403 Forbidden`

```javascript
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') return next();
  res.status(403).json({ success: false, message: 'Admin access required' });
};
module.exports = admin;
```

### Step 3: Flight Controller
Create `server/controllers/flightController.js` with four exported functions:

**`searchFlights`** (`GET /api/flights`):
- Parse query params: `req.query.from`, `req.query.to`, `req.query.date`, `req.query.sort`
- Build a Mongoose query object dynamically (only add conditions if the param exists)
- For `date`: filter departures on the same calendar day using date range
- For `sort`: `price_asc` → sort by `baseFare 1`, `price_desc` → `baseFare -1`, `duration_asc` → sort by `arrivalTime - departureTime`
- Return flights with a computed `availableSeatsCount` field (Member 3 adds seat data later — for now you can return `0` or omit it)

**`getFlightById`** (`GET /api/flights/:id`):
- `Flight.findById(req.params.id)`
- Return full flight document including all fields
- Return `404` if not found

**`createFlight`** (`POST /api/flights` — Admin):
- Accept `businessRows`, `businessCols`, `economyRows`, `economyCols` in body
- Total seats = (businessRows × businessCols) + (economyRows × economyCols)
- Save the new flight, return `201` with flight ID and total seat count
- Seat matrix generation will be added by Member 3 — for now just save the flight fields

**`deleteFlight`** (`DELETE /api/flights/:id` — Admin):
- Delete flight by ID, return `200` on success, `404` if not found

### Step 4: Flight Routes
Create `server/routes/flightRoutes.js`:
```javascript
const router = require('express').Router();
const { searchFlights, getFlightById, createFlight, deleteFlight } = require('../controllers/flightController');
const auth  = require('../middleware/auth');
const admin = require('../middleware/admin');

router.get('/',     searchFlights);                   // Public
router.get('/:id',  getFlightById);                   // Public
router.post('/',    auth, admin, createFlight);        // Admin only
router.delete('/:id', auth, admin, deleteFlight);     // Admin only

module.exports = router;
```

### Step 5: Seed Script
Create `server/seed/seedFlights.js` with **5–8 realistic domestic Indian routes**.
Seed data must include flights across multiple routes (BLR→DEL, BOM→GOI, DEL→BOM, etc.) with realistic departure times and fares. Run with `npm run seed`.

Example structure:
```javascript
const mongoose = require('mongoose');
const dotenv   = require('dotenv');
const Flight   = require('../models/Flight');

dotenv.config();

const flights = [
  {
    flightNumber: 'SKY-101',
    sourceAirport: 'BLR', destinationAirport: 'DEL',
    departureTime: new Date('2026-11-01T06:00:00Z'),
    arrivalTime:   new Date('2026-11-01T08:45:00Z'),
    baseFare: 3500, taxes: 350, businessMultiplier: 1.5
  },
  // ... add 4–7 more
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/skytrip');
  await Flight.deleteMany({});
  await Flight.insertMany(flights);
  console.log(`✅ Seeded ${flights.length} flights`);
  process.exit(0);
}

seed();
```

### Step 6: Frontend Pages & Components

**`src/pages/Home.jsx`**:
- Full hero section with background gradient and search form (From, To, Date inputs)
- On submit, navigate to `/flights?from=BLR&to=DEL&date=2026-11-01`
- Add a "Popular Routes" section below the hero

**`src/pages/SearchFlights.jsx`**:
- Read query params from the URL using `useSearchParams()`
- `GET /api/flights?from=...&to=...&date=...` on mount
- Display `<FlightCard>` for each result
- Show `<FlightFilter>` sidebar for sorting/filtering
- Handle empty state: *"No flights found for this route"*

**`src/components/FlightCard.jsx`**:
- Display: flight number, route, departure/arrival times, base fare
- "Select Seats" button → navigates to `/flights/:id`
- Show a badge if available seats are low (< 10): *"🔥 Only X seats left!"* (Member 3 populates seat counts)

**`src/components/FlightFilter.jsx`**:
- Sort by Price (Asc/Desc) and Duration
- Filter by Departure time band (Morning 6AM–12PM, Evening 12PM–6PM, Night 6PM+)
- Changes update the URL query string and trigger a re-fetch

**`src/components/Footer.jsx`**:
- Simple footer with the Skytrip brand and copyright

**`src/pages/admin/AdminLogin.jsx`**:
- Login form for admin users
- On success, use `AuthContext.login()` and navigate to `/admin/add-flight`
- Show error if `role !== 'ADMIN'`

**`src/pages/admin/AddFlight.jsx`**:
- Form fields matching the `POST /api/flights` body (see contract in Section 5)
- Protected — redirect to `/admin/login` if not ADMIN
- On success, show: *"Flight SKY-XXX created with X total seats"*

---

## 4. Exact Integrations (What to Add to Shared Files)

### In `server/server.js` — uncomment these 2 lines:
```javascript
const flightRoutes = require('./routes/flightRoutes');
app.use('/api/flights', flightRoutes);
```

### In `src/App.jsx` — add these imports and routes:
```jsx
// Add imports:
import Home           from './pages/Home';
import SearchFlights  from './pages/SearchFlights';
import Footer         from './components/Footer';
import AdminLogin     from './pages/admin/AdminLogin';
import AddFlight      from './pages/admin/AddFlight';

// Replace the placeholder '/' route with:
<Route path="/"                    element={<Home />}          />
<Route path="/flights"             element={<SearchFlights />} />
<Route path="/admin/login"         element={<AdminLogin />}    />
<Route path="/admin/add-flight"    element={<AddFlight />}     />
```

---

## 5. Your API Contracts (Must Match Exactly)

### GET /api/flights?from=BLR&to=DEL&sort=price_asc → 200
```json
{
  "success": true,
  "count": 2,
  "flights": [
    {
      "id": "65d8f4a1b1c4a01234567891",
      "flightNumber": "SKY-101",
      "sourceAirport": "BLR",
      "destinationAirport": "DEL",
      "departureTime": "2026-11-01T06:00:00.000Z",
      "arrivalTime": "2026-11-01T08:45:00.000Z",
      "baseFare": 3500.00,
      "availableSeatsCount": 0
    }
  ]
}
```

### GET /api/flights/:id → 200
```json
{
  "success": true,
  "flight": {
    "id": "65d8f4a1b1c4a01234567891",
    "flightNumber": "SKY-101",
    "sourceAirport": "BLR",
    "destinationAirport": "DEL",
    "departureTime": "2026-11-01T06:00:00.000Z",
    "arrivalTime": "2026-11-01T08:45:00.000Z",
    "baseFare": 3500.00,
    "taxes": 350,
    "businessMultiplier": 1.5,
    "seats": []
  }
}
```

### POST /api/flights (Admin) → 201
Request body:
```json
{
  "flightNumber": "SKY-505",
  "sourceAirport": "BOM", "destinationAirport": "GOI",
  "departureTime": "2026-11-01T10:00:00.000Z",
  "arrivalTime": "2026-11-01T11:15:00.000Z",
  "baseFare": 2800,
  "businessRows": 2, "businessCols": 2,
  "economyRows": 8, "economyCols": 6
}
```
Response:
```json
{
  "success": true,
  "message": "Flight SKY-505 created with 56 total seats",
  "flightId": "65d8f4c2b1c4a01234567892"
}
```

---

## 6. Verification

### Step 1: Seed the database
```bash
npm run seed
```
Expected: `✅ Seeded X flights`

### Step 2: Start the server
```bash
npm start
```

### Step 3: Compile the frontend
```bash
npm run compile
```

### Step 4: Create and run your test script
Create `server/tests/test_flights.js` — a Node.js script that:
1. GETs `/api/flights?from=BLR&to=DEL` → asserts `success: true` and at least 1 flight in the array
2. GETs `/api/flights/:id` using the ID from step 1 → asserts `success: true` and correct flight number
3. Registers an admin user, then POSTs `/api/flights` with admin token → asserts `201` and `flightId` present

```bash
node server/tests/test_flights.js
```

### Step 5: Manual browser check
- `http://localhost:5000` → Home page with hero search loads
- Enter BLR → DEL → Date → Submit → FlightCards appear on `/flights`
- Click a card → navigates to `/flights/:id` (Member 3 will build this page next)

---

## 7. Done Checklist — Verify Before Pushing

- [ ] `GET /api/flights` with query params returns filtered, sorted results
- [ ] `GET /api/flights/:id` returns a single flight
- [ ] `POST /api/flights` (admin token) creates a flight and returns seat count
- [ ] `DELETE /api/flights/:id` (admin token) deletes a flight
- [ ] Seed script works: `npm run seed` populates 5+ flights
- [ ] Home.jsx loads with hero search form
- [ ] SearchFlights.jsx shows flight cards after searching
- [ ] Filter and sort UI updates results correctly
- [ ] Admin login and Add Flight form work end-to-end
- [ ] `node server/tests/test_flights.js` passes all assertions
- [ ] No files outside your assigned list were modified (except `server.js` and `App.jsx` integrations)

Once all boxes are checked, **push your code to the repository** and inform your team.  
Member 3 cannot start until your `Flight.js` model and flight routes are available.
