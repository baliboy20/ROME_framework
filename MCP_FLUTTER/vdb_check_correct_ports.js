#!/usr/bin/env node
/**
 * VDB Check - Correct Ports
 * MCP_FLUTTER: Port 8088
 * MCP_ROME: Port 8080
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
      return { name, status: 'not_ready', schemas: [], totalRecords: 0 };
    }
    
    // Get schema
    console.log('  - Getting schema...');
    const schema = await client.schema.getter().do();
    console.log(`  - Schema classes: ${schema?.classes?.length || 0}`);
    
    let totalRecords = 0;
    const schemas = [];
    
    if (schema?.classes) {
      for (const schemaClass of schema.classes) {
        console.log(`    📋 Class: ${schemaClass.class}`);
        console.log(`    📝 Description: ${schemaClass.description || 'No description'}`);
        console.log(`    🔗 Vectorizer: ${schemaClass.vectorizer || 'none'}`);
        console.log(`    🏷️  Properties: ${schemaClass.properties?.length || 0}`);
        
        // List all properties
        if (schemaClass.properties && schemaClass.properties.length > 0) {
          schemaClass.properties.forEach(prop => {
            console.log(`      • ${prop.name} (${prop.dataType?.join('|') || 'unknown'}) - ${prop.description || 'No description'}`);
          });
        }
        
        // Try to get count
        let recordCount = 0;
        try {
          const countResult = await client.graphql
            .aggregate()
            .withClassName(schemaClass.class)
            .withFields('meta { count }')
            .do();
            
          recordCount = countResult?.data?.Aggregate?.[schemaClass.class]?.[0]?.meta?.count || 0;
          console.log(`    📊 Record Count: ${recordCount.toLocaleString()}`);
          totalRecords += recordCount;
        } catch (error) {
          console.log(`    📊 Record Count: Unable to determine (${error.message})`);
        }
        
        schemas.push({
          className: schemaClass.class,
          description: schemaClass.description || 'No description',
          vectorizer: schemaClass.vectorizer || 'none',
          propertyCount: schemaClass.properties?.length || 0,
          recordCount
        });
        
        console.log('');
      }
    }
    
    console.log(`  ✅ ${name} inspection complete`);
    return { name, status: 'ready', schemas, totalRecords };
    
  } catch (error) {
    console.log(`  ❌ Error inspecting ${name}: ${error.message}`);
    return { name, status: 'error', error: error.message, schemas: [], totalRecords: 0 };
  }
}

async function main() {
  console.log('=== VECTOR DATABASE SCHEMA INSPECTION ===');
  console.log(`Time: ${new Date().toISOString()}\n`);
  
  // Check shared Weaviate instance (both servers use port 8088)
  const result = await checkServer('SHARED_VDB (MCP_ROME & MCP_FLUTTER)', 'localhost', 8088);
  const results = [result];
  
  console.log('\n=== SUMMARY ===');
  
  let totalSchemas = 0;
  let totalRecords = 0;
  let healthyServers = 0;
  
  results.forEach(result => {
    console.log(`\n🖥️  ${result.name}`);
    console.log(`   Status: ${result.status === 'ready' ? '✅ READY' : result.status === 'not_ready' ? '⚠️  NOT READY' : '❌ ERROR'}`);
    console.log(`   Schemas: ${result.schemas.length}`);
    console.log(`   Total Records: ${result.totalRecords.toLocaleString()}`);
    
    if (result.status === 'ready') {
      healthyServers++;
      totalSchemas += result.schemas.length;
      totalRecords += result.totalRecords;
      
      result.schemas.forEach(schema => {
        console.log(`     • ${schema.className}: ${schema.recordCount.toLocaleString()} records`);
      });
    }
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log(`\n📊 OVERALL TOTALS:`);
  console.log(`   Healthy Servers: ${healthyServers}/${results.length}`);
  console.log(`   Total Schema Classes: ${totalSchemas}`);
  console.log(`   Total Records: ${totalRecords.toLocaleString()}`);
  
  console.log('\n=== INSPECTION COMPLETE ===');
}

main().catch(console.error);