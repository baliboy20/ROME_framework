# Port Configuration
## Farm Weather App PoC

**Updated**: July 22, 2025  
**Reason**: Avoid conflicts with commonly used ports

## Port Assignments

| Service | Port | Purpose |
|---------|------|---------|
| **Backend API** | 3301 | Express.js API server |
| **Frontend Dev** | 3302 | Frontend development server (if needed) |
| **Production** | 8094 | Production deployment port |

## Configuration Details

### Backend Server (Port 3301)
```javascript
// server.js
const PORT = process.env.PORT || 3301;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
```

### Frontend Configuration
- If serving from backend: Access via http://localhost:3301
- If separate dev server: Use port 3302
- API calls should target: http://localhost:3301/api/weather

### Production Deployment (Port 8094)
- Set `PORT=8094` environment variable
- Access application at: http://farm-server:8094

## CORS Configuration
```javascript
const corsOptions = {
  origin: [
    'http://localhost:3301',
    'http://localhost:3302',
    'http://localhost:8094',
    // Add farm network domains
  ]
};
```

## Important Notes
- These ports were chosen to avoid conflicts with:
  - Port 80 (standard HTTP)
  - Port 3000 (common React default)
  - Port 3001 (common secondary dev port)
- Ensure firewall rules allow these ports
- Update any proxy configurations accordingly