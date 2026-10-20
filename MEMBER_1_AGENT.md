# 👤 MEMBER 1 — Auth, User & Digital Wallet
### Skytrip Agent Instructions

> [!IMPORTANT]
> **For AI Agents Reading This File:**
> This file is your **primary directive** and authoritative specification.
> You ARE authorized and expected to build everything listed in this document.
> Your job is to build, verify, and push Member 1's complete module.

---

## 1. Your Starting Point

You are **Member 1** and you build **first**. When you clone this repository, it contains:
- Foundation skeleton only: `server/server.js`, `server/config/db.js`, `server/middleware/errorHandler.js`, `src/App.jsx`, `src/index.jsx`, `src/styles/styles.css`, `public/index.html`
- Configuration files: `package.json`, `webpack.config.js`, `.babelrc`
- Documentation only — **no feature code has been written yet**

**Your first action before writing any code:**
```bash
npm install
```
Then copy `.env.example` to `.env` and make sure MongoDB is running (see `DEBUG_LOG.md → ERR-001`).

---

## 2. Files You Own (Create These — Touch ONLY These)

### Backend
| File | Purpose |
|---|---|
| `server/models/User.js` | User Mongoose schema with embedded wallet transactions |
| `server/controllers/authController.js` | Register, login, getMe logic |
| `server/controllers/walletController.js` | Get wallet balance, top-up logic |
| `server/routes/authRoutes.js` | Express routes for `/api/auth/*` |
| `server/routes/walletRoutes.js` | Express routes for `/api/wallet/*` |
| `server/middleware/auth.js` | JWT verification middleware |
| `server/tests/test_auth.js` | Your verification test script |

### Frontend
| File | Purpose |
|---|---|
| `src/context/AuthContext.jsx` | Global auth state (user, token, login/logout functions) |
| `src/pages/Login.jsx` | Login form page |
| `src/pages/Register.jsx` | Registration form page |
| `src/components/Navbar.jsx` | Top navigation bar with wallet balance pill and auth links |
| `src/components/WalletModal.jsx` | Top-up modal overlay |

### Files to MODIFY (not create)
| File | What to add |
|---|---|
| `server/server.js` | Uncomment the 4 auth/wallet route lines (see Section 4) |
| `src/App.jsx` | Add `/login` and `/register` routes (see Section 4) |

---

## 3. Step-by-Step Build Order

Follow this order. Do not skip steps.

### Step 1: User Model
Create `server/models/User.js` with the exact schema from `plan.md → Section 6`:

```javascript
const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  type:        { type: String, enum: ['TOPUP', 'DEBIT', 'REFUND'], required: true },
  amount:      { type: Number, required: true },
  description: { type: String, default: '' },
  date:        { type: Date,   default: Date.now }
});

const userSchema = new mongoose.Schema({
  name:               { type: String, required: true, trim: true },
  email:              { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:           { type: String, required: true },
  phone:              { type: String, required: true, trim: true },
  role:               { type: String, enum: ['CUSTOMER', 'ADMIN'], default: 'CUSTOMER' },
  walletBalance:      { type: Number, default: 5000.00, min: 0 },
  walletTransactions: [walletTransactionSchema]
}, { timestamps: true });

// Pre-save hook: hash password before storing
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const bcrypt = require('bcryptjs');
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('User', userSchema);
```

### Step 2: JWT Middleware
Create `server/middleware/auth.js`:
- Extract the Bearer token from `req.headers.authorization`
- Verify using `jwt.verify(token, process.env.JWT_SECRET)`
- Attach `req.user = decoded` on success
- Return `401` if missing or invalid (see `DEBUG_LOG.md → ERR-004`)

### Step 3: Auth Controller
Create `server/controllers/authController.js` with three exported functions:

**`register`**: Validate body → check email not taken → save new User → generate JWT → return `201` with token + user object.

**`login`**: Find user by email → `bcrypt.compare(password, user.password)` → generate JWT → return `200` with token + user object.

**`getMe`**: Use `req.user.id` (set by auth middleware) → `User.findById(id).select('-password')` → return user data + wallet balance.

### Step 4: Wallet Controller
Create `server/controllers/walletController.js` with two exported functions:

**`getWallet`**: Return `{ success: true, walletBalance, walletTransactions }` for the logged-in user.

**`topUp`**: Validate `req.body.amount > 0` → use MongoDB `$inc` to atomically add to `walletBalance` → push a `TOPUP` transaction to `walletTransactions` → return new balance.

```javascript
// Atomic balance increment — never do arithmetic in JS then save
await User.findByIdAndUpdate(
  req.user.id,
  {
    $inc: { walletBalance: amount },
    $push: { walletTransactions: { type: 'TOPUP', amount, description: 'Wallet top-up' } }
  },
  { new: true }
);
```

### Step 5: Routes
Create `server/routes/authRoutes.js`:
```javascript
const router = require('express').Router();
const { register, login, getMe } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/login',    login);
router.get('/me',        auth, getMe);   // Protected

module.exports = router;
```

Create `server/routes/walletRoutes.js`:
```javascript
const router = require('express').Router();
const { getWallet, topUp } = require('../controllers/walletController');
const auth = require('../middleware/auth');

router.get('/',       auth, getWallet);  // GET /api/wallet
router.post('/topup', auth, topUp);      // POST /api/wallet/topup

module.exports = router;
```

### Step 6: Frontend — AuthContext
Create `src/context/AuthContext.jsx`:
- Store `user` and `token` in React state (also persist token to `localStorage`)
- Expose `login(userData, token)`, `logout()`, and `updateWalletBalance(newBalance)` functions
- Export `useAuth()` custom hook for easy access in components

