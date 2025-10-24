# API Testing Guide

## Servers Running

- **Backend (Express)**: http://localhost:3000
- **Frontend (Vite/React)**: http://localhost:5173

## API Endpoints Available

### Authentication

#### Check Session
```bash
curl -X GET http://localhost:3000/api/auth/session \
  -H "Content-Type: application/json" \
  --cookie-jar cookies.txt \
  --cookie cookies.txt
```

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  --cookie-jar cookies.txt \
  --cookie cookies.txt
```

#### Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  --cookie-jar cookies.txt \
  --cookie cookies.txt
```

#### Health Check
```bash
curl -X GET http://localhost:3000/api/health
```

## Testing with React App

1. Open browser to http://localhost:5173
2. You should see the login page
3. Try logging in with: admin / admin123
4. Check browser console for any errors
5. Check Network tab for API calls

## Expected Behavior

- Login page should load without errors
- Login should work and redirect to dashboard
- Navigation should be visible
- Flash messages should appear
- Session should persist on refresh

## Troubleshooting

### CORS Issues
If you see CORS errors, the backend needs CORS middleware:
```bash
npm install cors
```

Then in server.js, add:
```javascript
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### Cookie Issues
Make sure:
- `withCredentials: true` in Axios config
- `credentials: 'include'` in fetch requests
- Backend session cookie settings are correct

### Proxy Issues
Check vite.config.js proxy settings:
- `/api` should proxy to `http://localhost:3000`
- `/auth` should proxy to `http://localhost:3000`
