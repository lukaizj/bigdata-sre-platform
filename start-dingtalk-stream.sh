#!/bin/bash

# DingTalk Stream Service Startup Script
# This script starts the DingTalk stream service for real-time messaging

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
STREAM_DIR="$SCRIPT_DIR/dingtalk-stream"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if dingtalk-stream directory exists
if [ ! -d "$STREAM_DIR" ]; then
    log_error "DingTalk stream directory not found: $STREAM_DIR"
    exit 1
fi

# Check if backend .env file exists
if [ ! -f "$BACKEND_DIR/.env" ]; then
    log_error "Backend .env file not found: $BACKEND_DIR/.env"
    log_info "Please copy .env.example to .env and configure it first"
    exit 1
fi

# Check if ENCRYPTION_KEY is set in .env
if ! grep -q "^ENCRYPTION_KEY=" "$BACKEND_DIR/.env" || grep -q "^ENCRYPTION_KEY=your-32-char" "$BACKEND_DIR/.env"; then
    log_error "ENCRYPTION_KEY not configured in $BACKEND_DIR/.env"
    log_info "Generate a key with: openssl rand -hex 16"
    log_info "Then add it to .env: ENCRYPTION_KEY=<your-key>"
    exit 1
fi

# Change to dingtalk-stream directory
cd "$STREAM_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    npm install
fi

# Export environment variables from backend .env
log_info "Loading environment variables from backend .env"
set -a
source "$BACKEND_DIR/.env"
set +a

# Set additional stream service variables
export BACKEND_URL="http://localhost:${SERVER_PORT:-8080}"
export BACKEND_API_KEY="${JWT_SECRET}"

# Check if DingTalk is configured
if [ -z "$DINGTALK_CLIENT_ID" ] || [ "$DINGTALK_CLIENT_ID" = "your-client-id" ]; then
    log_warn "DingTalk not configured. Please configure DINGTALK_CLIENT_ID and DINGTALK_CLIENT_SECRET"
    log_warn "You can configure them via the backend API: http://localhost:${SERVER_PORT:-8080}"
fi

# Start the service
log_info "Starting DingTalk Stream Service..."
log_info "Backend URL: $BACKEND_URL"
log_info "Log level: ${LOG_LEVEL:-info}"

npm start