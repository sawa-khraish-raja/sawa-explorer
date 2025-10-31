# Express + Firebase Backend

This is an Express.js backend server integrated with Firebase Admin SDK for database operations.

## Setup

### 1. Install Dependencies

Dependencies are already installed in the root `package.json`:
- `express` - Web framework
- `firebase-admin` - Firebase Admin SDK
- `cors` - Enable CORS
- `dotenv` - Environment variables
- `nodemon` - Auto-restart server during development

### 2. Configure Firebase

You need to set up Firebase credentials. There are three ways to do this:

#### Option 1: Service Account JSON (Recommended for Development)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Save the JSON file as `serviceAccountKey.json` in `server/config/`
6. Update `server/config/firebase.js` to uncomment the service account section

#### Option 2: Environment Variables (Recommended for Production)

1. Get your service account JSON
2. Copy `.env.example` to `.env`
3. Set `FIREBASE_SERVICE_ACCOUNT` with the entire JSON as a string
4. Set `FIREBASE_DATABASE_URL` to your Firebase database URL

#### Option 3: Default Credentials

For Google Cloud Platform environments, Firebase can use application default credentials automatically.

### 3. Create .env File

```bash
cp .env.example .env
```

Edit `.env` and add your Firebase configuration:

```env
PORT=5000
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
```

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run server:dev
```

### Production Mode
```bash
npm run server
```

The server will start on `http://localhost:5000` (or the PORT you specified in .env)

## API Endpoints

### Health Check
- **GET** `/health` - Check if server is running

### Users API
- **GET** `/api/users` - Get all users
- **GET** `/api/users/:id` - Get user by ID
- **POST** `/api/users` - Create new user
  - Body: `{ "name": "John", "email": "john@example.com", ... }`
- **PUT** `/api/users/:id` - Update user
  - Body: `{ "name": "Jane", ... }`
- **DELETE** `/api/users/:id` - Delete user

## Project Structure

```
server/
├── index.js                 # Main server file
├── config/
│   └── firebase.js         # Firebase configuration
├── controllers/
│   └── userController.js   # User business logic
├── routes/
│   └── userRoutes.js       # User route definitions
└── middleware/
    └── (custom middleware)  # Future middleware
```

## Adding New Routes

1. Create a controller in `server/controllers/`
2. Create routes in `server/routes/`
3. Import and use routes in `server/index.js`

Example:
```javascript
// server/index.js
import productRoutes from './routes/productRoutes.js';
app.use('/api/products', productRoutes);
```

## Testing with cURL

### Get all users
```bash
curl http://localhost:5000/api/users
```

### Create a user
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'
```

### Get user by ID
```bash
curl http://localhost:5000/api/users/USER_ID
```

### Update user
```bash
curl -X PUT http://localhost:5000/api/users/USER_ID \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe"}'
```

### Delete user
```bash
curl -X DELETE http://localhost:5000/api/users/USER_ID
```

## Security Notes

- Never commit `.env` file or `serviceAccountKey.json` to version control
- These files are already in `.gitignore`
- Use environment variables for production deployments
- Implement authentication middleware for protected routes
- Validate and sanitize user inputs before database operations
