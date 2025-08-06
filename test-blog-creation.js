#!/usr/bin/env node

/**
 * Test blog creation API to identify why blogs aren't being added
 */

async function testBlogCreation() {
  try {
    console.log('🔍 Testing blog creation API...');
    
    const testBlog = {
      title: 'Test Blog Creation Issue',
      content: 'This is a test to see why blogs are not being added to the database.',
      category: 'technical',
      author: 'system',
      draft: false  // Should create a published blog
    };
    
    console.log('📝 Creating blog with data:', {
      ...testBlog,
      content: '[CONTENT REDACTED]'
    });
    
    const response = await fetch('http://localhost:8090/api/v1/blogs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testBlog)
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📊 Response headers:', {
      'content-type': response.headers.get('content-type'),
      'content-length': response.headers.get('content-length')
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Blog creation response:', {
        success: data.success,
        blogId: data.data?._id,
        title: data.data?.title,
        isPublished: data.data?.isPublished,
        message: data.message
      });
      
      if (data.success && data.data?._id) {
        console.log('🔍 Waiting 2 seconds then checking database...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Now check if it's actually in the database
        console.log('📊 Checking database for the created blog...');
        const verifyResponse = await fetch(`http://localhost:8090/api/v1/blogs/${data.data._id}`);
        
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          console.log('✅ Blog verification successful:', {
            found: verifyData.success,
            title: verifyData.data?.title
          });
        } else {
          console.log('❌ Blog verification failed:', verifyResponse.status);
          const errorData = await verifyResponse.json().catch(() => ({}));
          console.log('Error:', errorData);
        }
        
        // Also check the GET all blogs endpoint
        console.log('📄 Checking GET /api/v1/blogs...');
        const listResponse = await fetch('http://localhost:8090/api/v1/blogs');
        const listData = await listResponse.json();
        console.log('📊 Current published blogs count:', listData.data?.length || 0);
        
        if (listData.data?.length > 0) {
          console.log('📄 Recent blogs:');
          listData.data.slice(0, 3).forEach((blog, i) => {
            console.log(`   ${i+1}. "${blog.title}" (${blog._id})`);
          });
        }
      }
    } else {
      console.log('❌ Blog creation failed');
      const errorData = await response.json().catch(() => null);
      if (errorData) {
        console.log('Error response:', errorData);
      } else {
        console.log('Response text:', await response.text());
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🚨 Server not running. Please start the server first.');
    }
  }
}

testBlogCreation();