# How to Run the Application

This guide explains how to run your full-stack application (React frontend + Express backend).

## 🚀 Quick Start (Run Everything)

### Option 1: Run Frontend + Backend Together (Recommended)

```bash
npm start
```

This will start:

- **Frontend** (Vite dev server) on `http://localhost:5173`
- **Backend** (Express API) on `http://localhost:5000`

Both servers run simultaneously with colored output:

- 🔵 **cyan** = frontend logs
- 🟢 **green** = backend logs

---

## 📦 Individual Commands

### Run Frontend Only

```bash
npm run dev
```

- Opens at `http://localhost:5173`
- Hot reload enabled
- React + Vite development server

### Run Backend Only

```bash
npm run server:dev
```

- Runs on `http://localhost:5000`
- Auto-restarts on file changes (nodemon)
- Express + Firebase backend

---

## 🔧 Production Commands

### Build Frontend

```bash
npm run build
```

- Creates optimized production build in `dist/` folder

### Run Production Mode

```bash
npm run start:prod
```

- Runs preview of production frontend build
- Runs backend in production mode (no auto-restart)

### Run Backend Only (Production)

```bash
npm run server
```

- Runs Express server without nodemon

---

## Verify Everything is Working

### 1. Start the Application

```bash
npm start
```

### 2. Check Frontend

Open browser to: `http://localhost:5173`

### 3. Check Backend Health

```bash
curl http://localhost:5000/health
```

Expected response:

```json
{ "status": "ok", "message": "Server is running" }
```

### 4. Test Firebase Connection

```bash
curl http://localhost:5000/api/users
```

Expected response:

```json
{ "success": true, "count": 0, "data": [] }
```

---

## 🔥 Firebase Configuration

Make sure you've set up Firebase:

### Quick Check

Your `.env` file should contain:

```bash
PORT=5000
FIREBASE_DATABASE_URL=https://sawa-explorer.firebaseio.com
FIREBASE_SERVICE_ACCOUNT='...' # or individual credentials
```

### If Firebase Fails to Initialize

**Symptom**: Backend starts but shows Firebase errors

**Solution**: Check `FIREBASE_SETUP.md` for detailed setup instructions

---

## 📝 Available Scripts Summary

| Command              | Description                                   |
| -------------------- | --------------------------------------------- |
| `npm start`          | Run frontend + backend together (development) |
| `npm run dev`        | Run frontend only (development)               |
| `npm run server:dev` | Run backend only (development)                |
| `npm run build`      | Build frontend for production                 |
| `npm run preview`    | Preview production build                      |
| `npm run server`     | Run backend (production)                      |
| `npm run start:prod` | Run everything (production mode)              |
| `npm run lint`       | Run ESLint                                    |

---

## 🐛 Troubleshooting

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::5173` or `:::5000`

**Solution**:

```bash
# Find and kill process using port 5173 (frontend)
lsof -ti:5173 | xargs kill -9

# Find and kill process using port 5000 (backend)
lsof -ti:5000 | xargs kill -9
```

Or change the port in `.env`:

```bash
PORT=5001  # Change backend port
```

### Cannot Connect to Backend from Frontend

**Symptom**: Frontend can't reach `http://localhost:5000/api/...`

**Solution**:

1. Verify backend is running: `curl http://localhost:5000/health`
2. Check CORS is enabled (already configured in `server/index.js`)
3. Make sure you're using the correct port

### Firebase Connection Issues

**Symptom**: Backend starts but Firebase operations fail

**Solution**:

1. Check your `.env` file has Firebase credentials
2. Verify credentials are correct
3. See `FIREBASE_SETUP.md` for detailed setup
4. Check Firebase Console for project status

### Frontend Shows Blank Page

**Symptom**: `http://localhost:5173` shows blank page

**Solution**:

1. Check browser console for errors (F12)
2. Make sure `npm run dev` is running
3. Try clearing browser cache
4. Check `src/main.jsx` or `src/App.jsx` for errors

---

## 🎯 Next Steps

1. **Frontend**: Edit files in `src/` folder
2. **Backend**: Edit files in `server/` folder
3. **API Routes**: Add new routes in `server/routes/`
4. **Controllers**: Add business logic in `server/controllers/`

---

## 📱 Testing the Full Stack

### Create a User via Backend

```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'
```

### Get All Users

```bash
curl http://localhost:5000/api/users
```

### Use in Frontend

```javascript
// In your React component
fetch('http://localhost:5000/api/users')
  .then((res) => res.json())
  .then((data) => console.log(data));
```

---

## 🔒 Important Notes

- `.env` file is in `.gitignore` - never commit it
- `serviceAccountKey.json` is in `.gitignore` - never commit it
- Backend runs on port 5000, frontend on port 5173
- Both servers need to run for full functionality
- Use `Ctrl+C` to stop the servers

---

**Happy coding! 🎉**
