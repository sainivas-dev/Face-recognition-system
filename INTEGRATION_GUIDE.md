# Backend & Frontend Integration Guide

Complete guide to run backend and frontend separately or together.

## 📦 What You Have

1. **backend-standalone.tar.gz** (23KB)
   - Node.js + Express API
   - Python FastAPI AI service
   - MongoDB integration
   - Complete authentication & attendance system

2. **frontend-standalone.tar.gz** (15KB)
   - React application
   - Glassmorphism UI
   - Webcam integration
   - Full admin panel

## 🚀 Quick Start - Run Both

### Option 1: Run Separately (Recommended for Development)

**Terminal 1 - Backend:**
```bash
# Extract backend
tar -xzf backend-standalone.tar.gz
cd backend-standalone

# Run startup script
./START.sh

# Backend will run on:
# - API: http://localhost:5000
# - AI Service: http://localhost:8000
```

**Terminal 2 - Frontend:**
```bash
# Extract frontend
tar -xzf frontend-standalone.tar.gz
cd frontend-standalone

# Run startup script
./START.sh

# Frontend will open at:
# - http://localhost:3000
```

### Option 2: Manual Setup

**Backend Setup:**
```bash
cd backend-standalone

# Install dependencies
npm install
cd ai-service
pip install -r requirements.txt
cd ..

# Configure
cp .env.example .env
# Edit .env with your settings

# Start MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:6.0

# Start AI service
cd ai-service
python -m uvicorn app.main:app --reload &
cd ..

# Start backend
npm start
```

**Frontend Setup:**
```bash
cd frontend-standalone

# Install dependencies
npm install

# Configure
cp .env.example .env
# Set REACT_APP_API_URL=http://localhost:5000/api

# Start
npm start
```

## 🔗 Integration Points

### 1. API Connection

Frontend connects to backend via `REACT_APP_API_URL`:

**frontend/.env:**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

**backend/.env:**
```env
FRONTEND_URL=http://localhost:3000
```

### 2. CORS Configuration

Backend must allow frontend origin in `backend/src/server.js`:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

### 3. Authentication Flow

```
Frontend (3000) → Backend API (5000) → AI Service (8000) → MongoDB (27017)
```

**Example Flow:**
1. User registers on frontend
2. Frontend sends POST to `/api/auth/register`
3. Backend creates user in MongoDB
4. Backend returns JWT token
5. Frontend stores token
6. For face registration:
   - Frontend captures image
   - Sends to `/api/auth/register-face`
   - Backend forwards to AI service
   - AI service extracts embedding
   - Backend stores embedding in MongoDB

## 📡 API Endpoints Reference

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login with password |
| POST | `/auth/face-login` | Login with face |
| POST | `/auth/register-face` | Register face embedding |
| GET | `/auth/profile` | Get user profile |

### Attendance Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/attendance/mark` | Mark attendance |
| GET | `/attendance/my-attendance` | Get user's attendance |
| GET | `/attendance/today` | Get today's status |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | Get all users |
| GET | `/admin/stats` | Get system stats |
| GET | `/admin/attendance` | Get all attendance |

## 🔧 Configuration Matrix

### Development Setup

| Component | Port | URL | Environment |
|-----------|------|-----|-------------|
| Frontend | 3000 | http://localhost:3000 | Development |
| Backend | 5000 | http://localhost:5000 | Development |
| AI Service | 8000 | http://localhost:8000 | Development |
| MongoDB | 27017 | mongodb://localhost:27017 | Local |

### Production Setup

| Component | Port | URL | Environment |
|-----------|------|-----|-------------|
| Frontend | 80/443 | https://yourdomain.com | Production |
| Backend | 5000 | https://api.yourdomain.com | Production |
| AI Service | 8000 | Internal only | Production |
| MongoDB | 27017 | MongoDB Atlas | Cloud |

## 🌐 Deployment Scenarios

### Scenario 1: Same Server

```
Server (IP: 1.2.3.4)
├── Frontend: Port 3000 → Nginx → Port 80/443
├── Backend: Port 5000 → Internal
├── AI Service: Port 8000 → Internal
└── MongoDB: Port 27017 → Internal
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
    }
}
```

### Scenario 2: Separate Servers

```
Frontend Server (1.2.3.4)
└── React App: Port 80/443

Backend Server (5.6.7.8)
├── API: Port 5000
├── AI Service: Port 8000
└── MongoDB: Port 27017
```

**Frontend .env:**
```env
REACT_APP_API_URL=https://api.backend-domain.com/api
```

**Backend .env:**
```env
FRONTEND_URL=https://frontend-domain.com
```

### Scenario 3: Cloud Deployment

```
AWS/GCP/Azure
├── Frontend: CloudFront/CDN
├── Backend: EC2/Compute Engine
├── AI Service: EC2/Compute Engine
└── MongoDB: Atlas/Cloud MongoDB
```

