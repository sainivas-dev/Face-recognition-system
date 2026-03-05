# Error Fixes and Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: Missing attendanceController.js
**Error**: `Cannot find module '../controllers/attendanceController'`

**Fix**: The complete attendanceController.js has been created with all required methods:
- markAttendance()
- markCheckout()
- getMyAttendance()
- getMySummary()
- getTodayStatus()
- getAllAttendance()
- getOrganizationReport()
- deleteAttendance()

### Issue 2: Module Dependencies
**Error**: `Cannot find module 'express'` or similar

**Fix**: Run npm install in the backend directory:
```bash
cd backend
npm install
```

Required dependencies:
- express
- mongoose
- bcryptjs
- jsonwebtoken
- helmet
- cors
- dotenv
- express-rate-limit
- express-validator
- winston
- morgan
- axios
- geoip-lite

### Issue 3: MongoDB Connection
**Error**: `MongoServerError: connect ECONNREFUSED`

**Fix**: Ensure MongoDB is running:
```bash
# Check if MongoDB container is running
docker-compose ps

# If not, start it
docker-compose up -d mongodb

# Or install MongoDB locally
# Ubuntu/Debian:
sudo apt-get install mongodb

# MacOS:
brew install mongodb-community
```

Update MONGODB_URI in backend/.env:
```env
MONGODB_URI=mongodb://localhost:27017/face_recognition
# OR for Docker:
MONGODB_URI=mongodb://mongodb:27017/face_recognition
```

### Issue 4: AI Service Connection
**Error**: `ECONNREFUSED 127.0.0.1:8000` or `AI service error`

**Fix**: 
1. Ensure AI service is running:
```bash
docker-compose up -d ai-service
# OR run locally:
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload
```

2. Update AI_SERVICE_URL in backend/.env:
```env
AI_SERVICE_URL=http://localhost:8000
# OR for Docker:
AI_SERVICE_URL=http://ai-service:8000
```

### Issue 5: Port Already in Use
**Error**: `Error: listen EADDRINUSE: address already in use :::5000`

**Fix**: 
```bash
# Find and kill process using the port
lsof -i :5000
kill -9 <PID>

# OR change port in backend/.env:
PORT=5001
```

### Issue 6: JWT Secret Not Set
**Error**: `secretOrPrivateKey must have a value`

**Fix**: Set JWT secrets in backend/.env:
```bash
# Generate strong secrets
openssl rand -base64 32

# Add to .env:
JWT_SECRET=<generated-secret-1>
JWT_REFRESH_SECRET=<generated-secret-2>
```

### Issue 7: Geo-Restriction Blocking Localhost
**Error**: `403 Forbidden - Access is restricted to specific locations`

**Fix**: Disable geo-restriction for development in backend/.env:
```env
GEO_RESTRICTION_ENABLED=false
```

OR allow your location:
```env
GEO_RESTRICTION_ENABLED=true
ALLOWED_COUNTRIES=US
# Add your city if needed
```

### Issue 8: Face Recognition Fails
**Error**: `No face detected in the image`

**Troubleshooting**:
1. Ensure good lighting
2. Face should be front-facing
3. Camera permissions granted
4. Check AI service logs:
```bash
docker-compose logs ai-service
```

5. Try adjusting threshold in ai-service/app/main.py:
```python
VERIFICATION_THRESHOLD = 0.50  # Increase for stricter matching
```

### Issue 9: CORS Errors
**Error**: `Access to fetch blocked by CORS policy`

**Fix**: Update CORS configuration in backend/src/server.js:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

Set FRONTEND_URL in backend/.env:
```env
FRONTEND_URL=http://localhost:3000
```

### Issue 10: Docker Build Fails
**Error**: Various Docker build errors

**Fix**:
```bash
# Clean Docker cache
docker-compose down -v
docker system prune -a

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

### Issue 11: Frontend Build Fails
**Error**: `Module not found: Can't resolve 'react-webcam'`

**Fix**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### Issue 12: SSL Certificate Errors
**Error**: `SSL certificate problem: self signed certificate`

**Fix**: For development, generate self-signed certificates:
```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=US/ST=CA/L=SF/O=Dev/CN=localhost"
```

For production, use Let's Encrypt:
```bash
sudo certbot certonly --standalone -d yourdomain.com
```

## Quick Troubleshooting Commands

### Check All Services Status
```bash
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f ai-service
docker-compose logs -f mongodb
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Clean Restart
```bash
docker-compose down -v
docker-compose up -d --build
```

### Check MongoDB Data
```bash
docker exec -it frs-mongodb mongosh face_recognition
# Then in MongoDB shell:
db.users.find()
db.embeddings.find()
db.attendance.find()
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:5000/health

# Test registration (after services are running)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test123!"}'
```

## Environment Variable Template

Create backend/.env with these settings:

```env
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb://mongodb:27017/face_recognition

# JWT (generate with: openssl rand -base64 32)
JWT_SECRET=your-generated-secret-here
JWT_REFRESH_SECRET=your-generated-refresh-secret-here

# AI Service
AI_SERVICE_URL=http://ai-service:8000

# Geo-Restriction (disable for development)
GEO_RESTRICTION_ENABLED=false
ALLOWED_COUNTRIES=US
ALLOWED_STATES=
ALLOWED_CITIES=

# Logging
LOG_LEVEL=info
```

Create frontend/.env:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Getting Help

If you're still experiencing issues:

1. **Check Documentation**:
   - README.md - Complete system documentation
   - DEPLOYMENT.md - Production deployment guide
   - QUICK_START.md - Development setup

2. **Verify Prerequisites**:
   - Docker & Docker Compose installed
   - Node.js 18+ installed
   - Python 3.9+ installed (for local AI service)
   - MongoDB installed or Docker running

3. **Common Checklist**:
   - [ ] Environment variables set
   - [ ] MongoDB running
   - [ ] Ports not in use (3000, 5000, 8000, 27017)
   - [ ] SSL certificates generated
   - [ ] npm dependencies installed
   - [ ] Python packages installed

4. **Debug Mode**:
   ```bash
   # Run services in foreground to see logs
   docker-compose up
   
   # OR run backend locally with debug
   cd backend
   DEBUG=* npm run dev
   ```

## Contact & Support

For persistent issues:
- Review logs carefully
- Check GitHub Issues
- Ensure all prerequisites are met
- Try clean installation

---

**Last Updated**: March 2026
**Version**: 1.0.0
