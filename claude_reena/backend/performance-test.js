const http = require('http');

const testData = {
  text: 'This is a performance test string to ensure response time is under 500ms'
};

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/question',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(JSON.stringify(testData))
  }
};

console.log('Running performance test...\n');

const runTest = () => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        resolve({
          status: res.statusCode,
          responseTime,
          data: JSON.parse(data)
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(JSON.stringify(testData));
    req.end();
  });
};

const runMultipleTests = async (count) => {
  const results = [];
  
  for (let i = 0; i < count; i++) {
    try {
      const result = await runTest();
      results.push(result.responseTime);
      console.log(`Test ${i + 1}: ${result.responseTime}ms`);
    } catch (error) {
      console.error(`Test ${i + 1} failed:`, error.message);
    }
  }
  
  if (results.length > 0) {
    const avgTime = results.reduce((a, b) => a + b, 0) / results.length;
    const maxTime = Math.max(...results);
    const minTime = Math.min(...results);
    
    console.log('\nPerformance Summary:');
    console.log(`Average response time: ${avgTime.toFixed(2)}ms`);
    console.log(`Min response time: ${minTime}ms`);
    console.log(`Max response time: ${maxTime}ms`);
    console.log(`\n✅ Performance requirement: ${maxTime < 500 ? 'PASSED' : 'FAILED'} (max: ${maxTime}ms, requirement: <500ms)`);
  }
};

console.log('Starting server first with: npm run dev\n');
console.log('Then run this test in another terminal.\n');

// Run 10 tests
runMultipleTests(10).catch(console.error);