## 🔐 Security Checklist

### Backend Security
- [ ] Set strong JWT secrets
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Use environment variables
- [ ] Keep dependencies updated
- [ ] Enable MongoDB authentication
- [ ] Use secure WebSocket connections
- [ ] Implement logging
- [ ] Set up monitoring

### Frontend Security
- [ ] Use HTTPS
- [ ] Validate user input
- [ ] Sanitize API responses
- [ ] Implement CSP headers
- [ ] Use secure cookies
- [ ] Enable HSTS
- [ ] Implement XSS protection
- [ ] Add CSRF protection
- [ ] Keep dependencies updated
- [ ] Implement rate limiting on client

## 🧪 Testing Integration

### 1. Test Backend Health

```bash
curl http://localhost:5000/health
# Expected: {"status":"OK","timestamp":"..."}
```

### 2. Test AI Service

```bash
curl http://localhost:8000/health
# Expected: {"status":"healthy","model":"Facenet"}
```

### 3. Test Frontend → Backend

```bash
# From frontend console
fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    name: 'Test User',
    email: 'test@example.com',
    password: 'Test123!'
  })
}).then(r => r.json()).then(console.log)
```

### 4. Test Full Flow

1. Open frontend: http://localhost:3000
2. Register new user
3. Login
4. Register face
5. Logout
6. Login with face

## 🐛 Common Integration Issues

### Issue 1: CORS Error

**Symptom:** 
```
Access to fetch at 'http://localhost:5000/api/auth/login' from origin 
'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
1. Check backend CORS configuration
2. Ensure `FRONTEND_URL` is set correctly in backend/.env
3. Restart backend server

### Issue 2: API Not Found (404)

**Symptom:**
```
POST http://localhost:5000/api/auth/login 404 (Not Found)
```

**Solution:**
1. Verify backend is running
2. Check `REACT_APP_API_URL` in frontend/.env
3. Test endpoint with curl

### Issue 3: AI Service Connection Failed

**Symptom:**
```
Error: connect ECONNREFUSED 127.0.0.1:8000
```

**Solution:**
1. Check AI service is running: `curl http://localhost:8000/health`
2. Verify `AI_SERVICE_URL` in backend/.env
3. Check AI service logs

### Issue 4: MongoDB Connection Failed

**Symptom:**
```
MongoServerError: connect ECONNREFUSED
```

**Solution:**
1. Start MongoDB: `docker run -d -p 27017:27017 mongo:6.0`
2. Check `MONGODB_URI` in backend/.env
3. Test connection: `mongosh mongodb://localhost:27017`

## 📊 Monitoring Integration

### Check All Services

```bash
#!/bin/bash
echo "Checking services..."

# Frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend: Running"
else
    echo "❌ Frontend: Not running"
fi

# Backend
if curl -s http://localhost:5000/health > /dev/null; then
    echo "✅ Backend: Running"
else
    echo "❌ Backend: Not running"
fi

# AI Service
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ AI Service: Running"
else
    echo "❌ AI Service: Not running"
fi

# MongoDB
if mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "✅ MongoDB: Running"
else
    echo "❌ MongoDB: Not running"
fi
```

## 🚀 Production Deployment Guide

### Step 1: Backend Deployment

```bash
# On production server
tar -xzf backend-standalone.tar.gz
cd backend-standalone

# Install dependencies
npm install --production
cd ai-service && pip install -r requirements.txt && cd ..

# Configure production environment
cp .env.example .env
# Edit with production values

# Use PM2 for process management
npm install -g pm2
pm2 start src/server.js --name frs-backend
pm2 start "python -m uvicorn app.main:app --host 0.0.0.0" --name frs-ai --cwd ai-service

# Save PM2 config
pm2 save
pm2 startup
```

### Step 2: Frontend Deployment

```bash
# Build for production
cd frontend-standalone
npm install
REACT_APP_API_URL=https://api.yourdomain.com npm run build

# Deploy build folder
# Option 1: Nginx
cp -r build/* /var/www/html/

# Option 2: Serve with Node
npm install -g serve
serve -s build -l 3000
```

### Step 3: Configure Reverse Proxy

```nginx
# Nginx configuration
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📞 Support

### Backend Issues
- Check logs: `tail -f backend-standalone/logs/backend.log`
- Test API: `curl http://localhost:5000/health`
- MongoDB: `mongosh mongodb://localhost:27017`

### Frontend Issues
- Check browser console (F12)
- Verify API URL in Network tab
- Clear cache and localStorage
- Try incognito mode

### Integration Issues
- Verify all services are running
- Check CORS configuration
- Test with curl/Postman
- Review environment variables

---

**Complete Integration Setup Time: ~10 minutes** ⚡
