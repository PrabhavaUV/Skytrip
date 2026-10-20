# ✈️ Skytrip - MERN Airline Reservation Platform

Full-Stack Web Application for RVCE MCA Semester III (MCA261IA) Experiential Learning (EL).  
Built using the Model-View-Controller (MVC) pattern with MongoDB, Express.js, React, and Node.js.

---

## 📊 Project Progress Dashboard

- [x] **Milestone 0: Foundation & Environment Setup** (Express server, Webpack/Babel, MongoDB connection)
- [ ] **Milestone 1: Member 1 - Auth, User & Digital Wallet** (User schema, JWT auth, wallet top-up/debit)
- [ ] **Milestone 2: Member 2 - Flight Catalog & Admin Portal** (Flight schema, search query filter, admin add flight)
- [ ] **Milestone 3: Member 3 - Cabin Seats & Passenger Registry** (2D cabin map, seat hold, Aadhaar validation)
- [ ] **Milestone 4: Member 4 - Bookings, Orders & Tiered Refunds** (Atomic checkout, tiered refund cancellation, E-Ticket)

---

## 💻 System Prerequisites

Before running the project on your machine, make sure you have:

1. **Node.js**: Version 18 LTS or 20 LTS installed. ([Download Node.js](https://nodejs.org))
2. **npm**: Comes bundled with Node.js (verify with `node -v` and `npm -v`).
3. **MongoDB Community Server**: Running locally on port 27017. ([Download MongoDB](https://www.mongodb.com/try/download/community))
   - Windows check: Open Command Prompt and type `mongosh` or check `services.msc` to ensure MongoDB is running.
4. **Git**: Installed for version control and branch management.

---

## 🚀 3-Step Quick Start Guide

### Step 1: Install Dependencies
Open your terminal in the `Skytrip` folder and run:
```bash
npm install
```

### Step 2: Compile the React Frontend
Use Webpack and Babel to compile the React JSX into the static bundle:
```bash
npm run compile
```
*(Tip: During active development, use `npm run watch` to recompile automatically on file changes).*

### Step 3: Start the Backend Server
```bash
npm start
```
*(Or use `npm run server` to auto-restart the server on backend code changes via nodemon).*

Open your browser and visit: **`http://localhost:5000`**

---

## 👥 Team Work Breakdown

| Member | Assigned Domain | Backend Files | Frontend Files |
|---|---|---|---|
| **Member 1** | Auth, User & Wallet | `models/User.js`, `controllers/authController.js`, `controllers/walletController.js`, `routes/authRoutes.js`, `routes/walletRoutes.js`, `middleware/auth.js` | `pages/Login.jsx`, `pages/Register.jsx`, `components/WalletModal.jsx`, `context/AuthContext.jsx` |
| **Member 2** | Flight Catalog & Admin | `models/Flight.js`, `controllers/flightController.js`, `routes/flightRoutes.js`, `middleware/admin.js`, `seed/seedFlights.js` | `pages/Home.jsx`, `pages/SearchFlights.jsx`, `components/FlightCard.jsx`, `components/FlightFilter.jsx`, `pages/admin/*` |
| **Member 3** | Seats & Passenger Registry | `models/Flight.js` (Seat subdocument), `controllers/seatController.js`, `routes/seatRoutes.js`, `utils/passengerValidator.js` | `pages/FlightDetails.jsx`, `components/SeatMap.jsx`, `components/PassengerForm.jsx`, `styles/seatmap.css` |
| **Member 4** | Bookings & Tiered Refunds | `models/Booking.js`, `controllers/bookingController.js`, `routes/bookingRoutes.js`, `utils/refundCalculator.js` | `pages/BookingSummary.jsx`, `pages/Confirmation.jsx`, `pages/MyBookings.jsx`, `components/RefundModal.jsx` |

---

## 🧭 How to Proceed Next (For Teammates and AI Agents)

1. **Read Your Agent File First**: Open the file that matches your role — this is your complete build guide:
   - Member 1: `MEMBER_1_AGENT.md`
   - Member 2: `MEMBER_2_AGENT.md`
   - Member 3: `MEMBER_3_AGENT.md`
   - Member 4: `MEMBER_4_AGENT.md`
2. **Follow the Quick Start**: See `QUICKSTART.md` for the 5-step environment setup (install, `.env`, MongoDB, seed, compile).
3. **Check the Contracts**: `TASKS_AND_TESTS.md` has the exact API request/response format for every endpoint.
4. **Stick to Your Files**: Only write code in your assigned files listed above. Do not modify other members' files to avoid git conflicts.
5. **Log Any Errors**: If you encounter a tricky bug or environment error, record the fix in `DEBUG_LOG.md` so your teammates do not repeat the same debugging cycle.
6. **Run Verification**: Once your module is built, run your test command (e.g., `npm run test:auth`). When all tests pass, update your milestone status to `[TESTED & VERIFIED]`.

