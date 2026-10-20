# 🧪 Skytrip — Milestone Verification & Integration Gateways

This document is the **Master Integration Gateway** for all 4 team members and their AI agents.  
It defines the verification gates, test commands, and handoff criteria required before each member can push code and hand off to the next member in sequence.

> [!TIP]
> - **For Agents & Members Implementing Code**: Work directly from your dedicated file: [`MEMBER_1_AGENT.md`](./MEMBER_1_AGENT.md), [`MEMBER_2_AGENT.md`](./MEMBER_2_AGENT.md), [`MEMBER_3_AGENT.md`](./MEMBER_3_AGENT.md), or [`MEMBER_4_AGENT.md`](./MEMBER_4_AGENT.md). Granular implementation task checklists and complete JSON payloads are maintained there.
> - **For System-Wide Specifications & Schemas**: See [`plan.md`](./plan.md).

---

## 🚦 Milestone Verification Gateways

| Milestone | Module | Assignee | Dependencies | Test Command | Gateway Status |
|---|---|---|---|---|---|
| **Milestone 1** | Auth, User & Digital Wallet | Member 1 | Foundation skeleton | `npm run test:auth` | `[ ] PENDING` |
| **Milestone 2** | Flight Catalog, Search & Admin | Member 2 | Milestone 1 (Auth & Admin tokens) | `npm run test:flights` | `[ ] PENDING` |
| **Milestone 3** | Seats, Cabin Dynamics & Passenger Registry | Member 3 | Milestone 2 (Flight schema & IDs) | `npm run test:seats` | `[ ] PENDING` |
| **Milestone 4** | Bookings, Checkout & Tiered Refunds | Member 4 | Milestones 1, 2, 3 (Full stack integration) | `npm run test:bookings` | `[ ] PENDING` |

---

## 👤 Milestone 1: Member 1 — Auth, User & Digital Wallet

### Objective
Establish JWT authentication, secure password hashing, user session management, and the transactional in-app digital wallet.

### Prerequisite Dependencies
- Foundation skeleton (`server.js`, `db.js`, `errorHandler.js`, `App.jsx`, `styles.css`)
- Local MongoDB running on port 27017

