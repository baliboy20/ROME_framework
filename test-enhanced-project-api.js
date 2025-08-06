#!/usr/bin/env node

/**
 * Test the enhanced project API with new fields: localSourceFolder and githubRepo
 */

async function testEnhancedProjectAPI() {
  try {
    console.log('🔍 Testing enhanced project API with new fields...');
    
    // Test 1: Create project with new fields
    const projectData = {
      name: 'Enhanced Project Test',
      description: 'This project tests the new localSourceFolder and githubRepo fields added in PROJECT-ENH-002',
      localSourceFolder: '/Users/dev/projects/enhanced-project',
      githubRepo: 'https://github.com/user/enhanced-project',
      folders: ['/src', '/docs', '/tests'],
      repositories: [{
        name: 'main-repo',
        url: 'https://github.com/user/main-repo',
        type: 'git'
      }],
      coreUrls: [{
        title: 'Project Documentation',
        url: 'https://docs.example.com/project',
        description: 'Main project documentation'
      }],
      stages: [{
        name: 'Planning',
        order: 1,
        description: 'Initial project planning phase'
      }, {
        name: 'Development',
        order: 2,
        description: 'Main development phase'
      }]
    };
    
    console.log('📝 Creating project with enhanced fields...');
    const createResponse = await fetch('http://localhost:8090/api/v1/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData)
    });
    
    console.log('📡 Create response status:', createResponse.status);
    
    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log('✅ Project created successfully');
      console.log('📊 Created project:', {
        id: createData.data._id,
        name: createData.data.name,
        localSourceFolder: createData.data.localSourceFolder,
        githubRepo: createData.data.githubRepo,
        foldersCount: createData.data.folders?.length || 0,
        repositoriesCount: createData.data.repositories?.length || 0,
        coreUrlsCount: createData.data.coreUrls?.length || 0,
        stagesCount: createData.data.stages?.length || 0
      });
      
      const projectId = createData.data._id;
      
      // Test 2: Get the created project
      console.log('\n🔍 Retrieving created project...');
      const getResponse = await fetch(`http://localhost:8090/api/v1/projects/${projectId}`);
      
      if (getResponse.ok) {
        const getData = await getResponse.json();
        console.log('✅ Project retrieved successfully');
        console.log('📄 Retrieved project data:', {
          name: getData.data.name,
          localSourceFolder: getData.data.localSourceFolder,
          githubRepo: getData.data.githubRepo,
          description: getData.data.description.substring(0, 50) + '...'
        });
      } else {
        console.log('❌ Failed to retrieve project');
      }
      
      // Test 3: Update project with new field values
      console.log('\n🔄 Updating project with new field values...');
      const updateData = {
        localSourceFolder: '/Users/dev/projects/updated-enhanced-project',
        githubRepo: 'https://github.com/user/updated-enhanced-project'
      };
      
      const updateResponse = await fetch(`http://localhost:8090/api/v1/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });
      
      if (updateResponse.ok) {
        const updateResponseData = await updateResponse.json();
        console.log('✅ Project updated successfully');
        console.log('📊 Updated fields:', {
          localSourceFolder: updateResponseData.data.localSourceFolder,
          githubRepo: updateResponseData.data.githubRepo
        });
      } else {
        const errorData = await updateResponse.json();
        console.log('❌ Failed to update project:', errorData);
      }
      
      // Test 4: Test validation errors
      console.log('\n🧪 Testing validation with invalid data...');
      const invalidData = {
        name: 'Invalid Project',
        description: 'Test validation',
        localSourceFolder: 'invalid-path-format',
        githubRepo: 'not-a-github-url'
      };
      
      const validationResponse = await fetch('http://localhost:8090/api/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData)
      });
      
      if (validationResponse.status === 400) {
        const validationError = await validationResponse.json();
        console.log('✅ Validation working correctly');
        console.log('📋 Validation errors:', validationError.message);
      } else {
        console.log('❌ Validation not working as expected');
      }
      
      // Test 5: List projects to verify new fields appear
      console.log('\n📄 Listing projects to verify new fields...');
      const listResponse = await fetch('http://localhost:8090/api/v1/projects');
      
      if (listResponse.ok) {
        const listData = await listResponse.json();
        console.log('✅ Projects listed successfully');
        console.log(`📊 Found ${listData.data.length} projects`);
        
        const enhancedProject = listData.data.find(p => p._id === projectId);
        if (enhancedProject) {
          console.log('🎯 Enhanced project found in list:', {
            name: enhancedProject.name,
            hasLocalSourceFolder: !!enhancedProject.localSourceFolder,
            hasGithubRepo: !!enhancedProject.githubRepo
          });
        }
      }
      
    } else {
      console.log('❌ Project creation failed');
      const errorData = await createResponse.json().catch(() => null);
      if (errorData) {
        console.log('Error response:', errorData);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🚨 Server not running. Please start the server first.');
    }
  }
}

testEnhancedProjectAPI();