# Firebase Setup Guide

## Quick Setup (Easiest Method)

### Step 1: Get Your Service Account Key

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project** (or create a new one)
3. Click the **⚙️ gear icon** → **Project settings**
4. Go to the **"Service accounts"** tab
5. Click **"Generate new private key"**
6. Click **"Generate key"** to download the JSON file

### Step 2: Save the JSON File

Move the downloaded JSON file to your project:

```bash
# Move it to server/config/ and rename it
mv ~/Downloads/your-project-firebase-adminsdk-xxxxx.json server/config/serviceAccountKey.json
```

### Step 3: Get Your Database URL

**For Firestore (Most Common):**

- Go to **Firestore Database** in Firebase Console
- Your database URL is: `https://YOUR_PROJECT_ID.firebaseio.com`

**For Realtime Database:**

- Go to **Realtime Database** in Firebase Console
- Copy the database URL shown at the top

### Step 4: Create .env File

```bash
cp .env.example .env
```

Edit `.env` and add:

```bash
PORT=5000
FIREBASE_DATABASE_URL=https://YOUR_PROJECT_ID.firebaseio.com
```

That's it! The server will automatically use the `serviceAccountKey.json` file.

---

## Alternative Methods

### Method 2: Using Environment Variable (Production)

Instead of the JSON file, add the entire JSON content to your `.env`:

```bash
PORT=5000
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"}'
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

### Method 3: Using Individual Variables

Extract specific fields from the JSON:

```bash
PORT=5000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkq...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

---

## Testing Your Setup

### 1. Start the server:

```bash
npm run server:dev
```

You should see:

```
✓ Using serviceAccountKey.json file
✓ Firebase Admin initialized successfully
Server is running on port 5000
```

### 2. Test the health endpoint:

```bash
curl http://localhost:5000/health
```

Expected response:

```json
{ "status": "ok", "message": "Server is running" }
```

### 3. Test Firebase connection:

```bash
curl http://localhost:5000/api/users
```

Expected response:

```json
{ "success": true, "count": 0, "data": [] }
```

---

## Troubleshooting

### Error: "Cannot find module 'serviceAccountKey.json'"

- Make sure the file is in `server/config/serviceAccountKey.json`
- Or use the environment variable method instead

### Error: "Invalid credential"

- Check that your service account key is valid
- Make sure the JSON format is correct
- Try downloading a new key from Firebase Console

### Error: "FIREBASE_DATABASE_URL is required"

- Make sure your `.env` file has `FIREBASE_DATABASE_URL=...`
- Check that the URL matches your Firebase project

### Server starts but API returns errors

- Go to Firebase Console → Firestore Database
- Make sure Firestore is enabled for your project
- Check Firebase Console for any permission issues

---

## Security Reminders

- `serviceAccountKey.json` is in `.gitignore` (never commit it!)
- `.env` is in `.gitignore` (never commit it!)
- Use environment variables for production deployments
- ⚠️ Service account keys have admin access - keep them secure!

---

## Visual Guide

```
Firebase Console
├── Project Settings (⚙️)
│   └── Service Accounts Tab
│       └── Generate New Private Key Button
│           └── Downloads: your-project-xxxxx.json
│
└── Move to: server/config/serviceAccountKey.json
```

## Need Help?

1. Firebase Documentation: https://firebase.google.com/docs/admin/setup
2. Check server logs for specific error messages
3. Make sure your Firebase project has Firestore enabled
