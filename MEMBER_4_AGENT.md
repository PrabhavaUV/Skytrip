# 👤 MEMBER 4 — Bookings, Checkout & Tiered Refunds
### Skytrip Agent Instructions

> [!IMPORTANT]
> **For AI Agents Reading This File:**
> This file is your **primary directive** and authoritative specification.
> You ARE authorized and expected to build everything listed in this document.
> Your job is to build, verify, and push Member 4's complete module.

---

## 1. Your Starting Point

You are **Member 4** and you build **last**, after Members 1, 2, and 3 have pushed their code.

**Before writing any code:**
```bash
git pull         # Get all previous members' latest code
npm install
```

**What is already in the repo when you start:**
- Foundation skeleton
- Member 1: User model with wallet, all auth/wallet routes and UI
- Member 2: Flight model (core fields), flight search API, seed data, Home/Search/Admin pages
- Member 3: Flight model (with seat subdocument), seat hold/release API, SeatMap, PassengerForm, FlightDetails page

Your module is the **final piece** that connects all other modules into a complete booking transaction. You will use `User.js`, `Flight.js`, `auth.js`, and the wallet debit pattern from Member 1's code.

Make sure the server starts, seed data is loaded, and a flight with seats exists before building.

---

## 2. Files You Own (Create These — Touch ONLY These)

### Backend
| File | Purpose |
|---|---|
| `server/models/Booking.js` | Booking Mongoose schema |
| `server/controllers/bookingController.js` | Create booking (checkout), get bookings, cancel booking |
| `server/routes/bookingRoutes.js` | Express routes for `/api/bookings/*` |
| `server/utils/refundCalculator.js` | Tiered refund percentage logic |
| `server/tests/test_bookings.js` | Your verification test script |

### Frontend
| File | Purpose |
|---|---|
| `src/pages/BookingSummary.jsx` | Checkout page — order review and wallet payment |
| `src/pages/Confirmation.jsx` | E-Ticket / Boarding Pass (printable) |
| `src/pages/MyBookings.jsx` | User's booking history and cancellation |
| `src/components/RefundModal.jsx` | Pre-cancellation refund estimator modal |

### Files to MODIFY (not create)
| File | What to add |
|---|---|
| `server/server.js` | Uncomment the 2 booking route lines (see Section 4) |
| `src/App.jsx` | Add `/booking-summary`, `/confirmation/:bookingId`, `/my-bookings` routes (see Section 4) |

---

## 3. Step-by-Step Build Order

### Step 1: Refund Calculator
Create `server/utils/refundCalculator.js` first — it is pure logic with no dependencies:

```javascript
/**
 * Calculates refund amount based on hours remaining until flight departure.
 * Policy (from plan.md):
 *   >= 96 hours (4+ days) → 75% refund
 *   48 to 96 hours (2-4 days) → 50% refund
 *   24 to 48 hours (1-2 days) → 25% refund
 *   < 24 hours → 0% refund (Non-refundable)
 *
 * @param {Date} departureTime - The flight's departure datetime
 * @param {number} totalAmount - The original amount paid
 * @returns {{ hoursUntilDeparture, refundPercentage, refundAmount }}
 */
const calculateRefund = (departureTime, totalAmount) => {
  const now = new Date();
  const msUntilDeparture = new Date(departureTime).getTime() - now.getTime();
  const hoursUntilDeparture = msUntilDeparture / (1000 * 60 * 60);

  let refundPercentage;
  if (hoursUntilDeparture >= 96)      refundPercentage = 75;
  else if (hoursUntilDeparture >= 48) refundPercentage = 50;
  else if (hoursUntilDeparture >= 24) refundPercentage = 25;
  else                                 refundPercentage = 0;

  const refundAmount = (totalAmount * refundPercentage) / 100;

  return {
    hoursUntilDeparture: Math.max(0, Math.floor(hoursUntilDeparture)),
    refundPercentage,
    refundAmount
  };
};

module.exports = { calculateRefund };
```

### Step 2: Booking Model
Create `server/models/Booking.js` with the exact schema from `plan.md → Section 6`:

