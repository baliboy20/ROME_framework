# Integration Specification
## Farm Weather App PoC

### Overview
This document defines the integration points between modules to ensure seamless operation of the Farm Weather App.

### Frontend-Backend Integration

#### API Endpoint Specification

**Endpoint**: `GET /api/weather`
**Host**: `http://localhost:3301`
**Method**: GET
**Headers**: None required for PoC
**Authentication**: None for PoC

**Request Example**:
```javascript
fetch('http://localhost:3301/api/weather')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

**Response Format**:
```json
{
  "weather": "Today's weather: Sunny and 72°F - Perfect for farm work!",
  "timestamp": "2025-07-22T10:30:00Z"
}
```

**Error Response**:
```json
{
  "error": "Unable to fetch weather data",
  "status": 500
}
```

#### CORS Configuration

**Backend CORS Setup**:
```javascript
const corsOptions = {
  origin: [
    'http://localhost:3301',
    'http://localhost:3302', 
    'http://localhost:8094',
    'null' // for file:// protocol during development
  ],
  methods: ['GET'],
  credentials: true
};
```

### Static File Serving

#### Backend Static Configuration

**Location**: Backend serves frontend files
**Path**: Express static middleware
**Structure**:
```javascript
// Serve frontend files
app.use(express.static(path.join(__dirname, '../../frontend')));

// Catch-all route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});
```

### Directory Structure Integration

```
PROJECT/SOURCE/
├── backend/
│   ├── server.js         # Main server file
│   ├── routes/
│   │   └── weather.js    # Weather endpoint
│   ├── middleware/
│   │   └── cors.js       # CORS configuration
│   └── package.json
├── frontend/
│   ├── index.html        # Main HTML
│   ├── styles.css        # Styling
│   ├── script.js         # Frontend logic
│   └── assets/
│       └── weather-icon.svg
└── tests/
    ├── backend/
    │   └── weather.test.js
    └── frontend/
        └── test-cases.md
```

### Integration Testing Points

#### 1. Backend Standalone Test
```bash
# Start backend
cd PROJECT/SOURCE/backend
npm start
# Test endpoint
curl http://localhost:3301/api/weather
```

#### 2. Frontend Standalone Test
- Open index.html in browser
- Check button renders
- Verify styling applied

#### 3. Full Integration Test
- Start backend server
- Access http://localhost:3301
- Click weather button
- Verify response displays

### Error Handling Integration

#### Frontend Error Handling
```javascript
// Network error
.catch(error => {
  displayError("Unable to connect to weather service");
});

// Invalid response
if (!response.ok) {
  throw new Error('Weather service unavailable');
}
```

#### Backend Error Handling
```javascript
// Global error handler
app.use((err, req, res, next) => {
  res.status(500).json({
    error: "Internal server error",
    status: 500
  });
});
```

### Development Workflow

1. **DevOps Setup**
   - Creates directory structure
   - Initializes package.json files
   - Sets up git repository

2. **Parallel Development**
   - Backend: Implements server and API
   - Frontend: Creates UI components

3. **Integration Phase**
   - Backend serves frontend files
   - Frontend connects to API
   - Test full flow

4. **Verification**
   - Click button → API call → Response display
   - Error scenarios handled
   - Performance < 2 seconds

### Common Integration Issues

| Issue | Solution | Owner |
|-------|----------|-------|
| CORS errors | Verify corsOptions includes all origins | Backend |
| 404 on API call | Check backend is running on 3301 | Backend |
| Static files not served | Verify express.static path | DevOps |
| Button not working | Check fetch URL matches backend | Frontend |
| No response display | Verify response parsing | Frontend |

### Success Criteria

- [ ] Frontend loads from backend server
- [ ] Button click triggers API call
- [ ] Weather data displays correctly
- [ ] Errors handled gracefully
- [ ] Response time < 2 seconds

---

*This specification ensures all robots understand integration requirements*