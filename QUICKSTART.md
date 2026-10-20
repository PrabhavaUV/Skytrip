# ✈️ Skytrip — Quick Start Guide

Everything you need to go from zero to running in under 5 minutes.

---

## 🖥️ Prerequisites

Make sure you have all of these before starting:

| Tool | Required Version | Check Command |
|---|---|---|
| **Node.js** | v18 LTS or v20 LTS | `node -v` |
| **npm** | Bundled with Node | `npm -v` |
| **Git** | Any | `git --version` |
| **MongoDB Community** | v6.0+ | `mongosh` |

> [!NOTE]
> If MongoDB is not running, see `DEBUG_LOG.md → ERR-001` for the fix.

---

## 🚀 Setup in 5 Steps

### Step 1 — Clone & Install
```bash
git clone <repo-url>
cd Skytrip
npm install
```

### Step 2 — Configure Environment
```bash
# Copy the example file and create your local .env
cp .env.example .env
```
The default values in `.env.example` work for local development as-is.

### Step 3 — Start MongoDB
```cmd
net start MongoDB
```
Or: `Win + R` → `services.msc` → **MongoDB Server** → **Start**  
Verify it's running with: `mongosh`

### Step 4 — Seed the Database
> Run this after **Member 2** has pushed the seed script.
```bash
npm run seed
```

### Step 5 — Build & Start
```bash
npm run compile     # Compile React JSX → public/app.bundle.js
npm start           # Start Express server
```
Open: **`http://localhost:5000`**

---

## 🔄 Development Mode (Auto-Reload)

Use these during active development instead of Steps 4–5 above:

```bash
# Terminal 1: Auto-restart backend on file saves
npm run server

# Terminal 2: Auto-recompile frontend on file saves
npm run watch
```

---

## 🧪 Verification Test Commands

Each member runs their own test after completing their module:

```bash
npm run test:auth       # Member 1 — Auth & Wallet
npm run test:flights    # Member 2 — Flight Catalog
npm run test:seats      # Member 3 — Seats & Passengers
npm run test:bookings   # Member 4 — Bookings & Refunds
```

---

## 👤 Your Role — Start Here

| You Are | Open This File First |
|---|---|
| **Member 1** | [`MEMBER_1_AGENT.md`](./MEMBER_1_AGENT.md) |
| **Member 2** | [`MEMBER_2_AGENT.md`](./MEMBER_2_AGENT.md) |
| **Member 3** | [`MEMBER_3_AGENT.md`](./MEMBER_3_AGENT.md) |
| **Member 4** | [`MEMBER_4_AGENT.md`](./MEMBER_4_AGENT.md) |

---

## 🛠️ Common Errors

| Error | Quick Fix |
|---|---|
| `ECONNREFUSED 127.0.0.1:27017` | MongoDB not running — see `DEBUG_LOG.md → ERR-001` |
| `EADDRINUSE :::5000` | Port conflict — see `DEBUG_LOG.md → ERR-002` |
| Webpack JSX parse error | Missing Babel config — see `DEBUG_LOG.md → ERR-003` |
| `jwt malformed` | Bad token format — see `DEBUG_LOG.md → ERR-004` |
| CORS blocked | Missing cors middleware — see `DEBUG_LOG.md → ERR-005` |

---

## 📁 Key Files at a Glance

```
Skytrip/
├── QUICKSTART.md              ← You are here
├── plan.md                    ← Full architecture & schema reference
├── TASKS_AND_TESTS.md         ← API contracts & verification checklists
├── DEBUG_LOG.md               ← Known errors & fixes
├── MEMBER_X_AGENT.md          ← Your build instructions (read this first!)
├── server/server.js           ← Express entry point
├── src/App.jsx                ← React Router configuration
└── src/styles/styles.css      ← Global design system (dark/gold theme)
```
