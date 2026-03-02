#!/bin/bash

# Configuration
VPS_USER="root" # Change this to your VPS username if different
VPS_IP="<YOUR_VPS_IP>" # Change this to your VPS IP address
VPS_DIR="/opt/videoportfolio" # The directory on the VPS where the app will live

# Check if VPS_IP is updated
if [ "$VPS_IP" = "<YOUR_VPS_IP>" ]; then
    echo "Please update VPS_IP in deploy.sh before running."
    exit 1
fi

echo "Deploying VideoPortfolio to $VPS_USER@$VPS_IP:$VPS_DIR..."

# Ensure the destination directory exists
ssh $VPS_USER@$VPS_IP "mkdir -p $VPS_DIR"

# Sync the code to the VPS using rsync (excludes node_modules and ignore files)
echo "Syncing files..."
rsync -avz --exclude 'node_modules' \
           --exclude '.git' \
           --exclude 'dist' \
           --exclude 'apps/api/dist' \
           --exclude 'apps/web/dist' \
           --exclude 'database.sqlite*'\
           --exclude '.env' \
           ./ $VPS_USER@$VPS_IP:$VPS_DIR/

# Copy the .env file explicitly if it needs to be updated. Uncomment if needed.
# scp .env $VPS_USER@$VPS_IP:$VPS_DIR/.env

echo "Building and restarting Docker containers..."
ssh $VPS_USER@$VPS_IP "cd $VPS_DIR && docker compose -f docker-compose.prod.yml up -d --build"

echo "Deployment complete! Application should be available at https://ta-portflio.colmmoore.com"
