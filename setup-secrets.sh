#!/bin/bash

# Script to set up GitHub secrets for Firebase deployment
# Requires: gh CLI installed and authenticated

set -e

echo "=========================================="
echo "GitHub Secrets Setup for Firebase Deploy"
echo "=========================================="
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "Error: GitHub CLI (gh) is not installed."
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "Error: Not authenticated with GitHub CLI."
    echo "Run: gh auth login"
    exit 1
fi

echo "Setting up secrets for repository: sawa-khraish-raja/sawa-explorer"
echo ""

# DEV Environment
echo "=== DEV Environment ==="
echo ""

read -p "Path to dev service account JSON file: " DEV_SERVICE_ACCOUNT_PATH
if [ ! -f "$DEV_SERVICE_ACCOUNT_PATH" ]; then
    echo "Error: File not found: $DEV_SERVICE_ACCOUNT_PATH"
    exit 1
fi

read -p "Firebase CI token for DEV: " DEV_TOKEN

echo "Setting FIREBASE_SERVICE_ACCOUNT_DEV..."
gh secret set FIREBASE_SERVICE_ACCOUNT_DEV --body "$(cat "$DEV_SERVICE_ACCOUNT_PATH")" --repo sawa-khraish-raja/sawa-explorer

echo "Setting FIREBASE_TOKEN_DEV..."
gh secret set FIREBASE_TOKEN_DEV --body "$DEV_TOKEN" --repo sawa-khraish-raja/sawa-explorer

echo "✓ DEV secrets set successfully"
echo ""

# PRD Environment
echo "=== PRD Environment ==="
echo ""

read -p "Path to prd service account JSON file: " PRD_SERVICE_ACCOUNT_PATH
if [ ! -f "$PRD_SERVICE_ACCOUNT_PATH" ]; then
    echo "Error: File not found: $PRD_SERVICE_ACCOUNT_PATH"
    exit 1
fi

read -p "Firebase CI token for PRD: " PRD_TOKEN

echo "Setting FIREBASE_SERVICE_ACCOUNT_PRD..."
gh secret set FIREBASE_SERVICE_ACCOUNT_PRD --body "$(cat "$PRD_SERVICE_ACCOUNT_PATH")" --repo sawa-khraish-raja/sawa-explorer

echo "Setting FIREBASE_TOKEN_PRD..."
gh secret set FIREBASE_TOKEN_PRD --body "$PRD_TOKEN" --repo sawa-khraish-raja/sawa-explorer

echo "✓ PRD secrets set successfully"
echo ""

echo "=========================================="
echo "✓ All secrets have been set successfully!"
echo "=========================================="
echo ""
echo "You can now trigger deployments:"
echo "  - Push to 'dev' branch → deploys to dev environment"
echo "  - Push to 'main' branch → deploys to prd environment"
echo ""
echo "View your secrets at:"
echo "https://github.com/sawa-khraish-raja/sawa-explorer/settings/secrets/actions"
