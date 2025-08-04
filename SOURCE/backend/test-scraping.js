#!/usr/bin/env node

// Test script for the scraping functionality
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testScraping() {
  console.log('🧪 Testing Scraping Functionality\n');

  try {
    // Test URL to scrape (a public Flutter article)
    const testUrls = [
      'https://flutter.dev/docs/get-started/install',
      'https://medium.com/flutter/whats-new-in-flutter-3-16-dba6e1f9b0e7'
    ];

    // Simulate email ID (would come from actual email in real usage)
    const emailId = 'test-email-123';

    console.log('📧 Simulating link selection from email:', emailId);
    console.log('🔗 Selected URLs:', testUrls);

    // Call the processSelectedLinks endpoint
    const response = await axios.post(
      `${API_BASE}/emails/${emailId}/links/select`,
      {
        selectedLinks: testUrls,
        options: {
          format: 'markdown',
          saveLocation: 'local'
        }
      }
    );

    console.log('\n✅ Scraping completed!');
    console.log('📊 Results:', JSON.stringify(response.data, null, 2));

    // List saved articles
    console.log('\n📋 Listing saved articles...');
    const listResponse = await axios.get(`${API_BASE}/emails/saved-articles`);
    console.log('📄 Saved articles:', JSON.stringify(listResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testScraping();