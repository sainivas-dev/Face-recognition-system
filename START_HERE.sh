#!/bin/bash

echo "================================================"
echo "  Face Recognition System - Quick Setup"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed!${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed!${NC}"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✅ Docker is installed${NC}"

# Step 1: Configure environment
echo -e "\n${BLUE}Step 1: Configuring environment...${NC}"

if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}⚠️  Please edit backend/.env and set JWT_SECRET values${NC}"
    echo "   Run: openssl rand -base64 32"
    echo "   Then paste the output as JWT_SECRET and JWT_REFRESH_SECRET"
fi

if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    echo -e "${GREEN}✅ Frontend environment configured${NC}"
fi

# Step 2: Generate SSL certificates
echo -e "\n${BLUE}Step 2: Checking SSL certificates...${NC}"

if [ ! -f nginx/ssl/key.pem ]; then
    echo -e "${YELLOW}Generating self-signed SSL certificates...${NC}"
    mkdir -p nginx/ssl
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/key.pem \
        -out nginx/ssl/cert.pem \
        -subj "/C=US/ST=CA/L=SF/O=Dev/CN=localhost" 2>/dev/null
    echo -e "${GREEN}✅ SSL certificates generated${NC}"
else
    echo -e "${GREEN}✅ SSL certificates already exist${NC}"
fi

# Step 3: Check JWT secrets
echo -e "\n${BLUE}Step 3: Checking JWT secrets...${NC}"

if grep -q "your-super-secret-jwt-key" backend/.env; then
    echo -e "${YELLOW}⚠️  WARNING: You're using default JWT secrets!${NC}"
    echo "   For security, please update backend/.env with:"
    echo "   JWT_SECRET=$(openssl rand -base64 32)"
    echo "   JWT_REFRESH_SECRET=$(openssl rand -base64 32)"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 4: Start services
echo -e "\n${BLUE}Step 4: Starting services...${NC}"
echo "This may take a few minutes on first run..."

docker-compose up -d

# Wait for services to start
echo -e "\n${YELLOW}Waiting for services to start...${NC}"
sleep 10

# Step 5: Check status
echo -e "\n${BLUE}Step 5: Checking service status...${NC}"

if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Services are running!${NC}"
    echo ""
    echo "================================================"
    echo "  🎉 Setup Complete!"
    echo "================================================"
    echo ""
    echo "Access your application:"
    echo -e "${GREEN}  Frontend:${NC} https://localhost"
    echo -e "${GREEN}  Backend API:${NC} http://localhost:5000/health"
    echo -e "${GREEN}  AI Service:${NC} http://localhost:8000"
    echo ""
    echo "Default credentials (create your own):"
    echo "  Email: user@example.com"
    echo "  Password: YourSecurePassword123!"
    echo ""
    echo "Useful commands:"
    echo "  View logs:    docker-compose logs -f"
    echo "  Stop system:  docker-compose down"
    echo "  Restart:      docker-compose restart"
    echo ""
    echo "Next steps:"
    echo "  1. Go to https://localhost (accept SSL warning)"
    echo "  2. Click 'Sign Up' to create an account"
    echo "  3. After registration, click 'Register Face'"
    echo "  4. Allow camera access and capture your face"
    echo "  5. Try face login!"
    echo ""
else
    echo -e "${RED}❌ Some services failed to start${NC}"
    echo "Check logs with: docker-compose logs"
fi

# Show running containers
echo "Running containers:"
docker-compose ps
