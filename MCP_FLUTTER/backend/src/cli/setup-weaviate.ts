#!/usr/bin/env node
/**
 * Weaviate Setup Script
 * Sets up the schema and ingests Flutter documentation
 */

import weaviate from 'weaviate-ts-client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Weaviate client setup
const client = weaviate.client({
  scheme: 'http',
  host: 'localhost:8088',
  headers: {
    'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY || ''
  }
});

// Flutter documentation schema
const flutterDocSchema = {
  class: 'FlutterDoc',
  description: 'Flutter documentation and code examples',
  vectorizer: 'text2vec-openai',
  moduleConfig: {
    'text2vec-openai': {
      model: 'ada',
      type: 'text'
    }
  },
  properties: [
    {
      name: 'title',
      dataType: ['text'],
      description: 'Document title'
    },
    {
      name: 'content',
      dataType: ['text'],
      description: 'Document content',
      moduleConfig: {
        'text2vec-openai': {
          skip: false,
          vectorizePropertyName: false
        }
      }
    },
    {
      name: 'category',
      dataType: ['text'],
      description: 'Document category (widgets, state-management, etc)'
    },
    {
      name: 'language',
      dataType: ['text'],
      description: 'Programming language (dart, yaml, etc)'
    },
    {
      name: 'codeType',
      dataType: ['text'],
      description: 'Type of code (snippet, template, pattern, example)'
    },
    {
      name: 'complexity',
      dataType: ['text'],
      description: 'Complexity level (beginner, intermediate, advanced)'
    },
    {
      name: 'frameworks',
      dataType: ['text[]'],
      description: 'Related frameworks (flutter, provider, bloc, etc)'
    },
    {
      name: 'tags',
      dataType: ['text[]'],
      description: 'Document tags'
    },
    {
      name: 'path',
      dataType: ['text'],
      description: 'Source file path'
    },
    {
      name: 'lastModified',
      dataType: ['date'],
      description: 'Last modification date'
    },
    {
      name: 'views',
      dataType: ['int'],
      description: 'View count for popularity ranking'
    }
  ]
};

async function setupSchema() {
  console.log('🔧 Setting up Weaviate schema...');
  
  try {
    // Check if schema already exists
    const existingSchema = await client.schema.getter().do();
    const existingClass = existingSchema.classes?.find(c => c.class === 'FlutterDoc');
    
    if (existingClass) {
      console.log('⚠️  Schema already exists, deleting...');
      await client.schema.classDeleter().withClassName('FlutterDoc').do();
    }
    
    // Create new schema
    await client.schema.classCreator().withClass(flutterDocSchema).do();
    console.log('✅ Schema created successfully');
    
  } catch (error) {
    console.error('❌ Failed to setup schema:', error);
    throw error;
  }
}

async function loadDocuments() {
  console.log('📚 Loading Flutter documentation...');
  
  const docsPath = path.join(__dirname, '../../../documents/flutter');
  const files = fs.readdirSync(docsPath);
  const documents = [];
  
  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    
    const filePath = path.join(docsPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const stats = fs.statSync(filePath);
    
    // Parse document metadata from content
    const title = file.replace('.md', '').replace(/_/g, ' ').replace(/-/g, ' ');
    const category = determineCategory(file, content);
    const complexity = determineComplexity(content);
    const frameworks = extractFrameworks(content);
    const tags = extractTags(content);
    
    documents.push({
      title: title,
      content: content,
      category: category,
      language: 'dart',
      codeType: 'guide',
      complexity: complexity,
      frameworks: frameworks,
      tags: tags,
      path: `/documents/flutter/${file}`,
      lastModified: stats.mtime.toISOString(),
      views: Math.floor(Math.random() * 1000) // Mock view count
    });
  }
  
  console.log(`📄 Found ${documents.length} documents to ingest`);
  return documents;
}

