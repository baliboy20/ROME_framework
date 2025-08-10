/**
 * ROME Management Console Server
 * 
 * Simple Express server to serve the management console UI
 * and proxy requests to avoid CORS issues
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8081;

// Enable CORS for all origins
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static(__dirname));

// Serve the main console page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        service: 'ROME Management Console',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        rome_service_url: 'http://localhost:8081'
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🖥️  ROME Management Console running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/`);
    console.log(`🔗 ROME API: http://localhost:${PORT}/api/v1/`);
    console.log('');
    console.log('📋 Quick Start:');
    console.log('  1. ROME VDB Service and Management Console running together');
    console.log(`  2. Open http://localhost:${PORT} in your browser`);
    console.log('  3. Use the console to monitor robots and search documents');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down ROME Management Console...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down ROME Management Console...');
    process.exit(0);
});