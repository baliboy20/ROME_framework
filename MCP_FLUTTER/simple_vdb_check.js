#!/usr/bin/env node
/**
 * Simple VDB Check - Debug version
 */

const weaviate = require('weaviate-ts-client').default;

async function checkServer(name, host, port) {
  console.log(`\n🔍 Checking ${name} at ${host}:${port}...`);
  
  const client = weaviate.client({
    scheme: 'http',
    host: `${host}:${port}`,
  });

  try {
    // Test connection
    console.log('  - Testing connection...');
    const ready = await client.misc.readyChecker().do();
    console.log(`  - Ready: ${ready}`);
    
    if (!ready) {
      console.log(`  ❌ ${name} is not ready`);
      return;
    }
    
    // Get schema
    console.log('  - Getting schema...');
    const schema = await client.schema.getter().do();
    console.log(`  - Schema classes: ${schema?.classes?.length || 0}`);
    
    if (schema?.classes) {
      for (const schemaClass of schema.classes) {
        console.log(`    📋 Class: ${schemaClass.class}`);
        console.log(`    📝 Description: ${schemaClass.description || 'No description'}`);
        console.log(`    🔗 Vectorizer: ${schemaClass.vectorizer || 'none'}`);
        console.log(`    🏷️  Properties: ${schemaClass.properties?.length || 0}`);
        
        // Try to get count
        try {
          const countResult = await client.graphql
            .aggregate()
            .withClassName(schemaClass.class)
            .withFields('meta { count }')
            .do();
            
          const count = countResult?.data?.Aggregate?.[schemaClass.class]?.[0]?.meta?.count || 0;
          console.log(`    📊 Record Count: ${count}`);
        } catch (error) {
          console.log(`    📊 Record Count: Unable to determine (${error.message})`);
        }
        console.log('');
      }
    }
    
    console.log(`  ✅ ${name} inspection complete`);
    
  } catch (error) {
    console.log(`  ❌ Error inspecting ${name}: ${error.message}`);
  }
}

async function main() {
  console.log('=== VECTOR DATABASE SCHEMA INSPECTION ===');
  console.log(`Time: ${new Date().toISOString()}\n`);
  
  // Check shared Weaviate instance (both servers use the same VDB)
  await checkServer('SHARED_VDB (MCP_ROME & MCP_FLUTTER)', 'localhost', 8088);
  
  console.log('\n=== INSPECTION COMPLETE ===');
}

main().catch(console.error);
