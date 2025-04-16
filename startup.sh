#!/bin/bash

# Exit on error
set -e

# Colors for output
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Function to print colored messages
print_status() {
    echo -e "${BLUE}[*] $1${NC}"
}

print_success() {
    echo -e "${GREEN}[+] $1${NC}"
}

print_error() {
    echo -e "${RED}[-] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[!] $1${NC}"
}

# Function to check if a service is running
check_service() {
    if ! systemctl is-active --quiet "$1"; then
        print_error "$1 service is not running"
        exit 1
    fi
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing system dependencies..."
    
    # Update package list
    apt-get update
    
    # Install basic dependencies
    apt-get install -y \
        python3-pip \
        python3-venv \
        npm \
        nodejs \
        git \
        nginx \
        supervisor
    
    print_success "System dependencies installed"
}

# Function to set up Python virtual environment
setup_python_env() {
    print_status "Setting up Python virtual environment..."
    
    # Create and activate virtual environment
    python3 -m venv venv
    source venv/bin/activate
    
    # Install Python dependencies
    pip install --upgrade pip
    pip install -r backend/requirements.txt
    
    print_success "Python environment set up"
}

# Function to set up Node.js environment
setup_node_env() {
    print_status "Setting up Node.js environment..."
    
    # Install Node.js dependencies
    cd frontend
    npm install --legacy-peer-deps
    cd ..
    
    print_success "Node.js environment set up"
}

# Function to configure nginx
configure_nginx() {
    print_status "Configuring nginx..."
    
    # Create nginx config
    cat > /etc/nginx/sites-available/crypto-trading-bot << 'EOL'
server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOL

    # Enable the site
    ln -sf /etc/nginx/sites-available/crypto-trading-bot /etc/nginx/sites-enabled/
    
    # Test the configuration
    nginx -t
    
    # Restart nginx
    systemctl restart nginx
    
    print_success "nginx configured"
}

# Function to configure supervisor
configure_supervisor() {
    print_status "Configuring supervisor..."
    
    # Create supervisor config
    cat > /etc/supervisor/conf.d/crypto-trading-bot.conf << 'EOL'
[program:crypto-trading-bot]
command=python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
autostart=true
autorestart=true
stderr_logfile=/var/log/crypto-trading-bot.err.log
stdout_logfile=/var/log/crypto-trading-bot.out.log
EOL

    # Update supervisor
    supervisorctl reread
    supervisorctl update
    supervisorctl start crypto-trading-bot
    
    print_success "supervisor configured"
}

# Function to start backend and frontend in development mode
start_development() {
    print_status "Starting development environment..."

    # Activate python virtual environment
    source venv/bin/activate

    # Kill existing backend and frontend processes if any
    if [ -f backend.pid ]; then
        kill $(cat backend.pid) || true
        rm backend.pid
    fi
    if [ -f frontend/frontend.pid ]; then
        kill $(cat frontend/frontend.pid) || true
        rm frontend/frontend.pid
    fi

    # Build frontend
    print_status "Building frontend..."
    cd frontend
    npm run build
    cd ..

    # Start backend server on port 5001
    print_status "Starting backend server on port 5001..."
    nohup env PYTHONPATH=backend uvicorn app.main:app --host 0.0.0.0 --port 5001 > logs/backend.log 2>&1 &
    echo $! > backend.pid

    # Start frontend server on port 5173
    print_status "Starting frontend server on port 5173..."
    nohup env PORT=5173 npm --prefix frontend start > logs/frontend.log 2>&1 &
    echo $! > frontend/frontend.pid

    # Wait a moment for servers to start
    sleep 3

    # Verify backend
    if ! curl -s "http://localhost:5001/api/v1/status/backend" > /dev/null 2>&1; then
        print_error "Backend failed to start. Check logs for details."
        exit 1
    fi

    # Verify frontend
    if ! curl -s "http://localhost:5173" > /dev/null 2>&1; then
        print_error "Frontend failed to start. Check logs for details."
        exit 1
    fi

    print_success "Development environment started successfully!"
    print_warning "Frontend available at http://localhost:5173"
    print_warning "Backend API available at http://localhost:5001/api/v1"
}

# Main script
print_status "Starting Crypto Trading Bot setup..."

# Check if running as root for system setup tasks
if [ "$EUID" -ne 0 ]; then 
    print_warning "Not running as root. Skipping system setup tasks."
else
    # Install dependencies
    install_dependencies

    # Set up Python environment
    setup_python_env

    # Set up Node.js environment
    setup_node_env

    # Configure nginx
    configure_nginx

    # Configure supervisor
    configure_supervisor

    # Check services
    print_status "Checking services..."
    check_service nginx
    check_service supervisor
fi

# Check for argument to run development mode
if [ "$1" == "dev" ]; then
    start_development
else
    print_warning "No 'dev' argument provided. Skipping development startup."
    print_warning "Run this script with 'dev' argument to start development environment."
fi

print_success "Crypto Trading Bot setup script completed."
