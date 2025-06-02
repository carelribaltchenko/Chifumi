#!/bin/bash

# Build frontend
echo "🛠️ Building frontend..."
cd chifoumi_client
npm install
npm run build
cd ..

# Build backend
echo "🛠️ Building backend..."
cd chifoumi-serveur
npm install
npx tsc

# Copy frontend build to server dist/public
echo "📦 Copying frontend build to server dist/public..."
rm -rf dist/public
mkdir -p dist/public
cp -r ../chifoumi_client/dist/* dist/public/
