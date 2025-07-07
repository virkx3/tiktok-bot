#!/bin/bash

echo "📦 Starting TikTok Share Bot with Docker..."

# Optional: Clean previous builds (uncomment if needed)
# docker rm -f tiktok-bot-container
# docker rmi tiktok-bot-image

# Build Docker image
docker build -t tiktok-bot-image .

# Run Docker container
docker run --name tiktok-bot-container --restart unless-stopped -d tiktok-bot-image

echo "✅ Bot is running inside Docker container named 'tiktok-bot-container'"