```javascript
const mongoose = require('mongoose');

const passengerDetailSchema = new mongoose.Schema({
  fullName:       { type: String, required: true, trim: true },
  age:            { type: Number, required: true, min: 1, max: 120 },
  email:          { type: String, trim: true, lowercase: true },
  phone:          { type: String, trim: true },
  aadhaarNumber:  { type: String, required: true, trim: true },
  passportNumber: { type: String, trim: true },
  mealPreference: { type: String, default: 'VEG' },
  seatNumber:     { type: String, required: true }
});

const bookingSchema = new mongoose.Schema({
  bookingReference: { type: String, required: true, unique: true }, // SKY-YYMMDD-XXXXX
  userId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  flightId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Flight',  required: true },
  passengers:       [passengerDetailSchema],
  seatNumbers:      [{ type: String, required: true }],
  totalAmount:      { type: Number, required: true },
  status:           { type: String, enum: ['CONFIRMED', 'CANCELLED'], default: 'CONFIRMED' },
  refundAmount:     { type: Number, default: 0 },
  cancelledAt:      { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
```

### Step 3: Booking Reference Generator
In `bookingController.js`, you need a helper to generate the unique booking reference in format `SKY-YYMMDD-XXXXX`:

```javascript
const generateBookingRef = () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `SKY-${yy}${mm}${dd}-${rand}`;
};
```

### Step 4: Booking Controller
Create `server/controllers/bookingController.js` with three exported functions:

**`createBooking`** (`POST /api/bookings`):
This is the core atomic checkout. The logic must be performed in this exact order:

