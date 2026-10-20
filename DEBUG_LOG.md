# 🛠️ Skytrip - Debugging Log & Known Issues

A centralized knowledge base of common bugs, runtime errors, root causes, and verified fixes across the MERN stack.  
Whenever an agent or teammate encounters and resolves a tricky error, document it here immediately so other members don't waste time debugging it.

---

## 📋 Quick Fix Index
- [ERR-001: MongoDB Connection Refused (ECONNREFUSED 127.0.0.1:27017)](#err-001-mongodb-connection-refused)
- [ERR-002: Port 5000 Already in Use (EADDRINUSE)](#err-002-port-5000-already-in-use)
- [ERR-003: Webpack JSX / Babel Loader Syntax Error](#err-003-webpack-jsx--babel-loader-syntax-error)
- [ERR-004: JWT Malformed or Invalid Signature](#err-004-jwt-malformed-or-invalid-signature)
- [ERR-005: CORS Policy Blocks Frontend Requests](#err-005-cors-policy-blocks-frontend-requests)

---

### ERR-001: MongoDB Connection Refused
- **Error Message**: `MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`
- **Module / Member**: Foundation / Member 1
- **Root Cause**: The local MongoDB service is not started on the Windows system.
- **Verified Solution**:
  1. Open PowerShell or Command Prompt as **Administrator**.
  2. Run the command:
     ```cmd
     net start MongoDB
     ```
  3. Alternatively, open Windows Run dialog (`Win + R`), type `services.msc`, locate **MongoDB Server**, right-click and click **Start**.
  4. Verify by running `mongosh` in terminal.

---

### ERR-002: Port 5000 Already in Use
- **Error Message**: `Error: listen EADDRINUSE: address already in use :::5000`
- **Module / Member**: Server / Any Member
- **Root Cause**: A previous Node.js server process was not terminated and is still occupying port 5000.
- **Verified Solution**:
  1. Open Command Prompt.
  2. Find the process occupying port 5000:
     ```cmd
     netstat -ano | findstr :5000
     ```
  3. Kill the process by PID (replace `<PID>` with the number in the rightmost column):
     ```cmd
     taskkill /PID <PID> /F
     ```
  4. Or simply change `PORT=5001` in your local `.env` file.

---

### ERR-003: Webpack JSX / Babel Loader Syntax Error
- **Error Message**: `Module parse failed: Unexpected token (You may need an appropriate loader to handle this file type)`
- **Module / Member**: Frontend / Member 2, 3, 4
- **Root Cause**: A `.jsx` file contains React JSX tags, but Babel preset `@babel/preset-react` was missing or the file extension was `.js` without Webpack rule coverage.
- **Verified Solution**:
  1. Ensure `.babelrc` exists in the project root with:
     ```json
     {
       "presets": ["@babel/preset-env", "@babel/preset-react"]
     }
     ```
  2. Ensure `webpack.config.js` has the rule:
     ```javascript
     test: /\.(js|jsx)$/,
     exclude: /node_modules/,
     use: { loader: 'babel-loader' }
     ```
  3. Run `npm run compile`.

---

### ERR-004: JWT Malformed or Invalid Signature
- **Error Message**: `JsonWebTokenError: jwt malformed` or `JsonWebTokenError: invalid signature`
- **Module / Member**: Member 1 / Member 4
- **Root Cause**: The frontend sent the token without the `Bearer ` prefix, or with extra quotes, or `JWT_SECRET` differs between server restarts.
- **Verified Solution**:
  1. In the frontend fetch request, pass:
     ```javascript
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${token}`
     }
     ```
  2. In `server/middleware/auth.js`, safely extract the token:
     ```javascript
     const token = req.headers.authorization?.startsWith('Bearer ')
       ? req.headers.authorization.split(' ')[1]
       : null;
     ```

---

### ERR-005: CORS Policy Blocks Frontend Requests
- **Error Message**: `Access to fetch at 'http://localhost:5000/api/...' has been blocked by CORS policy`
- **Module / Member**: Server / Frontend
- **Root Cause**: Express server does not have CORS enabled, or request origins are restricted.
- **Verified Solution**:
  1. In `server/server.js`, mount `cors` before any routes:
     ```javascript
     const cors = require('cors');
     app.use(cors());
     ```

---

## 📝 Template for Logging New Errors
When you or your agent solve a new issue, append it here using this exact format:

```markdown
### ERR-XXX: <Short Title>
- **Error Message**: `<Exact error snippet>`
- **Module / Member**: Member X / <Component>
- **Root Cause**: <Brief explanation of why it happened>
- **Verified Solution**:
  1. <Step 1>
  2. <Step 2>
```
