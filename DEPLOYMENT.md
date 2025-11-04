# Deployment Guide

This document explains the CI/CD setup for the Sawa Explorer application using GitHub Actions and Firebase.

## Environment Overview

We have two environments:

- **dev**: For testing and development
- **prd**: For production deployment

## Workflow

### Dev Workflow
1. Push code to `dev` branch
2. GitHub Actions automatically triggers
3. Runs linter and builds the project
4. Deploys to Firebase dev environment
5. Test your changes in the dev environment

### Prd Workflow
1. Merge code from `dev` to `main` branch
2. GitHub Actions automatically triggers
3. Runs linter, tests, and builds the project
4. Deploys to Firebase prd environment
5. Prd site is updated

## Setup Instructions

### Step 1: Create Firebase Projects

You need to create two Firebase projects:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a project named `sawa-explorer-dev` for development
3. Your existing `sawa-explorer` project will be used for production

### Step 2: Configure Firebase Projects

For each Firebase project (dev and prd):

1. Enable Firebase Hosting
2. Enable Cloud Functions
3. Enable Firestore Database
4. Enable Firebase Authentication
5. Enable Firebase Storage

### Step 3: Get Firebase Service Account Keys

For dev environment:
1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate New Private Key" for `sawa-explorer-dev`
3. Download the JSON file
4. Copy the entire JSON content

For prd environment:
1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate New Private Key" for `sawa-explorer`
3. Download the JSON file
4. Copy the entire JSON content

### Step 4: Get Firebase CI Tokens

Run the following command locally:
```bash
firebase login:ci
```

This will generate a token. You'll need to run this and get tokens for both environments.

### Step 5: Configure GitHub Secrets

Go to your GitHub repository > Settings > Secrets and variables > Actions

Add the following secrets:

#### For dev:
- `FIREBASE_SERVICE_ACCOUNT_DEV`: Paste the entire service account JSON from dev project
- `FIREBASE_TOKEN_DEV`: Paste the Firebase CI token for dev

#### For prd:
- `FIREBASE_SERVICE_ACCOUNT_PRD`: Paste the entire service account JSON from prd project
- `FIREBASE_TOKEN_PRD`: Paste the Firebase CI token for prd

### Step 6: Set Up GitHub Environments (Optional but Recommended)

1. Go to Settings > Environments
2. Create environment named `prd`
3. Add protection rules:
   - Required reviewers (optional)
   - Wait timer (optional)
   - Deployment branches: Only `main`

### Step 7: Configure Environment Variables

Update the following files with your actual values:

#### .env.dev
```env
FIREBASE_PROJECT_ID=sawa-explorer-dev
FIREBASE_DATABASE_URL=https://sawa-explorer-dev.firebaseio.com
VITE_API_URL=https://dev.sawa-explorer.web.app
```

#### .env.prd
```env
FIREBASE_PROJECT_ID=sawa-explorer
FIREBASE_DATABASE_URL=https://sawa-explorer.firebaseio.com
VITE_API_URL=https://sawa-explorer.web.app
```

## Deployment Commands

### Manual Deployment (if needed)

Deploy to DEV:
```bash
npm run build
firebase use dev
firebase deploy --project dev
```

Deploy to PRD:
```bash
npm run build
firebase use prd
firebase deploy --project prd
```

## Branch Strategy

- `dev` - Development branch, auto-deploys to dev environment
- `main` - Production branch, auto-deploys to production environment
- Feature branches - Create from `dev`, merge back to `dev` when done

## Workflow Example

1. Create feature branch from `dev`:
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/my-new-feature
   ```

2. Make changes and commit:
   ```bash
   git add .
   git commit -m "Add new feature"
   git push origin feature/my-new-feature
   ```

3. Create Pull Request to `dev` branch
4. After review, merge to `dev`
5. GitHub Actions deploys to dev environment automatically
6. Test in dev environment
7. When ready, create PR from `dev` to `main`
8. After review, merge to `main`
9. GitHub Actions deploys to production automatically

## Monitoring Deployments

1. Go to your repository > Actions tab
2. See all workflow runs
3. Click on any run to see detailed logs
4. Check Firebase Console for hosting and functions status

## Troubleshooting

### Deployment fails with authentication error
- Check that GitHub secrets are correctly set
- Verify Firebase service account JSON is valid
- Ensure Firebase CLI token hasn't expired

### Build fails
- Check the Actions logs for specific error
- Run `npm run lint` and `npm run build` locally to reproduce
- Fix issues and push again

### Functions deployment fails
- Check Functions logs in Firebase Console
- Verify Node.js version matches (Node 20)
- Check that all environment variables are set

## Security Notes

- Never commit `.env`, `.env.development`, or `.env.production` files
- Keep Firebase service account keys secure
- Rotate Firebase tokens regularly
- Use GitHub Environments for production deployments with approval requirements
- Review all PRs before merging to main

## URLs

After deployment, your apps will be available at:

- dev: `https://sawa-explorer-dev.web.app`
- prd: `https://sawa-explorer.web.app`

## Additional Resources

- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