1. Receive `{ flightId, seatNumbers, passengers, totalAmount }` from body
2. Validate passenger data using `passengerValidator` (import from `../utils/passengerValidator`)
3. Find the user: `User.findById(req.user.id)`
4. **Check wallet balance**: if `user.walletBalance < totalAmount` → return `400` with message *"Insufficient wallet balance. Short by ₹X"*
5. Find the flight: `Flight.findById(flightId)`
6. Verify all seats in `seatNumbers` are currently `HOLD` (not just AVAILABLE — they should have been held by Member 3's seat controller before checkout)
7. **Atomically deduct wallet**: 
   ```javascript
   await User.findByIdAndUpdate(req.user.id, {
     $inc: { walletBalance: -totalAmount },
     $push: { walletTransactions: { type: 'DEBIT', amount: totalAmount, description: `Flight ${flight.flightNumber}` } }
   });
   ```
8. **Mark seats as BOOKED** on the flight document:
   ```javascript
   flight.seats.forEach(seat => {
     if (seatNumbers.includes(seat.seatNumber)) {
       seat.seatStatus = 'BOOKED';
       seat.heldUntil  = null;
     }
   });
   await flight.save();
   ```
9. **Create and save the booking**:
   ```javascript
   const booking = await Booking.create({
     bookingReference: generateBookingRef(),
     userId:    req.user.id,
     flightId,
     passengers,
     seatNumbers,
     totalAmount,
     status: 'CONFIRMED'
   });
   ```
10. Return `201` with booking details

**`getUserBookings`** (`GET /api/bookings/user`):
- Find all bookings where `userId === req.user.id`
- Populate flight details: `.populate('flightId', 'flightNumber sourceAirport destinationAirport departureTime arrivalTime')`
- Return array sorted by `createdAt` descending

**`cancelBooking`** (`POST /api/bookings/:id/cancel`):
1. Find the booking by ID, verify it belongs to `req.user.id`
2. Return `400` if already `CANCELLED`
3. Find the flight to get `departureTime`
4. Call `calculateRefund(flight.departureTime, booking.totalAmount)`
5. **Credit refund to wallet** (if refundAmount > 0):
   ```javascript
   await User.findByIdAndUpdate(req.user.id, {
     $inc: { walletBalance: refundAmount },
     $push: { walletTransactions: { type: 'REFUND', amount: refundAmount, description: `Refund for ${booking.bookingReference}` } }
   });
   ```
6. **Release booked seats** back to AVAILABLE:
   ```javascript
   flight.seats.forEach(seat => {
     if (booking.seatNumbers.includes(seat.seatNumber)) {
       seat.seatStatus = 'AVAILABLE';
     }
   });
   await flight.save();
   ```
7. **Update booking status**:
   ```javascript
   booking.status       = 'CANCELLED';
   booking.refundAmount = refundAmount;
   booking.cancelledAt  = new Date();
   await booking.save();
   ```
8. Return `200` with full refund details

**`getBookingById`** (`GET /api/bookings/:id`):
- Find booking by ID, verify ownership
- Populate flight details
- Return full booking document (used by Confirmation page for E-Ticket)

### Step 5: Booking Routes
Create `server/routes/bookingRoutes.js`:
```javascript
const router = require('express').Router();
const { createBooking, getUserBookings, getBookingById, cancelBooking } = require('../controllers/bookingController');
const auth = require('../middleware/auth');

router.post('/',             auth, createBooking);     // POST /api/bookings
router.get('/user',          auth, getUserBookings);   // GET  /api/bookings/user
router.get('/:id',           auth, getBookingById);    // GET  /api/bookings/:id
router.post('/:id/cancel',   auth, cancelBooking);     // POST /api/bookings/:id/cancel

module.exports = router;
```

### Step 6: BookingSummary Page (Checkout)
Create `src/pages/BookingSummary.jsx`:
- Read `{ flightId, selectedSeats, passengers, totalAmount }` from React Router `location.state`
- Display a clear order summary table:
  - Base fare per seat, taxes, seat surcharges (Window +₹150), total
- Show the user's current **Skytrip Wallet Balance** (fetch from `GET /api/auth/me`)
- **Case A — Sufficient balance**: "Pay ₹X via Wallet" button → `POST /api/bookings` → navigate to `/confirmation/:bookingId`
- **Case B — Insufficient balance**: Button shows "Short by ₹X" and is disabled. A "Quick Top-Up" link opens `<WalletModal>` from Member 1 — import and use it directly
- Handle loading and error states

### Step 7: Confirmation Page (E-Ticket / Boarding Pass)
Create `src/pages/Confirmation.jsx`:
- Fetch booking by ID: `GET /api/bookings/:bookingId` on mount
- Render a printable boarding pass card containing:
  - Booking reference: `SKY-261025-A1B2C`
  - Flight number, route (BLR ➔ DEL), departure time, arrival time
  - Gate placeholder, seat numbers
  - Passenger names
  - A decorative barcode (use ASCII or simple CSS bar design)
- "Print Ticket" button → `window.print()`
- "My Bookings" link → `/my-bookings`

Add print styles using a `@media print` block in your component or inline styles:
```css
@media print {
  /* Hide navbar, buttons, and everything except the ticket card */
}
```

### Step 8: MyBookings Page
Create `src/pages/MyBookings.jsx`:
- Fetch bookings: `GET /api/bookings/user` on mount
- Display each booking as a card with:
  - Booking reference, flight route, date, seats, amount paid
  - Status badge: `[CONFIRMED]` (green) or `[CANCELLED]` (red)
  - For CONFIRMED bookings: "Cancel Booking" button
  - For CONFIRMED bookings: "View Ticket" link → `/confirmation/:bookingId`
- "Cancel Booking" click → opens `<RefundModal>`

### Step 9: RefundModal Component
Create `src/components/RefundModal.jsx`:
- Accept props: `booking`, `flight`, `onConfirm`, `onClose`
- On open, compute refund estimate using the same `calculateRefund` logic on the frontend (for display purposes only)
- Display: *"Total Paid: ₹4,000 | Eligible Refund: 50% (₹2,000) | Cancellation Fee: ₹2,000"*
- "Confirm Cancellation" button → calls `POST /api/bookings/:id/cancel` → calls `onConfirm()` to refresh the list
- "Go Back" button → calls `onClose()`

---

## 4. Exact Integrations (What to Add to Shared Files)

### In `server/server.js` — uncomment these 2 lines:
```javascript
const bookingRoutes = require('./routes/bookingRoutes');
app.use('/api/bookings', bookingRoutes);
```

### In `src/App.jsx` — add these imports and routes:
```jsx
// Add imports:
import BookingSummary from './pages/BookingSummary';
import Confirmation   from './pages/Confirmation';
import MyBookings     from './pages/MyBookings';

// Add routes:
<Route path="/booking-summary"           element={<BookingSummary />} />
<Route path="/confirmation/:bookingId"   element={<Confirmation />}   />
<Route path="/my-bookings"              element={<MyBookings />}     />
```

---

## 5. Your API Contracts (Must Match Exactly)

### POST /api/bookings → 201
```json
{
  "success": true,
  "booking": {
    "id": "65d8f5b1b1c4a01234567895",
    "bookingReference": "SKY-261025-A1B2C",
    "status": "CONFIRMED",
    "totalAmount": 7000.00,
    "seats": ["E12A", "E12B"]
  }
}
```

### POST /api/bookings/:id/cancel → 200
```json
{
  "success": true,
  "status": "CANCELLED",
  "hoursUntilDeparture": 52,
  "refundPercentage": 50,
  "refundAmount": 3500.00,
  "newWalletBalance": 8500.00,
  "message": "Booking cancelled. ₹3,500.00 (50%) has been refunded to your wallet."
}
```

### POST /api/bookings → 400 (insufficient balance)
```json
{
  "success": false,
  "message": "Insufficient wallet balance. Short by ₹1,500.00"
}
```

---

## 6. Verification

### Step 1: Start the server
```bash
npm start
```

### Step 2: Compile the frontend
```bash
npm run compile
```

### Step 3: Create and run your test script
Create `server/tests/test_bookings.js` — a Node.js script that:
1. Registers a user and gets a token
2. Creates an admin flight with seats via POST /api/flights
3. Holds 2 seats via POST /api/seats/hold
4. POSTs to `/api/bookings` → asserts `201` and `bookingReference` starts with `SKY-`
5. GETs `/api/bookings/user` → asserts the new booking appears in the array
6. GETs `/api/bookings/:id` → asserts correct booking data
7. POSTs `/api/bookings/:id/cancel` → asserts `200`, `refundPercentage` is one of `[75, 50, 25, 0]`, and `newWalletBalance` is correct
8. GETs `/api/bookings/user` again → asserts booking status is `CANCELLED`

```bash
node server/tests/test_bookings.js
```

### Step 4: Manual browser end-to-end flow
1. Register/login at `/register` or `/login`
2. Search for a flight at `/flights?from=BLR&to=DEL`
3. Click a flight → select 2 seats on the SeatMap
4. Fill passenger form → click "Proceed to Book"
5. `/booking-summary` shows order summary and wallet balance
6. Click "Pay via Wallet" → booking created → redirect to `/confirmation/:bookingId`
7. Boarding pass displays with correct reference number
8. Navigate to `/my-bookings` → booking shows as `[CONFIRMED]`
9. Click "Cancel Booking" → RefundModal shows refund estimate
10. Confirm cancellation → booking shows as `[CANCELLED]` and wallet balance increases

---

## 7. Done Checklist — Verify Before Pushing

- [ ] `refundCalculator.js` correctly returns 75%, 50%, 25%, or 0% based on departure time
- [ ] `POST /api/bookings` atomically deducts wallet, marks seats BOOKED, creates booking record
- [ ] `POST /api/bookings` returns `400` if wallet balance is insufficient (no partial state changes)
- [ ] `GET /api/bookings/user` returns all bookings for the logged-in user
- [ ] `POST /api/bookings/:id/cancel` credits correct refund amount to wallet and releases seats
- [ ] `BookingSummary.jsx` shows correct order breakdown and handles insufficient balance
- [ ] `Confirmation.jsx` renders a printable boarding pass with correct booking data
- [ ] `MyBookings.jsx` shows all bookings with correct status badges
- [ ] `RefundModal.jsx` shows accurate refund estimate before confirming cancellation
- [ ] `node server/tests/test_bookings.js` passes all assertions
- [ ] Full end-to-end browser flow works from search to cancellation
- [ ] No files outside your assigned list were modified (except `server.js` and `App.jsx` integrations)

Once all boxes are checked, **push your code to the repository**.  
The project is now complete. Inform your team lead that all 4 milestones are done.
Update `TASKS_AND_TESTS.md` — change all milestone statuses from `PENDING` to `TESTED & VERIFIED`.
