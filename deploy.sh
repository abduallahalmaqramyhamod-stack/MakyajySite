#!/bin/bash
# 1-Click Deployment Script for Ubuntu Hetzner VPS
# Makeupi Store - متجر مكياجي – منبع الجمال

set -e

echo "🌸 Starting deployment of Makeupi Store..."

# 1. Pull latest code (if git used)
# git pull origin main

# 2. Build Frontend
echo "📦 Building React client..."
cd client
npm install
npm run build
cd ..

# 3. Setup Backend
echo "⚙️ Setting up backend..."
cd server
npm install --omit=dev
cd ..

# 4. Restart via PM2 or Docker
if command -v pm2 &> /dev/null; then
    echo "🔄 Reloading application with PM2..."
    pm2 startOrReload ecosystem.config.js
else
    echo "🐳 Starting with Docker Compose..."
    docker-compose up -d --build
fi

echo "✨ Deployment finished successfully!"
echo "📍 Access your store at: http://localhost:5000"
