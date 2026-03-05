import React, { useState } from 'react';

function BackendPreview() {
  const [activeTab, setActiveTab] = useState('architecture');
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);

  // API Endpoints Data
  const apiEndpoints = {
    auth: [
      {
        method: 'POST',
        path: '/api/auth/register',
        description: 'Register new user with email and password',
        requestBody: {
          name: 'string',
          email: 'string',
          password: 'string'
        },
        response: {
          success: true,
          data: {
            user: { id: 'string', name: 'string', email: 'string', role: 'user' },
            token: 'JWT_TOKEN',
            refreshToken: 'REFRESH_TOKEN'
          }
        },
        middleware: ['validator', 'geoRestriction', 'authLimiter']
      },
      {
        method: 'POST',
        path: '/api/auth/login',
        description: 'Login with email and password',
        requestBody: {
          email: 'string',
          password: 'string'
        },
        response: {
          success: true,
          data: {
            user: { id: 'string', name: 'string', email: 'string', role: 'user' },
            token: 'JWT_TOKEN'
          }
        },
        middleware: ['validator', 'geoRestriction', 'authLimiter']
      },
      {
        method: 'POST',
        path: '/api/auth/register-face',
        description: 'Register face embedding for authenticated user',
        requestBody: {
          image: 'base64_encoded_image'
        },
        response: {
          success: true,
          data: {
            faceRegistered: true,
            model: 'Facenet'
          }
        },
        middleware: ['authenticate', 'validator', 'faceRecognitionLimiter']
      },
      {
        method: 'POST',
        path: '/api/auth/face-login',
        description: 'Login using face recognition',
        requestBody: {
          image: 'base64_encoded_image'
        },
        response: {
          success: true,
          data: {
            user: { id: 'string', name: 'string', email: 'string' },
            token: 'JWT_TOKEN',
            confidence: 0.95
          }
        },
        middleware: ['validator', 'geoRestriction', 'faceRecognitionLimiter']
      }
    ],
    attendance: [
      {
        method: 'POST',
        path: '/api/attendance/mark',
        description: 'Mark attendance with face verification',
        requestBody: {
          image: 'base64_encoded_image',
          type: 'checkIn | checkOut'
        },
        response: {
          success: true,
          data: {
            attendance: { id: 'string', checkIn: 'timestamp', confidence: 0.92 }
          }
        },
        middleware: ['authenticate', 'validator', 'attendanceLimiter']
      },
      {
        method: 'GET',
        path: '/api/attendance/my-attendance',
        description: 'Get user attendance history',
        queryParams: {
          startDate: 'ISO8601_date',
          endDate: 'ISO8601_date',
          page: 'number',
          limit: 'number'
        },
        response: {
          success: true,
          data: {
            attendance: [{ checkIn: 'timestamp', checkOut: 'timestamp', confidence: 0.95 }],
            total: 156
          }
        },
        middleware: ['authenticate']
      }
    ],
    admin: [
      {
        method: 'GET',
        path: '/api/admin/users',
        description: 'Get all users (admin only)',
        queryParams: {
          page: 'number',
          limit: 'number',
          search: 'string'
        },
        response: {
          success: true,
          data: {
            users: [{ id: 'string', name: 'string', email: 'string', role: 'user' }],
            total: 127
          }
        },
        middleware: ['authenticate', 'isAdmin']
      },
      {
        method: 'GET',
        path: '/api/admin/stats',
        description: 'Get system statistics',
        response: {
          success: true,
          data: {
            stats: {
              totalUsers: 127,
              activeUsers: 115,
              registeredFaces: 98,
              todayAttendance: 87
            }
          }
        },
        middleware: ['authenticate', 'isAdmin']
      }
    ]
  };

  // Database Models
  const models = {
    User: {
      name: 'User',
      collection: 'users',
      fields: [
        { name: 'email', type: 'String', required: true, unique: true },
        { name: 'name', type: 'String', required: true },
        { name: 'password', type: 'String', required: true, note: 'Bcrypt hashed' },
        { name: 'role', type: 'String', enum: ['user', 'admin'], default: 'user' },
        { name: 'faceRegistered', type: 'Boolean', default: false },
        { name: 'isActive', type: 'Boolean', default: true },
        { name: 'lastLogin', type: 'Date' },
        { name: 'createdAt', type: 'Date', default: 'Date.now' },
        { name: 'updatedAt', type: 'Date', default: 'Date.now' }
      ],
      indexes: ['email'],
      methods: ['comparePassword', 'toJSON']
    },
    Embedding: {
      name: 'Embedding',
      collection: 'embeddings',
      fields: [
        { name: 'userId', type: 'ObjectId', ref: 'User', required: true, unique: true },
        { name: 'embedding', type: 'Array<Number>', required: true, note: '128-dim vector' },
        { name: 'model', type: 'String', default: 'Facenet' },
        { name: 'createdAt', type: 'Date', default: 'Date.now' },
        { name: 'updatedAt', type: 'Date', default: 'Date.now' }
      ],
      indexes: ['userId']
    },
    Attendance: {
      name: 'Attendance',
      collection: 'attendance',
      fields: [
        { name: 'userId', type: 'ObjectId', ref: 'User', required: true },
        { name: 'checkIn', type: 'Date', required: true },
        { name: 'checkOut', type: 'Date' },
        { name: 'confidence', type: 'Number', min: 0, max: 1 },
        { name: 'ipAddress', type: 'String', required: true },
        { name: 'location', type: 'Object', fields: ['city', 'state', 'country', 'lat', 'lng'] },
        { name: 'status', type: 'String', enum: ['present', 'absent', 'partial'] }
      ],
      indexes: ['userId', 'checkIn'],
      methods: ['getWorkDuration']
    }
  };

  // Middleware
  const middleware = {
    authentication: {
      name: 'Authentication',
      file: 'middleware/auth.js',
      functions: [
        { name: 'authenticate', description: 'Verify JWT token and attach user to request' },
        { name: 'isAdmin', description: 'Check if user has admin role' },
        { name: 'isOwnerOrAdmin', description: 'Verify user owns resource or is admin' }
      ]
    },
    geoRestriction: {
      name: 'Geo-Restriction',
      file: 'middleware/geoRestriction.js',
      functions: [
        { name: 'geoRestriction', description: 'Validate IP location against allowed regions' },
        { name: 'validateLocation', description: 'Check if location matches allowed criteria' },
        { name: 'bypassGeoRestriction', description: 'Skip geo validation for privileged routes' }
      ],
      config: {
        library: 'geoip-lite',
        allowedCountries: ['US'],
        allowedStates: ['California', 'New York', 'Texas'],
        allowedCities: ['San Francisco', 'Los Angeles']
      }
    },
    rateLimiter: {
      name: 'Rate Limiting',
      file: 'middleware/rateLimiter.js',
      limiters: [
        { name: 'apiLimiter', window: '15 minutes', max: 100 },
        { name: 'authLimiter', window: '15 minutes', max: 5 },
        { name: 'faceRecognitionLimiter', window: '1 minute', max: 10 },
        { name: 'attendanceLimiter', window: '1 hour', max: 20 }
      ]
    },
    validator: {
      name: 'Input Validation',
      file: 'middleware/validator.js',
      validators: [
        'validateRegister',
        'validateLogin',
        'validateFaceRegistration',
        'validateFaceLogin',
        'validateAttendance',
        'validateObjectId',
        'validateDateRange'
      ]
    }
  };

  // AI Service Info
  const aiService = {
    name: 'AI Service',
    technology: 'Python FastAPI',
    model: 'DeepFace (Facenet)',
    endpoints: [
      {
        path: '/extract-embedding',
        method: 'POST',
        description: 'Extract 128-dim face embedding from image',
        input: 'base64 image',
        output: 'embedding array'
      },
      {
        path: '/verify-face',
        method: 'POST',
        description: 'Verify face against all stored embeddings',
        input: 'base64 image',
        output: 'userId, confidence, distance'
      },
      {
        path: '/compare-faces',
        method: 'POST',
        description: 'Compare two face images',
        input: 'two base64 images',
        output: 'is_match, confidence, distance'
      }
    ],
    configuration: {
      model: 'Facenet',
      detector: 'opencv',
      distanceMetric: 'cosine',
      threshold: 0.40
    }
  };

  // Architecture View
  const ArchitectureView = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
          <svg className="w-8 h-8 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          System Architecture
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Frontend */}
          <div className="bg-cyan-500/20 border border-cyan-500/50 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white">Frontend</h4>
            </div>
            <div className="space-y-2 text-gray-300 text-sm">
              <p>• React 18</p>
              <p>• Tailwind CSS</p>
              <p>• react-webcam</p>
              <p>• axios</p>
              <p>• react-router-dom</p>
              <p className="pt-2 text-cyan-300 font-semibold">Port: 3000</p>
            </div>
          </div>

          {/* Backend */}
          <div className="bg-purple-500/20 border border-purple-500/50 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white">Backend</h4>
            </div>
            <div className="space-y-2 text-gray-300 text-sm">
              <p>• Node.js + Express</p>
              <p>• MongoDB + Mongoose</p>
              <p>• JWT Auth</p>
              <p>• Helmet.js Security</p>
              <p>• Rate Limiting</p>
              <p className="pt-2 text-purple-300 font-semibold">Port: 5000</p>
            </div>
          </div>

          {/* AI Service */}
          <div className="bg-pink-500/20 border border-pink-500/50 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white">AI Service</h4>
            </div>
            <div className="space-y-2 text-gray-300 text-sm">
              <p>• Python FastAPI</p>
              <p>• DeepFace</p>
              <p>• Facenet Model</p>
              <p>• OpenCV</p>
              <p>• NumPy</p>
              <p className="pt-2 text-pink-300 font-semibold">Port: 8000</p>
            </div>
          </div>
        </div>

        {/* Data Flow */}
        <div className="mt-8 bg-black/30 rounded-xl p-6">
          <h4 className="text-lg font-bold text-white mb-4">Request Flow</h4>
          <div className="flex items-center justify-between text-sm">
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold">UI</span>
              </div>
              <p className="text-gray-400">React App</p>
            </div>
            <div className="flex-1 mx-4 border-t-2 border-dashed border-gray-500"></div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold">⚡</span>
              </div>
              <p className="text-gray-400">Nginx</p>
            </div>
            <div className="flex-1 mx-4 border-t-2 border-dashed border-gray-500"></div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold">API</span>
              </div>
              <p className="text-gray-400">Express</p>
            </div>
            <div className="flex-1 mx-4 border-t-2 border-dashed border-gray-500"></div>
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold">AI</span>
              </div>
              <p className="text-gray-400">Python</p>
            </div>
            <div className="flex-1 mx-4 border-t-2 border-dashed border-gray-500"></div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold">DB</span>
              </div>
              <p className="text-gray-400">MongoDB</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // API Documentation View
  const APIView = () => (
    <div className="space-y-6">
      {Object.entries(apiEndpoints).map(([category, endpoints]) => (
        <div key={category} className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6 capitalize">
            {category} Endpoints
          </h3>
          <div className="space-y-4">
            {endpoints.map((endpoint, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedEndpoint(endpoint)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 cursor-pointer transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-3 py-1 rounded-md text-xs font-bold ${
                        endpoint.method === 'GET' ? 'bg-blue-500 text-white' :
                        endpoint.method === 'POST' ? 'bg-green-500 text-white' :
                        endpoint.method === 'PUT' ? 'bg-yellow-500 text-white' :
                        'bg-red-500 text-white'
                      }`}>
                        {endpoint.method}
                      </span>
                      <code className="text-cyan-400 font-mono text-sm">{endpoint.path}</code>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">{endpoint.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {endpoint.middleware.map((m, i) => (
                        <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Endpoint Detail Modal */}
      {selectedEndpoint && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedEndpoint(null)}>
          <div className="bg-slate-900 border-2 border-purple-500/50 rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`px-3 py-1 rounded-md text-xs font-bold ${
                    selectedEndpoint.method === 'GET' ? 'bg-blue-500' :
                    selectedEndpoint.method === 'POST' ? 'bg-green-500' :
                    'bg-yellow-500'
                  } text-white`}>
                    {selectedEndpoint.method}
                  </span>
                  <code className="text-cyan-400 font-mono text-lg">{selectedEndpoint.path}</code>
                </div>
                <p className="text-gray-300">{selectedEndpoint.description}</p>
              </div>
              <button onClick={() => setSelectedEndpoint(null)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {selectedEndpoint.requestBody && (
                <div>
                  <h4 className="text-white font-semibold mb-3 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Request Body
                  </h4>
                  <pre className="bg-black/50 rounded-lg p-4 text-green-400 text-sm overflow-x-auto">
                    {JSON.stringify(selectedEndpoint.requestBody, null, 2)}
                  </pre>
                </div>
              )}

              {selectedEndpoint.queryParams && (
                <div>
                  <h4 className="text-white font-semibold mb-3 flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Query Parameters
                  </h4>
                  <pre className="bg-black/50 rounded-lg p-4 text-blue-400 text-sm overflow-x-auto">
                    {JSON.stringify(selectedEndpoint.queryParams, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <h4 className="text-white font-semibold mb-3 flex items-center">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full mr-2"></span>
                  Response
                </h4>
                <pre className="bg-black/50 rounded-lg p-4 text-cyan-400 text-sm overflow-x-auto">
                  {JSON.stringify(selectedEndpoint.response, null, 2)}
                </pre>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-3 flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  Middleware Chain
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedEndpoint.middleware.map((m, i) => (
                    <span key={i} className="px-3 py-2 bg-purple-500/20 border border-purple-500/50 text-purple-300 rounded-lg text-sm font-mono">
                      {i + 1}. {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Database Models View
  const ModelsView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {Object.entries(models).map(([key, model]) => (
        <div
          key={key}
          onClick={() => setSelectedModel(model)}
          className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-2 border-indigo-500/30 rounded-2xl p-6 hover:border-indigo-500/60 cursor-pointer transition"
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
              </svg>
            </div>
            <div>
              <h4 className="text-xl font-bold text-white">{model.name}</h4>
              <p className="text-gray-400 text-sm">{model.collection}</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-gray-300 text-sm font-semibold">Fields: {model.fields.length}</p>
            <p className="text-gray-300 text-sm font-semibold">Indexes: {model.indexes.join(', ')}</p>
            {model.methods && (
              <p className="text-gray-300 text-sm">Methods: {model.methods.length}</p>
            )}
          </div>
        </div>
      ))}

      {/* Model Detail Modal */}
      {selectedModel && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedModel(null)}>
          <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">{selectedModel.name} Model</h3>
                <p className="text-gray-400">Collection: <code className="text-cyan-400">{selectedModel.collection}</code></p>
              </div>
              <button onClick={() => setSelectedModel(null)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-white font-bold text-lg mb-4">Schema Fields</h4>
                <div className="space-y-3">
                  {selectedModel.fields.map((field, idx) => (
                    <div key={idx} className="bg-black/30 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <code className="text-cyan-400 font-mono font-bold">{field.name}</code>
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">{field.type}</span>
                            {field.required && (
                              <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs">required</span>
                            )}
                            {field.unique && (
                              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs">unique</span>
                            )}
                          </div>
                          {field.enum && (
                            <p className="text-gray-400 text-sm">Enum: {field.enum.join(' | ')}</p>
                          )}
                          {field.default && (
                            <p className="text-gray-400 text-sm">Default: {field.default}</p>
                          )}
                          {field.note && (
                            <p className="text-gray-400 text-sm italic">Note: {field.note}</p>
                          )}
                          {field.ref && (
                            <p className="text-gray-400 text-sm">Reference: {field.ref}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-white font-bold text-lg mb-4">Indexes</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedModel.indexes.map((index, idx) => (
                    <span key={idx} className="px-3 py-2 bg-green-500/20 border border-green-500/50 text-green-300 rounded-lg font-mono text-sm">
                      {index}
                    </span>
                  ))}
                </div>
              </div>

              {selectedModel.methods && (
                <div>
                  <h4 className="text-white font-bold text-lg mb-4">Instance Methods</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedModel.methods.map((method, idx) => (
                      <span key={idx} className="px-3 py-2 bg-blue-500/20 border border-blue-500/50 text-blue-300 rounded-lg font-mono text-sm">
                        {method}()
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Middleware View
  const MiddlewareView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Object.entries(middleware).map(([key, mw]) => (
        <div key={key} className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-2 border-orange-500/30 rounded-2xl p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="text-xl font-bold text-white">{mw.name}</h4>
              <code className="text-gray-400 text-sm">{mw.file}</code>
            </div>
          </div>

          {mw.functions && (
            <div className="space-y-3 mb-4">
              {mw.functions.map((func, idx) => (
                <div key={idx} className="bg-black/30 rounded-lg p-3">
                  <code className="text-cyan-400 font-mono font-semibold">{func.name}()</code>
                  <p className="text-gray-400 text-sm mt-1">{func.description}</p>
                </div>
              ))}
            </div>
          )}

          {mw.limiters && (
            <div className="space-y-2">
              <p className="text-white font-semibold text-sm mb-2">Rate Limiters:</p>
              {mw.limiters.map((limiter, idx) => (
                <div key={idx} className="bg-black/30 rounded-lg p-3 flex justify-between items-center">
                  <code className="text-cyan-400 text-sm">{limiter.name}</code>
                  <div className="text-right">
                    <p className="text-gray-300 text-xs">{limiter.max} requests</p>
                    <p className="text-gray-400 text-xs">{limiter.window}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {mw.validators && (
            <div>
              <p className="text-white font-semibold text-sm mb-2">Validators:</p>
              <div className="flex flex-wrap gap-2">
                {mw.validators.map((v, idx) => (
                  <span key={idx} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs font-mono">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}

          {mw.config && (
            <div className="mt-4 bg-black/30 rounded-lg p-4">
              <p className="text-white font-semibold text-sm mb-2">Configuration:</p>
              <pre className="text-gray-300 text-xs">
                {JSON.stringify(mw.config, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // AI Service View
  const AIServiceView = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-2 border-pink-500/30 rounded-2xl p-8">
        <h3 className="text-3xl font-bold text-white mb-6 flex items-center">
          <div className="w-12 h-12 bg-pink-500 rounded-lg flex items-center justify-center mr-4">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          {aiService.name}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-black/30 rounded-xl p-6">
            <h4 className="text-white font-bold mb-4">Technology Stack</h4>
            <div className="space-y-2 text-gray-300">
              <p>• Framework: <span className="text-pink-400 font-semibold">{aiService.technology}</span></p>
              <p>• Model: <span className="text-pink-400 font-semibold">{aiService.model}</span></p>
              <p>• Libraries: OpenCV, NumPy, TensorFlow</p>
              <p>• Database: PyMongo (MongoDB)</p>
            </div>
          </div>

          <div className="bg-black/30 rounded-xl p-6">
            <h4 className="text-white font-bold mb-4">Configuration</h4>
            <div className="space-y-2 text-gray-300 text-sm">
              {Object.entries(aiService.configuration).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-gray-400">{key}:</span>
                  <code className="text-cyan-400 font-mono">{value}</code>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold text-xl mb-4">API Endpoints</h4>
          <div className="space-y-4">
            {aiService.endpoints.map((endpoint, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 bg-pink-500 text-white rounded-md text-xs font-bold">
                      {endpoint.method}
                    </span>
                    <code className="text-cyan-400 font-mono">{endpoint.path}</code>
                  </div>
                </div>
                <p className="text-gray-400 mb-3">{endpoint.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 font-semibold mb-1">Input:</p>
                    <code className="text-green-400">{endpoint.input}</code>
                  </div>
                  <div>
                    <p className="text-gray-500 font-semibold mb-1">Output:</p>
                    <code className="text-blue-400">{endpoint.output}</code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/50 rounded-xl p-6">
          <h4 className="text-white font-bold mb-3">Face Recognition Flow</h4>
          <div className="space-y-3 text-gray-300 text-sm">
            <div className="flex items-center">
              <span className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold mr-3">1</span>
              <span>Receive base64 encoded image from backend</span>
            </div>
            <div className="flex items-center">
              <span className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold mr-3">2</span>
              <span>Decode image and detect face using OpenCV</span>
            </div>
            <div className="flex items-center">
              <span className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold mr-3">3</span>
              <span>Extract 128-dimensional face embedding using Facenet</span>
            </div>
            <div className="flex items-center">
              <span className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold mr-3">4</span>
              <span>Compare with stored embeddings using cosine distance</span>
            </div>
            <div className="flex items-center">
              <span className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold mr-3">5</span>
              <span>Return best match with confidence score (threshold: 0.40)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Backend Architecture
          </h1>
          <p className="text-gray-300 text-lg">
            Complete system documentation and API reference
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-2 mb-8">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'architecture', label: 'Architecture', icon: '🏗️' },
              { id: 'api', label: 'API Endpoints', icon: '🔌' },
              { id: 'models', label: 'Database Models', icon: '💾' },
              { id: 'middleware', label: 'Middleware', icon: '⚡' },
              { id: 'ai', label: 'AI Service', icon: '🤖' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'architecture' && <ArchitectureView />}
          {activeTab === 'api' && <APIView />}
          {activeTab === 'models' && <ModelsView />}
          {activeTab === 'middleware' && <MiddlewareView />}
          {activeTab === 'ai' && <AIServiceView />}
        </div>
      </div>
    </div>
  );
}

export default BackendPreview;