function determineCategory(filename: string, content: string): string {
  if (filename.includes('ui') || filename.includes('component')) return 'ui-components';
  if (filename.includes('error') || filename.includes('diagnostic')) return 'error-handling';
  if (filename.includes('monitor') || filename.includes('production')) return 'monitoring';
  if (filename.includes('architect') || filename.includes('standard')) return 'architecture';
  if (content.includes('state management')) return 'state-management';
  if (content.includes('widget')) return 'widgets';
  return 'general';
}

function determineComplexity(content: string): string {
  const lines = content.split('\n').length;
  const codeBlocks = (content.match(/```/g) || []).length / 2;
  
  if (lines < 100 && codeBlocks < 3) return 'beginner';
  if (lines < 300 && codeBlocks < 10) return 'intermediate';
  return 'advanced';
}

function extractFrameworks(content: string): string[] {
  const frameworks = [];
  if (content.includes('Flutter') || content.includes('flutter')) frameworks.push('flutter');
  if (content.includes('Provider') || content.includes('provider')) frameworks.push('provider');
  if (content.includes('Bloc') || content.includes('bloc')) frameworks.push('bloc');
  if (content.includes('GetX') || content.includes('getx')) frameworks.push('getx');
  if (content.includes('Riverpod') || content.includes('riverpod')) frameworks.push('riverpod');
  if (content.includes('Firebase') || content.includes('firebase')) frameworks.push('firebase');
  return frameworks.length > 0 ? frameworks : ['flutter'];
}

function extractTags(content: string): string[] {
  const tags = [];
  
  // Extract common Flutter concepts as tags
  if (content.includes('widget')) tags.push('widget');
  if (content.includes('state')) tags.push('state');
  if (content.includes('navigation')) tags.push('navigation');
  if (content.includes('async')) tags.push('async');
  if (content.includes('animation')) tags.push('animation');
  if (content.includes('testing')) tags.push('testing');
  if (content.includes('performance')) tags.push('performance');
  if (content.includes('error')) tags.push('error-handling');
  if (content.includes('logging')) tags.push('logging');
  if (content.includes('monitoring')) tags.push('monitoring');
  
  return tags;
}

async function ingestDocuments(documents: any[]) {
  console.log('💾 Ingesting documents into Weaviate...');
  
  try {
    // Batch insert documents
    let batcher = client.batch.objectsBatcher();
    
    for (const doc of documents) {
      batcher = batcher.withObject({
        class: 'FlutterDoc',
        properties: doc
      });
    }
    
    const result = await batcher.do();
    
    // Check for errors
    const errors = result.filter((r: any) => r.result?.errors);
    if (errors.length > 0) {
      console.error('⚠️  Some documents failed to ingest:', errors);
    }
    
    console.log(`✅ Successfully ingested ${result.length - errors.length} documents`);
    
  } catch (error) {
    console.error('❌ Failed to ingest documents:', error);
    throw error;
  }
}

async function verifyIngestion() {
  console.log('🔍 Verifying ingestion...');
  
  try {
    const result = await client.graphql
      .aggregate()
      .withClassName('FlutterDoc')
      .withFields('meta { count }')
      .do();
    
    const count = result.data.Aggregate.FlutterDoc[0].meta.count;
    console.log(`📊 Total documents in Weaviate: ${count}`);
    
    // Test a sample query
    const searchResult = await client.graphql
      .get()
      .withClassName('FlutterDoc')
      .withFields('title category complexity')
      .withLimit(3)
      .do();
    
    console.log('📋 Sample documents:');
    searchResult.data.Get.FlutterDoc.forEach((doc: any) => {
      console.log(`  - ${doc.title} (${doc.category}, ${doc.complexity})`);
    });
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

async function main() {
  console.log('🚀 Starting Weaviate setup...\n');
  
  try {
    // Test connection
    const meta = await client.misc.metaGetter().do();
    console.log(`✅ Connected to Weaviate v${meta.version}\n`);
    
    // Setup schema
    await setupSchema();
    
    // Load and ingest documents
    const documents = await loadDocuments();
    await ingestDocuments(documents);
    
    // Verify
    await verifyIngestion();
    
    console.log('\n🎉 Setup complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === __filename) {
  main();
}

export { setupSchema, loadDocuments, ingestDocuments };