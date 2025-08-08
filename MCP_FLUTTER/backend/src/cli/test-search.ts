#!/usr/bin/env node
/**
 * Test Search Functionality
 * Tests the search capabilities with real Weaviate data
 */

import weaviate from 'weaviate-ts-client';

const client = weaviate.client({
  scheme: 'http',
  host: 'localhost:8088',
  headers: {
    'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY || ''
  }
});

async function testBasicSearch() {
  console.log('\n📝 Testing basic search...');
  
  const result = await client.graphql
    .get()
    .withClassName('FlutterDoc')
    .withFields('title category content complexity')
    .withLimit(3)
    .do();
  
  console.log(`Found ${result.data.Get.FlutterDoc.length} documents`);
  result.data.Get.FlutterDoc.forEach((doc: any) => {
    console.log(`  - ${doc.title} (${doc.category})`);
  });
}

async function testNearTextSearch() {
  console.log('\n🔍 Testing semantic search...');
  
  const queries = [
    'state management',
    'error handling',
    'widget performance',
    'monitoring production'
  ];
  
  for (const query of queries) {
    console.log(`\nSearching for: "${query}"`);
    
    const result = await client.graphql
      .get()
      .withClassName('FlutterDoc')
      .withNearText({ concepts: [query] })
      .withFields('title category _additional { certainty distance }')
      .withLimit(2)
      .do();
    
    if (result.data.Get.FlutterDoc.length > 0) {
      result.data.Get.FlutterDoc.forEach((doc: any) => {
        console.log(`  ✓ ${doc.title} (certainty: ${doc._additional.certainty.toFixed(3)})`);
      });
    } else {
      console.log('  ✗ No results found');
    }
  }
}

async function testFilteredSearch() {
  console.log('\n🎯 Testing filtered search...');
  
  const result = await client.graphql
    .get()
    .withClassName('FlutterDoc')
    .withWhere({
      path: ['category'],
      operator: 'Equal',
      valueText: 'monitoring'
    })
    .withFields('title category complexity')
    .do();
  
  console.log(`Found ${result.data.Get.FlutterDoc.length} monitoring documents`);
  result.data.Get.FlutterDoc.forEach((doc: any) => {
    console.log(`  - ${doc.title} (${doc.complexity})`);
  });
}

async function testAggregation() {
  console.log('\n📊 Testing aggregation...');
  
  const result = await client.graphql
    .aggregate()
    .withClassName('FlutterDoc')
    .withGroupBy(['category'])
    .withFields('groupedBy { value } meta { count }')
    .do();
  
  console.log('Documents by category:');
  result.data.Aggregate.FlutterDoc.forEach((group: any) => {
    console.log(`  - ${group.groupedBy.value}: ${group.meta.count} documents`);
  });
}

async function main() {
  console.log('🚀 Testing Weaviate Search Functionality\n');
  
  try {
    // Test connection
    const meta = await client.misc.metaGetter().do();
    console.log(`✅ Connected to Weaviate v${meta.version}`);
    
    // Run tests
    await testBasicSearch();
    await testNearTextSearch();
    await testFilteredSearch();
    await testAggregation();
    
    console.log('\n✅ All search tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Search test failed:', error);
    process.exit(1);
  }
}

main();