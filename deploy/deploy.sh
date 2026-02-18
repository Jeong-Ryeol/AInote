#!/bin/bash
set -e

echo "=== AInote Deploy ==="

# Navigate to project directory
cd ~/docker/ainote

# Pull latest changes
git pull origin main

# Build and restart containers
docker compose build
docker compose up -d

# Run database migrations
docker compose exec app npx prisma migrate deploy

echo "=== Deploy Complete ==="
echo "App: http://localhost:3100"
echo "Collab: ws://localhost:3101"
