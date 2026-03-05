# Face Recognition System - Backend

Standalone backend API server with AI service for face recognition authentication and attendance management.

## 🏗️ Architecture

```
backend-standalone/
├── src/
│   ├── config/          # Database configuration
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth, validation, geo-restriction
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── utils/           # Helpers (JWT, logger)
│   └── server.js        # Express server
├── ai-service/          # Python FastAPI face recognition
├── package.json
└── .env.example

```

## 📋 Prerequisites

- **Node.js** 18+ 
- **MongoDB** 6.0+
- **Python** 3.9+ (for AI service)
- **npm** or **yarn**

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Backend dependencies
npm install

# AI Service dependencies
cd ai-service
pip install -r requirements.txt
cd ..
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/face_recognition

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your-generated-secret-here
JWT_REFRESH_SECRET=your-generated-refresh-secret-here

# AI Service
AI_SERVICE_URL=http://localhost:8000

# Geo-Restriction (optional)
GEO_RESTRICTION_ENABLED=false
ALLOWED_COUNTRIES=US
```

### 3. Start MongoDB

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:6.0

# OR install locally
# Ubuntu/Debian:
sudo apt-get install mongodb
sudo systemctl start mongodb

# MacOS:
brew install mongodb-community
brew services start mongodb-community
```

### 4. Start AI Service

```bash
cd ai-service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 5. Start Backend Server

In a new terminal:

```bash
npm run dev
# OR for production:
npm start
```

## 📡 API Endpoints

### Authentication

**Register User**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Register Face**
```http
POST /api/auth/register-face
Authorization: Bearer <token>
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Face Login**
```http
POST /api/auth/face-login
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Get Profile**
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Attendance

**Mark Attendance**
```http
POST /api/attendance/mark
Authorization: Bearer <token>
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "type": "checkIn"  // or "checkOut"
}
```

**Get My Attendance**
```http
GET /api/attendance/my-attendance?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

**Get Today's Status**
```http
GET /api/attendance/today
Authorization: Bearer <token>
```

### Admin (Admin role required)

**Get All Users**
```http
GET /api/admin/users?page=1&limit=10
Authorization: Bearer <admin-token>
```

**Get System Stats**
```http
GET /api/admin/stats
Authorization: Bearer <admin-token>
```

**Get All Attendance**
```http
GET /api/admin/attendance?page=1&limit=20
Authorization: Bearer <admin-token>
```

## 🔒 Security Features

- ✅ **JWT Authentication** - Access & refresh tokens
- ✅ **Password Hashing** - bcrypt with salt
- ✅ **Rate Limiting** - Protect against brute force
- ✅ **Input Validation** - express-validator
- ✅ **Helmet.js** - Security HTTP headers
- ✅ **CORS** - Configurable origins
- ✅ **Geo-Restriction** - IP-based location validation

## 🤖 AI Service

The AI service runs on port 8000 and provides:

- **Face Embedding Extraction** - 128-dimensional vectors using Facenet
- **Face Verification** - Compare faces with confidence scoring
- **Face Comparison** - Match two face images

### AI Service Endpoints

**Extract Embedding**
```http
POST http://localhost:8000/extract-embedding
Content-Type: application/json

{
  "image": "base64_encoded_image",
  "userId": "user_id"
}
```

**Verify Face**
```http
POST http://localhost:8000/verify-face
Content-Type: application/json

{
  "image": "base64_encoded_image"
}
```

**Get Stats**
```http
GET http://localhost:8000/stats
```

## 📊 Database Schema

### User Model
```javascript
{
  email: String (unique, required),
  name: String (required),
  password: String (hashed, required),
  role: String (enum: ['user', 'admin']),
  faceRegistered: Boolean,
  isActive: Boolean,
  lastLogin: Date
}
```

### Embedding Model
```javascript
{
  userId: ObjectId (ref: User, unique),
  embedding: [Number] (128-dim array),
  model: String (default: 'Facenet')
}
```

### Attendance Model
```javascript
{
  userId: ObjectId (ref: User),
  checkIn: Date (required),
  checkOut: Date,
  confidence: Number (0-1),
  ipAddress: String,
  location: {
    city: String,
    state: String,
    country: String
  },
  status: String (enum: ['present', 'absent', 'partial'])
}
```

## 🧪 Testing

```bash
# Test health endpoint
curl http://localhost:5000/health

# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test123!"}'

# Test AI service
curl http://localhost:8000/health
```

## 🔧 Configuration

### Rate Limiting

Edit `src/middleware/rateLimiter.js`:

```javascript
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // requests per window
});
```

### Geo-Restriction

Configure in `.env`:

```env
GEO_RESTRICTION_ENABLED=true
ALLOWED_COUNTRIES=US,CA,GB
ALLOWED_STATES=California,Texas,New York
ALLOWED_CITIES=San Francisco,Los Angeles
```

### Face Recognition Model

Edit `ai-service/app/main.py`:

```python
MODEL_NAME = "Facenet"  # Options: VGG-Face, Facenet, OpenFace, ArcFace
DETECTOR_BACKEND = "opencv"  # Options: opencv, ssd, dlib, mtcnn
VERIFICATION_THRESHOLD = 0.40  # Lower = stricter
```

## 📝 Environment Variables

### Required
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens

### Optional
- `NODE_ENV` - development/production (default: development)
- `PORT` - Server port (default: 5000)
- `FRONTEND_URL` - CORS origin (default: http://localhost:3000)
- `AI_SERVICE_URL` - AI service URL (default: http://localhost:8000)
- `GEO_RESTRICTION_ENABLED` - Enable geo-restriction (default: false)
- `LOG_LEVEL` - Logging level (default: info)

## 🐛 Troubleshooting

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
mongo --eval "db.adminCommand('ping')"

# Restart MongoDB
sudo systemctl restart mongodb
```

### AI Service Not Responding
```bash
# Check if Python service is running
curl http://localhost:8000/health

# Check logs
cd ai-service
python -m uvicorn app.main:app --reload --log-level debug
```

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Face Detection Fails
- Ensure good lighting
- Face should be front-facing
- Camera should be at eye level
- Try adjusting `VERIFICATION_THRESHOLD`

## 📦 Dependencies

### Backend
```json
{
  "express": "^4.18.2",
  "mongoose": "^7.0.0",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.0",
  "helmet": "^7.0.0",
  "cors": "^2.8.5",
  "express-rate-limit": "^6.7.0",
  "express-validator": "^7.0.1",
  "winston": "^3.8.2",
  "axios": "^1.4.0",
  "geoip-lite": "^1.4.7"
}
```

### AI Service
```
fastapi==0.104.1
uvicorn==0.24.0
deepface==0.0.79
opencv-python==4.8.1.78
numpy==1.24.3
pymongo==4.6.0
tensorflow==2.15.0
```

## 🚀 Production Deployment

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start backend
pm2 start src/server.js --name frs-backend

# Start AI service
pm2 start "uvicorn app.main:app --host 0.0.0.0 --port 8000" --name frs-ai --cwd ai-service

# Save PM2 configuration
pm2 save
pm2 startup
```

### Using Docker

```bash
# Build backend
docker build -t frs-backend .

# Build AI service
docker build -t frs-ai-service ./ai-service

# Run with docker-compose (create docker-compose.yml)
docker-compose up -d
```

## 📈 Performance Tips

1. **MongoDB Indexing** - Already configured in models
2. **Connection Pooling** - Mongoose handles automatically
3. **Caching** - Implement Redis for session management
4. **Load Balancing** - Use Nginx for multiple instances
5. **Clustering** - Use PM2 cluster mode

## 🔐 Security Best Practices

1. ✅ Use strong JWT secrets (32+ characters)
2. ✅ Enable HTTPS in production
3. ✅ Implement rate limiting
4. ✅ Validate all inputs
5. ✅ Use environment variables for secrets
6. ✅ Keep dependencies updated
7. ✅ Enable geo-restriction if needed
8. ✅ Monitor logs for suspicious activity

## 📞 API Documentation

Full API documentation available at:
- Swagger UI: http://localhost:5000/api-docs (when implemented)
- Postman Collection: Available in `/docs` folder

## 🤝 Integration with Frontend

The backend is designed to work with any frontend. Key points:

1. **CORS**: Configure `FRONTEND_URL` in `.env`
2. **Authentication**: JWT tokens in `Authorization` header
3. **Image Format**: Base64 encoded images
4. **Response Format**: Consistent JSON structure

```javascript
{
  "success": true/false,
  "message": "Human readable message",
  "data": { ... },
  "error": "Error message if success is false"
}
```

## 📊 Logging

Logs are stored in `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

View logs:
```bash
tail -f logs/combined.log
```

## 🔄 Database Migration

Create admin user:
```javascript
// Connect to MongoDB
use face_recognition

// Create admin
db.users.insertOne({
  email: "admin@example.com",
  name: "Admin",
  password: "$2a$10$...", // bcrypt hash
  role: "admin",
  faceRegistered: false,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## 📄 License

MIT License - See LICENSE file

## 🆘 Support

For issues:
1. Check logs: `logs/combined.log`
2. Verify environment variables
3. Test endpoints with curl/Postman
4. Check MongoDB connection
5. Verify AI service is running

---

**Built with Node.js, Express, MongoDB, and DeepFace** 🚀
