# 👤 MEMBER 3 — Seats, Cabin Dynamics & Passenger Registry
### Skytrip Agent Instructions

> [!IMPORTANT]
> **For AI Agents Reading This File:**
> This file is your **primary directive** and authoritative specification.
> You ARE authorized and expected to build everything listed in this document.
> Your job is to build, verify, and push Member 3's complete module.

---

## 1. Your Starting Point

You are **Member 3** and you build **third**, after Members 1 and 2 have pushed their code.

**Before writing any code:**
```bash
git pull         # Get Members 1 and 2's latest code
npm install
```

**What is already in the repo when you start:**
- Foundation skeleton
- Member 1's complete module: `User.js`, all auth/wallet routes, `auth.js` middleware, all auth frontend pages
- Member 2's complete module: `Flight.js` (core fields only — no seats yet), all flight routes, seed script, Home, SearchFlights, FlightCard pages

Make sure the server starts and the seed data is loaded before building.

---

## 2. Files You Own

### Backend
| File | Purpose |
|---|---|
| `server/models/Flight.js` | **EXTEND** (do not replace) — add `SeatSchema` subdocument |
| `server/controllers/seatController.js` | Hold and release seat endpoints |
| `server/routes/seatRoutes.js` | Express routes for `/api/seats/*` |
| `server/utils/passengerValidator.js` | Aadhaar regex and duplicate passenger check |
| `server/tests/test_seats.js` | Your verification test script |

### Frontend
| File | Purpose |
|---|---|
| `src/pages/FlightDetails.jsx` | Full flight details page: seat map + passenger form together |
| `src/components/SeatMap.jsx` | 2D interactive airplane cabin grid |
| `src/components/PassengerForm.jsx` | Dynamic passenger detail cards |
| `src/styles/seatmap.css` | Cabin grid layout styles |

### Files to MODIFY (not create)
| File | What to add |
|---|---|
| `server/models/Flight.js` | Add `seatSchema` definition and `seats: [seatSchema]` field (see Section 3, Step 1) |
| `server/controllers/flightController.js` | Add seat matrix generation inside `createFlight` (see Section 3, Step 2) |
| `server/server.js` | Uncomment the 2 seat route lines (see Section 4) |
| `src/App.jsx` | Add `/flights/:id` route (see Section 4) |

---

## 3. Step-by-Step Build Order

### Step 1: Extend Flight.js with SeatSchema

> [!CAUTION]
> **CRITICAL**: `server/models/Flight.js` was created by Member 2. You must EXTEND it — do NOT delete or replace the existing `flightSchema` fields. Add the seat schema BEFORE the `flightSchema` definition and add `seats: [seatSchema]` to the existing schema object.

