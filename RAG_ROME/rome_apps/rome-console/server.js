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
const VDB_SERVICE_URL = process.env.VDB_SERVICE_URL || 'http://localhost:8081';

// Enable CORS for all origins
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static(__dirname));

// Serve the main console page with dynamic VDB URL injection
app.get('/', (req, res) => {
    const fs = require('fs');
    let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    
    // Replace the API_BASE in the JavaScript with actual VDB service URL
    html = html.replace("const API_BASE = 'http://localhost:8081';", 
                       `const API_BASE = '${VDB_SERVICE_URL}';`);
    
    res.send(html);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        service: 'ROME Management Console',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        rome_service_url: VDB_SERVICE_URL
    });
});

// Proxy API requests to VDB Management Service
app.all('/api/*', async (req, res) => {
    try {
        const targetUrl = `${VDB_SERVICE_URL}${req.path}`;
        console.log(`Proxying ${req.method} ${req.path} to ${targetUrl}`);
        
        const fetch = require('node-fetch');
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                ...req.headers
            },
            body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
        });
        
        const data = await response.text();
        res.status(response.status);
        res.set(response.headers);
        res.send(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reach VDB Management Service',
            error: error.message
        });
    }
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