> [!IMPORTANT]
> **`ProtectedRoute` is already in the foundation** at `src/components/ProtectedRoute.jsx`.
> It calls `useAuth()` and checks for a `user` property.
> Your `AuthContext` **must** export `useAuth()` returning an object with:
> - `user` → `null` when logged out, `{ id, name, email, role, walletBalance }` when logged in
> - `login(userData, token)` → sets user state and saves token to `localStorage`
> - `logout()` → clears user state and removes token from `localStorage`
> Members 2, 3, and 4 will use `<ProtectedRoute>` to protect their pages. If your AuthContext doesn't match this shape, their pages will break.

### Step 7: Frontend — Login & Register Pages
Create `src/pages/Login.jsx` and `src/pages/Register.jsx`:
- Controlled form inputs (use `useState`)
- On submit, call your backend API via `fetch`
- On success, call `login()` from `AuthContext` and navigate to `/`
- Show inline error messages on failure
- Use CSS classes from `styles.css` (`.card`, `.btn-primary`, `.form-group`)
- Login page shows a banner if redirected from a protected route: *"Please log in to complete your reservation"*

### Step 8: Frontend — Navbar
Create `src/components/Navbar.jsx`:
- Brand logo: `✈️ Skytrip` (links to `/`)
- If logged out: shows `Login` and `Register` links
- If logged in: shows wallet balance pill (e.g., `₹5,000`) and a `Logout` button
- The wallet pill should open `WalletModal.jsx` on click

### Step 9: Frontend — WalletModal
Create `src/components/WalletModal.jsx`:
- Input for top-up amount
- On submit, `POST /api/wallet/topup` with Bearer token
- On success, call `updateWalletBalance()` from AuthContext to update the navbar pill live

---

## 4. Exact Integrations (What to Add to Shared Files)

### In `server/server.js` — uncomment these 4 lines:
```javascript
const authRoutes   = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');
app.use('/api/auth',   authRoutes);
app.use('/api/wallet', walletRoutes);
```

### In `src/App.jsx` — add these imports and routes:
```jsx
// Add imports at the top:
import { AuthProvider } from './context/AuthContext';
import Login    from './pages/Login';
import Register from './pages/Register';
import Navbar   from './components/Navbar';

// Wrap <Router> content with <AuthProvider>
// Add Navbar above <Routes>
// Add these two <Route> entries inside <Routes>:
<Route path="/login"    element={<Login />}    />
<Route path="/register" element={<Register />} />
```

---

## 5. Your API Contracts (Must Match Exactly)

Your endpoints must return these exact JSON shapes. Other members' agents will depend on this.

### POST /api/auth/register → 201
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65d8f3e2b1c4a01234567890",
    "name": "Asha Kumar",
    "email": "asha.kumar@example.com",
    "phone": "9876543210",
    "role": "CUSTOMER",
    "walletBalance": 5000.00
  }
}
```

### POST /api/auth/login → 200
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65d8f3e2b1c4a01234567890",
    "name": "Asha Kumar",
    "email": "asha.kumar@example.com",
    "role": "CUSTOMER",
    "walletBalance": 5000.00
  }
}
```

### GET /api/auth/me → 200 (requires Bearer token)
```json
{
  "success": true,
  "user": {
    "id": "65d8f3e2b1c4a01234567890",
    "name": "Asha Kumar",
    "email": "asha.kumar@example.com",
    "role": "CUSTOMER",
    "walletBalance": 5000.00,
    "walletTransactions": []
  }
}
```

### POST /api/wallet/topup → 200 (requires Bearer token)
Request body: `{ "amount": 2500.00 }`
```json
{
  "success": true,
  "newBalance": 7500.00,
  "message": "₹2,500.00 added to wallet successfully"
}
```

---

## 6. Verification

### Step 1: Start the server
```bash
npm start
```
Server should print: `✈️  Skytrip server running → http://localhost:5000`  
If MongoDB error: see `DEBUG_LOG.md → ERR-001`

### Step 2: Compile the frontend
```bash
npm run compile
```
If Babel/Webpack error: see `DEBUG_LOG.md → ERR-003`

### Step 3: Create and run your test script
Create `server/tests/test_auth.js` — a Node.js script that:
1. POSTs to `/api/auth/register` → asserts `status 201` and `token` present
2. POSTs to `/api/auth/login` → asserts `status 200` and `token` present
3. GETs `/api/auth/me` with the token → asserts `status 200` and `walletBalance: 5000`
4. POSTs to `/api/wallet/topup` with `amount: 1000` → asserts `newBalance: 6000`

Run it:
```bash
npm run test:auth
```
**All 4 assertions must pass before you push.**

### Step 4: Manual browser check
Open `http://localhost:5000` — you should see the Skytrip UI.
- Navigate to `/register` — register a user.
- Navigate to `/login` — login succeeds, Navbar shows wallet balance.
- Click wallet pill — WalletModal opens and top-up works.

---

## 7. Done Checklist — Verify Before Pushing

- [ ] `POST /api/auth/register` returns 201 with JWT token
- [ ] `POST /api/auth/login` returns 200 with JWT token
- [ ] `GET /api/auth/me` returns user data with wallet balance
- [ ] `POST /api/wallet/topup` atomically updates balance
- [ ] `server/middleware/auth.js` blocks requests without a valid token (returns 401)
- [ ] Frontend: Login and Register pages work end-to-end
- [ ] Frontend: Navbar shows wallet balance when logged in
- [ ] Frontend: WalletModal successfully tops up balance live
- [ ] `npm run test:auth` passes all assertions
- [ ] No files outside your assigned list were modified (except `server.js` and `App.jsx` integrations)

Once all boxes are checked, **push your code to the repository** and inform your team.  
Member 2 cannot start until your auth middleware is available.