Open `server/models/Flight.js`. The file currently looks like this (Member 2's work):
```javascript
const mongoose = require('mongoose');
// ... (Member 2's flightSchema with core fields)
module.exports = mongoose.model('Flight', flightSchema);
```

You need to INSERT the `seatSchema` BEFORE the `flightSchema`, and ADD `seats: [seatSchema]` inside the existing `flightSchema`. The final file should look like this:

```javascript
const mongoose = require('mongoose');

// ── Member 3: Embedded Seat Subdocument ──────────────────────
const seatSchema = new mongoose.Schema({
  seatNumber: { type: String, required: true },         // e.g., 'E1A', 'B2C'
  seatClass:  { type: String, enum: ['ECONOMY', 'BUSINESS'], required: true },
  seatType:   { type: String, enum: ['WINDOW', 'AISLE', 'MIDDLE'], default: 'MIDDLE' },
  seatStatus: { type: String, enum: ['AVAILABLE', 'HOLD', 'BOOKED'], default: 'AVAILABLE' },
  heldUntil:  { type: Date, default: null },            // Tracks 5-minute hold expiry
  price:      { type: Number, required: true }
});

// ── Member 2: Core Flight Fields (DO NOT MODIFY BELOW) ────────
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
  seats: [seatSchema]  // ← Member 3 adds this field
}, { timestamps: true });

module.exports = mongoose.model('Flight', flightSchema);
```

After saving: **re-run `npm run seed`** so seeded flights get re-saved with the new schema shape.

### Step 2: Add Seat Matrix Generation to flightController.js

Open `server/controllers/flightController.js` (Member 2's file). Inside the `createFlight` function, AFTER reading `businessRows`, `businessCols`, `economyRows`, `economyCols` from `req.body`, add the seat matrix generation logic:

```javascript
// Generate Business Class seats (e.g., 2 rows x 2 cols = B1A, B1B, B2A, B2B)
const seats = [];
const colLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
const businessPrice = baseFare * businessMultiplier;

for (let row = 1; row <= businessRows; row++) {
  for (let col = 0; col < businessCols; col++) {
    const seatType = (col === 0 || col === businessCols - 1) ? 'WINDOW' : 'AISLE';
    seats.push({
      seatNumber: `B${row}${colLabels[col]}`,
      seatClass:  'BUSINESS',
      seatType,
      seatStatus: 'AVAILABLE',
      price: seatType === 'WINDOW' ? businessPrice + 150 : businessPrice
    });
  }
}

// Generate Economy Class seats (e.g., 10 rows x 6 cols = E1A...E10F)
const economyPrice = baseFare;
for (let row = 1; row <= economyRows; row++) {
  for (let col = 0; col < economyCols; col++) {
    let seatType = 'MIDDLE';
    if (col === 0 || col === economyCols - 1) seatType = 'WINDOW';
    else if (col === 1 || col === economyCols - 2) seatType = 'AISLE';
    seats.push({
      seatNumber: `E${row}${colLabels[col]}`,
      seatClass:  'ECONOMY',
      seatType,
      seatStatus: 'AVAILABLE',
      price: seatType === 'WINDOW' ? economyPrice + 150 : economyPrice
    });
  }
}

// Assign generated seats to the new flight document before saving
newFlight.seats = seats;
```

### Step 3: Passenger Validator
Create `server/utils/passengerValidator.js`:

```javascript
// Rule 1: Aadhaar must be exactly 12 numeric digits
const validateAadhaar = (aadhaar) => /^\d{12}$/.test(aadhaar);

// Rule 2: Passport must be 6-20 alphanumeric (optional field)
const validatePassport = (passport) => !passport || /^[A-Z0-9]{6,20}$/.test(passport);

// Rule 3: No two passengers in the same booking can share Aadhaar, phone, or passport
const checkDuplicatePassengers = (passengers) => {
  const aadhaarSet  = new Set();
  const phoneSet    = new Set();
  const passportSet = new Set();

  for (const p of passengers) {
    if (aadhaarSet.has(p.aadhaarNumber))  return { valid: false, message: 'Duplicate Aadhaar number detected' };
    if (phoneSet.has(p.phone))            return { valid: false, message: 'Duplicate phone number detected' };
    if (p.passportNumber && passportSet.has(p.passportNumber))
                                          return { valid: false, message: 'Duplicate passport number detected' };
    aadhaarSet.add(p.aadhaarNumber);
    phoneSet.add(p.phone);
    if (p.passportNumber) passportSet.add(p.passportNumber);
  }
  return { valid: true };
};

module.exports = { validateAadhaar, validatePassport, checkDuplicatePassengers };
```

### Step 4: Seat Controller
Create `server/controllers/seatController.js` with two exported functions:

**`holdSeats`** (`POST /api/seats/hold`):
1. Receive `{ flightId, seatNumbers: ['E12A', 'E12B'] }` from body
2. Find the flight by ID
3. Before marking as HOLD, release any expired holds first:
   ```javascript
   const now = new Date();
   flight.seats.forEach(seat => {
     if (seat.seatStatus === 'HOLD' && seat.heldUntil && seat.heldUntil < now) {
       seat.seatStatus = 'AVAILABLE';
       seat.heldUntil  = null;
     }
   });
   ```
4. Check all requested seats are `AVAILABLE` — if any is not, return `409 Conflict`
5. Set each requested seat: `seatStatus = 'HOLD'`, `heldUntil = new Date(Date.now() + 5*60*1000)`
6. Save the flight document
7. Return `200` with held seat numbers and `heldUntil` timestamp

**`releaseSeats`** (`POST /api/seats/release`):
1. Receive `{ flightId, seatNumbers }` from body
2. Find the flight, set matched seats back to `AVAILABLE` and `heldUntil = null`
3. Save and return `200`

### Step 5: Seat Routes
Create `server/routes/seatRoutes.js`:
```javascript
const router = require('express').Router();
const { holdSeats, releaseSeats } = require('../controllers/seatController');
const auth = require('../middleware/auth');

router.post('/hold',    auth, holdSeats);    // POST /api/seats/hold
router.post('/release', auth, releaseSeats); // POST /api/seats/release

module.exports = router;
```

### Step 6: SeatMap CSS
Create `src/styles/seatmap.css` with the 2D cabin grid layout:
- Use CSS Grid for the cabin layout
- Business class rows: `2x2` columns with wider seats
- Economy class rows: `3-3` layout with a visible aisle gap in the middle
- Seat color classes matching the CSS variables: `.seat-available`, `.seat-hold`, `.seat-booked`, `.seat-selected`

### Step 7: SeatMap Component
Create `src/components/SeatMap.jsx`:
- Accept props: `seats` (array from API), `selectedSeats` (array of seat numbers), `onSeatSelect` (callback)
- Separate business and economy seats by `seatClass`
- Render each seat as a clickable button
- Color-code based on status:
  - `AVAILABLE` → green (clickable)
  - `HOLD` — check `heldUntil > now` → amber (disabled)
  - `BOOKED` → dark gray (disabled)
  - In `selectedSeats` array → gold (clickable to deselect)
- Show a legend below the map
- Show live price update bar at the bottom: `"2 Seats Selected • Total: ₹7,300"`
- Import `seatmap.css` at the top of this file

### Step 8: Passenger Form Component
Create `src/components/PassengerForm.jsx`:
- Accept props: `selectedSeats` (array of seat numbers), `onPassengersChange` (callback)
- Dynamically render one passenger card per selected seat
- Each card has: Full Name, Age, Email, Phone, Aadhaar Number, Passport Number (optional), Meal Preference (Veg/Non-Veg)
- Use `passengerValidator` logic on the frontend to show inline errors:
  - Aadhaar not 12 digits → `"Aadhaar must be exactly 12 digits"`
  - Any duplicate across passengers → `"Duplicate detected: every passenger must have unique identification"`

### Step 9: FlightDetails Page
Create `src/pages/FlightDetails.jsx`:
- Fetch flight by ID: `GET /api/flights/:id` on mount
- Render flight info header (route, times, fare)
- Render `<SeatMap>` with the fetched seats
- On seat selection: if not logged in, redirect to `/login` (with state to return here)
- On seat selection: if logged in, call `POST /api/seats/hold` to lock the seats
- Below the map, render `<PassengerForm>` for the selected seats
- "Proceed to Book" button → validates passengers → navigates to `/booking-summary` passing `{ flightId, selectedSeats, passengers, totalAmount }` via React Router state

---

## 4. Exact Integrations (What to Add to Shared Files)

### In `server/server.js` — uncomment these 2 lines:
```javascript
const seatRoutes = require('./routes/seatRoutes');
app.use('/api/seats', seatRoutes);
```

### In `src/App.jsx` — add these imports and routes:
```jsx
// Add import:
import FlightDetails from './pages/FlightDetails';

// Add route:
<Route path="/flights/:id" element={<FlightDetails />} />
```

---

## 5. Your API Contracts (Must Match Exactly)

### POST /api/seats/hold → 200
Request: `{ "flightId": "...", "seatNumbers": ["E12A", "E12B"] }`
```json
{
  "success": true,
  "heldSeats": ["E12A", "E12B"],
  "heldUntil": "2026-10-25T14:35:00.000Z",
  "holdDurationSeconds": 300
}
```

### POST /api/seats/hold → 409 (seat not available)
```json
{
  "success": false,
  "message": "Seat E12A is not available"
}
```

### POST /api/seats/release → 200
Request: `{ "flightId": "...", "seatNumbers": ["E12A", "E12B"] }`
```json
{
  "success": true,
  "message": "Seats released successfully"
}
```

---

## 6. Verification

### Step 1: Re-seed flights with seat data
After modifying `Flight.js` with the SeatSchema, re-run the seed and then create a test flight via the Admin API (so it has generated seats):
```bash
npm run seed
```
Then use the Admin API to create one flight with seats (POST /api/flights with businessRows, etc.).

### Step 2: Start the server
```bash
npm start
```

### Step 3: Create and run your test script
Create `server/tests/test_seats.js` — a Node.js script that:
1. Logs in as a user to get a token
2. Gets a flight ID that has seats
3. POSTs `/api/seats/hold` with 2 seat numbers → asserts `success: true` and `heldUntil` is a future date
4. POSTs `/api/seats/hold` again with the same seats → asserts `409` (seats not available)
5. POSTs `/api/seats/release` → asserts `success: true`
6. POSTs `/api/seats/hold` again → asserts it works again (seats were released)

```bash
node server/tests/test_seats.js
```

### Step 4: Manual browser check
- Navigate to a flight card on `/flights` → click "Select Seats"
- The `/flights/:id` page should show the 2D cabin map
- Click seats — they turn gold and the price bar updates
- Click "Proceed to Book" without logging in → redirects to `/login`
- After login → returns to `/flights/:id` with seats still selected
- Fill passenger form with invalid Aadhaar → error shows inline
- Fill correctly → "Proceed to Book" is enabled

---

## 7. Done Checklist — Verify Before Pushing

- [ ] `Flight.js` extended with `SeatSchema` — existing Member 2 fields untouched
- [ ] `flightController.js` creates a full seat matrix when admin creates a flight
- [ ] `POST /api/seats/hold` holds seats for 5 minutes and returns correct response
- [ ] `POST /api/seats/release` releases seats back to AVAILABLE
- [ ] Expired hold seats are auto-released on the next hold request
- [ ] `passengerValidator.js` correctly validates Aadhaar format and detects duplicates
- [ ] SeatMap renders Business and Economy cabins with correct colors
- [ ] Passenger form shows one card per selected seat with inline validation
- [ ] FlightDetails page: auth gate works (guest → login → returns with seats intact)
- [ ] `node server/tests/test_seats.js` passes all assertions
- [ ] No files outside your assigned list were modified (except `Flight.js` extension, `flightController.js` seat generation, `server.js` and `App.jsx` integrations)

Once all boxes are checked, **push your code to the repository** and inform your team.  
Member 4 cannot start until seat hold/release is working and the FlightDetails page is complete.