### API Endpoint Contract Matrix
*For exact request/response JSON payloads, refer to [`MEMBER_1_AGENT.md`](./MEMBER_1_AGENT.md#5-api-contracts) or [`plan.md`](./plan.md#7-api-endpoint-specifications--exact-json-contracts).*

| Method | Endpoint | Auth Required | Expected Status | Key Parameters / Payload | Description |
|---|---|---|---|---|---|
| `POST` | `/api/auth/register` | Public | `201 Created` | `name`, `email`, `password`, `phone` | Registers user with default ₹5,000 wallet |
| `POST` | `/api/auth/login` | Public | `200 OK` | `email`, `password` | Authenticates and returns JWT token |
| `GET` | `/api/auth/me` | Bearer Token | `200 OK` | Header: `Authorization: Bearer <TOKEN>` | Fetches profile & wallet balance |
| `GET` | `/api/wallet` | Bearer Token | `200 OK` | Header: `Authorization: Bearer <TOKEN>` | Retrieves wallet balance & transaction ledger |
| `POST` | `/api/wallet/topup` | Bearer Token | `200 OK` | `amount` | Atomically adds funds via `$inc` |

### Verification Gate
Execute the automated test suite:
```bash
npm run test:auth
```
- [ ] User registration creates database record with hashed password (`bcryptjs`)
- [ ] Login returns valid signed JWT token
- [ ] `GET /api/auth/me` validates token and returns sanitized user object (no password)
- [ ] `POST /api/wallet/topup` updates balance atomically
- [ ] Unauthenticated requests to protected routes receive `401 Unauthorized`
- [ ] Frontend Login, Register, and Top-up UI elements verified in browser

---

## 👤 Milestone 2: Member 2 — Flight Catalog & Admin Portal

### Objective
Implement flight catalog schemas, flight search with filtering and sorting, seed database with sample domestic routes, and create administrative flight management.

### Prerequisite Dependencies
- Milestone 1 completed and merged (`server/middleware/auth.js` and User model with `ADMIN` role)

### API Endpoint Contract Matrix
*For exact request/response JSON payloads, refer to [`MEMBER_2_AGENT.md`](./MEMBER_2_AGENT.md#5-api-contracts) or [`plan.md`](./plan.md#7-api-endpoint-specifications--exact-json-contracts).*

| Method | Endpoint | Auth Required | Expected Status | Key Parameters / Payload | Description |
|---|---|---|---|---|---|
| `GET` | `/api/flights` | Public | `200 OK` | Query: `from`, `to`, `date`, `sort` | Search flights with filters & sorting |
| `GET` | `/api/flights/:id` | Public | `200 OK` | URL Param: `id` | Single flight details with cabin structure |
| `POST` | `/api/flights` | Admin Only | `201 Created` | Flight details, matrix rows/cols, fare | Creates flight and generates seat layout |
| `DELETE` | `/api/flights/:id` | Admin Only | `200 OK` | URL Param: `id` | Removes unscheduled flight from catalog |

### Verification Gate
Execute the seed script and test suite:
```bash
npm run seed
npm run test:flights
```
- [ ] Seed script successfully populates 5+ realistic domestic routes
- [ ] Flight search filters by source, destination, and sorts by fare accurately
- [ ] Non-admin cannot invoke `POST /api/flights` or `DELETE /api/flights/:id`
- [ ] Frontend Hero Search (`Home.jsx`), Results (`SearchFlights.jsx`), and `AddFlight.jsx` verified

---

## 👤 Milestone 3: Member 3 — Seats & Passenger Registry

### Objective
Render the 2D interactive cabin seat map, enforce a temporary 5-minute atomic seat lock mechanism, and validate multi-passenger registries with Aadhaar/passport rules.

### Prerequisite Dependencies
- Milestone 2 completed and merged (`server/models/Flight.js` with seat generation logic)

### API Endpoint Contract Matrix
*For exact request/response JSON payloads, refer to [`MEMBER_3_AGENT.md`](./MEMBER_3_AGENT.md#5-api-contracts) or [`plan.md`](./plan.md#7-api-endpoint-specifications--exact-json-contracts).*

| Method | Endpoint | Auth Required | Expected Status | Key Parameters / Payload | Description |
|---|---|---|---|---|---|
| `POST` | `/api/seats/hold` | Bearer Token | `200 OK` | `flightId`, `seatNumbers: []` | Places 5-min temporary lock (`HOLD`) |
| `POST` | `/api/seats/release` | Bearer Token | `200 OK` | `flightId`, `seatNumbers: []` | Reverts `HOLD` seats to `AVAILABLE` |

### Verification Gate
Execute the automated seat concurrency and hold test:
```bash
npm run test:seats
```
- [ ] Seats in `AVAILABLE` state can be placed on `HOLD` with `heldUntil` timestamp (+300s)
- [ ] Already held or booked seats cannot be held by another user (returns 409 Conflict)
- [ ] Passenger validation rejects invalid Aadhaar (< 12 digits or non-numeric)
- [ ] Passenger registry rejects duplicate Aadhaar/Passport within the same party
- [ ] Frontend Seat Map (`SeatMap.jsx`) reflects real-time status and selection limits

---

## 👤 Milestone 4: Member 4 — Bookings, Checkout & Tiered Refunds

### Objective
Process final checkout with atomic wallet debit, commit bookings, generate ticket references, and execute tiered refund cancellations based on departure time delta.

### Prerequisite Dependencies
- Milestones 1, 2, and 3 fully completed and verified

### API Endpoint Contract Matrix
*For exact request/response JSON payloads, refer to [`MEMBER_4_AGENT.md`](./MEMBER_4_AGENT.md#5-api-contracts) or [`plan.md`](./plan.md#7-api-endpoint-specifications--exact-json-contracts).*

| Method | Endpoint | Auth Required | Expected Status | Key Parameters / Payload | Description |
|---|---|---|---|---|---|
| `POST` | `/api/bookings` | Bearer Token | `201 Created` | `flightId`, `seatNumbers: []`, `passengers: []` | Atomic debit, commits seats to `BOOKED` |
| `GET` | `/api/bookings/user` | Bearer Token | `200 OK` | Header: `Authorization: Bearer <TOKEN>` | User's active & past booking history |
| `GET` | `/api/bookings/:id` | Bearer Token | `200 OK` | URL Param: `id` | Single booking details for e-ticket |
| `POST` | `/api/bookings/:id/cancel` | Bearer Token | `200 OK` | URL Param: `id` | Tiered refund calculation & wallet credit |

### Tiered Refund Matrix
| Time Until Flight Departure | Refund % | Seat Status Action | Wallet Action |
|---|---|---|---|
| $\ge 96$ hours | **75%** | Reverted to `AVAILABLE` | 75% base fare credited |
| $48$ to $96$ hours | **50%** | Reverted to `AVAILABLE` | 50% base fare credited |
| $24$ to $48$ hours | **25%** | Reverted to `AVAILABLE` | 25% base fare credited |
| $< 24$ hours | **0%** (Non-refundable) | Reverted to `AVAILABLE` | No credit issued |

### Verification Gate
Execute the full booking and tiered refund test:
```bash
npm run test:bookings
```
- [ ] Booking creation atomically checks wallet balance, debits wallet, marks seats `BOOKED`
- [ ] Booking creation fails gracefully if wallet balance is insufficient
- [ ] Cancellation calculates exact percentage based on departure time delta
- [ ] Refund credit is atomically returned to user's wallet
- [ ] End-to-end user flow: Search $\rightarrow$ Select Seats $\rightarrow$ Passenger Details $\rightarrow$ Wallet Checkout $\rightarrow$ E-Ticket $\rightarrow$ Cancellation/Refund verified in browser
