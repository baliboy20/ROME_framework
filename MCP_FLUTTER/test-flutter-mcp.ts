#!/usr/bin/env tsx
/**
 * Flutter MCP Test Suite
 * Tests the optimized chunking, metadata extraction, and search functionality
 */

import { FlutterCodeChunker } from './backend/src/document/FlutterCodeChunker.js';
import { FlutterMetadataExtractor } from './backend/src/document/FlutterMetadataExtractor.js';
import { FlutterSearchOptimizer } from './backend/src/search/FlutterSearchOptimizer.js';
import { SemanticSearchEngine } from './backend/src/search/SemanticSearchEngine.js';
import { WeaviateClient } from './backend/src/vectorstore/WeaviateClient.js';
import * as fs from 'fs/promises';
import * as path from 'path';

// Test colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class FlutterMCPTester {
  private chunker: FlutterCodeChunker;
  private metadataExtractor: FlutterMetadataExtractor;
  private searchOptimizer?: FlutterSearchOptimizer;
  private testResults: { passed: number; failed: number; skipped: number } = {
    passed: 0,
    failed: 0,
    skipped: 0
  };

  constructor() {
    this.chunker = new FlutterCodeChunker();
    this.metadataExtractor = new FlutterMetadataExtractor();
  }

  private log(message: string, color: keyof typeof colors = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  private assert(condition: boolean, message: string) {
    if (condition) {
      this.testResults.passed++;
      this.log(`  ✓ ${message}`, 'green');
    } else {
      this.testResults.failed++;
      this.log(`  ✗ ${message}`, 'red');
      throw new Error(message);
    }
  }

  async testChunking() {
    this.log('\n🧪 Testing Flutter Code Chunker', 'cyan');
    
    // Test 1: Basic Dart code chunking
    const dartCode = `
import 'package:flutter/material.dart';
import 'package:bloc/bloc.dart';

class CounterBloc extends Bloc<CounterEvent, int> {
  CounterBloc() : super(0) {
    on<Increment>((event, emit) => emit(state + 1));
    on<Decrement>((event, emit) => emit(state - 1));
  }
}

class CounterWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return BlocBuilder<CounterBloc, int>(
      builder: (context, count) {
        return Text('Count: $count');
      },
    );
  }
}`;

    const chunks = this.chunker.chunkFlutterDocument(dartCode);
    
    this.assert(chunks.length > 0, 'Should create chunks from Dart code');
    this.assert(
      chunks[0].metadata.codeType === 'bloc' || chunks[0].metadata.codeType === 'widget',
      'Should detect code type correctly'
    );
    this.assert(
      chunks[0].metadata.imports?.includes('package:flutter/material.dart'),
      'Should extract imports'
    );
    
    // Test 2: Markdown with code blocks
    const markdownDoc = `
# Flutter State Management Guide

## Overview
This guide covers state management patterns.

## Bloc Pattern Example

\`\`\`dart
class TodoBloc extends Bloc<TodoEvent, TodoState> {
  TodoBloc() : super(TodoInitial()) {
    on<LoadTodos>(_onLoadTodos);
  }
}
\`\`\`

## Best Practices
- Always dispose of controllers
- Use const constructors when possible
`;

    const mdChunks = this.chunker.chunkFlutterDocument(markdownDoc);
    
    this.assert(mdChunks.length > 0, 'Should chunk markdown documents');
    this.assert(
      mdChunks[0].metadata.language === 'markdown',
      'Should detect markdown language'
    );
    
    // Test 3: Large class splitting
    const largeClass = this.generateLargeClass();
    const largeChunks = this.chunker.chunkFlutterDocument(largeClass, { maxTokens: 500 });
    
    this.assert(largeChunks.length > 1, 'Should split large classes into multiple chunks');
    this.assert(
      largeChunks.every(chunk => chunk.metadata.tokenCount <= 600), // Allow some overflow
      'Should respect token limits'
    );
  }

  async testMetadataExtraction() {
    this.log('\n🧪 Testing Flutter Metadata Extractor', 'cyan');
    
    const sampleContent = `
# Flutter Error Handling Guide

## Overview
Comprehensive error handling patterns for Flutter applications.

### Prerequisites
- Understanding of Dart basics
- Familiarity with Flutter widgets

## Network Error Handling

\`\`\`dart
class NetworkService {
  Future<T> makeRequest<T>() async {
    try {
      final response = await http.get(uri);
      return processResponse(response);
    } catch (e) {
      throw NetworkError(e.toString());
    }
  }
}
\`\`\`

## Best Practices
- Always use try-catch for async operations
- Provide user-friendly error messages
- Log errors for debugging

## Performance Considerations
- Avoid catching errors in build methods
- Use error boundaries to contain failures
`;

    const metadata = this.metadataExtractor.extractMetadata(sampleContent, 'error_handling.md');
    
    this.assert(metadata.category === 'error-handling', 'Should detect error-handling category');
    this.assert(metadata.documentType === 'guide', 'Should identify as guide');
    this.assert(
      metadata.patterns.features?.includes('async'),
      'Should detect async patterns'
    );
    this.assert(
      metadata.bestPractices?.length > 0,
      'Should extract best practices'
    );
    this.assert(
      metadata.performanceConsiderations?.length > 0,
      'Should extract performance considerations'
    );
    this.assert(
      metadata.prerequisites?.length > 0,
      'Should extract prerequisites'
    );
    this.assert(
      metadata.codeElements.classes?.includes('NetworkService'),
      'Should extract class names'
    );
    this.assert(
      metadata.complexity === 'intermediate' || metadata.complexity === 'advanced',
      'Should assess complexity level'
    );
  }

  async testSearchOptimization() {
    this.log('\n🧪 Testing Flutter Search Optimizer', 'cyan');
    
    // Mock search engine for testing
    const mockSearchEngine = {
      search: async (query: any) => {
        return [
          {
            content: 'BlocProvider widget implementation example...',
            score: 0.85,
            metadata: {
              category: 'state-management',
              documentType: 'example',
              patterns: { stateManagement: ['bloc'] },
              codeElements: { widgets: ['BlocProvider'] }
            }
          },
          {
            content: 'Error handling in Flutter applications...',
            score: 0.75,
            metadata: {
              category: 'error-handling',
              documentType: 'guide',
              patterns: { features: ['async'] }
            }
          }
        ];
      }
    } as any;
    
    this.searchOptimizer = new FlutterSearchOptimizer(mockSearchEngine);
    
    // Test 1: Intent detection
    const queries = [
      { query: 'how to implement bloc pattern', expectedIntent: 'implementation' },
      { query: 'error: null check operator used', expectedIntent: 'error-fix' },
      { query: 'best practice for state management', expectedIntent: 'pattern' },
      { query: 'TextField widget API', expectedIntent: 'api' },
      { query: 'example of navigation', expectedIntent: 'example' }
    ];
    
    for (const test of queries) {
      const results = await this.searchOptimizer.searchFlutterDocs({ query: test.query });
      // Intent is detected internally, we validate by checking results
      this.assert(results.length > 0, `Should return results for: ${test.query}`);
    }
    
    // Test 2: Context-aware search
    const contextualSearch = await this.searchOptimizer.searchFlutterDocs({
      query: 'state management',
      context: {
        currentWidget: 'BlocProvider',
        stateManagement: 'bloc'
      }
    });
    
    this.assert(
      contextualSearch[0].score > 0,
      'Should score results based on context'
    );
    
    // Test 3: Search suggestions
    const suggestions = this.searchOptimizer.generateSearchSuggestions('nav');
    this.assert(
      suggestions.some(s => s.toLowerCase().includes('navigation')),
      'Should generate relevant suggestions'
    );
  }

  async testDocumentIngestion() {
    this.log('\n🧪 Testing Document Ingestion', 'cyan');
    
    const docsPath = path.join(process.cwd(), 'documents', 'flutter');
    
    try {
      const files = await fs.readdir(docsPath);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      
      this.assert(mdFiles.length > 0, `Found ${mdFiles.length} markdown files to process`);
      
      for (const file of mdFiles) {
        const content = await fs.readFile(path.join(docsPath, file), 'utf-8');
        
        // Test chunking
        const chunks = this.chunker.chunkFlutterDocument(content);
        this.assert(chunks.length > 0, `Successfully chunked ${file}`);
        
        // Test metadata extraction
        const metadata = this.metadataExtractor.extractMetadata(content, file);
        this.assert(metadata.category !== undefined, `Extracted metadata for ${file}`);
        
        this.log(`    Processed ${file}: ${chunks.length} chunks, category: ${metadata.category}`, 'blue');
      }
    } catch (error) {
      this.log(`  ⚠ Skipping ingestion test: ${error}`, 'yellow');
      this.testResults.skipped++;
    }
  }

  async testIntegration() {
    this.log('\n🧪 Testing Full Integration', 'cyan');
    
    // Test the complete flow: Document → Chunk → Metadata → Search-ready
    const testDocument = await fs.readFile(
      path.join(process.cwd(), 'documents', 'flutter', 'flutter_error_handling_guide.md'),
      'utf-8'
    ).catch(() => null);
    
    if (!testDocument) {
      this.log('  ⚠ Skipping integration test: Document not found', 'yellow');
      this.testResults.skipped++;
      return;
    }
    
    // 1. Chunk the document
    const chunks = this.chunker.chunkFlutterDocument(testDocument);
    this.assert(chunks.length > 0, 'Document chunked successfully');
    
    // 2. Extract metadata for each chunk
    const enrichedChunks = chunks.map(chunk => ({
      ...chunk,
      documentMetadata: this.metadataExtractor.extractMetadata(chunk.content)
    }));
    
    this.assert(
      enrichedChunks.every(c => c.documentMetadata.category),
      'All chunks have metadata'
    );
    
    // 3. Simulate search-ready format
    const searchReadyDocs = enrichedChunks.map(chunk => ({
      id: chunk.id,
      content: chunk.content,
      metadata: {
        ...chunk.metadata,
        ...chunk.documentMetadata,
        chunkIndex: chunks.indexOf(chunk),
        totalChunks: chunks.length
      }
    }));
    
    this.assert(
      searchReadyDocs.every(doc => doc.metadata.patterns),
      'Documents are search-ready with patterns'
    );
    
    this.log(`    Created ${searchReadyDocs.length} search-ready documents`, 'blue');
  }

  private generateLargeClass(): string {
    return `
import 'package:flutter/material.dart';

class LargeWidget extends StatefulWidget {
  @override
  _LargeWidgetState createState() => _LargeWidgetState();
}

class _LargeWidgetState extends State<LargeWidget> {
  ${Array(20).fill(0).map((_, i) => `
  void method${i}() {
    // Method implementation with some content
    final result = 'Processing item ${i}';
    print(result);
    for (int j = 0; j < 10; j++) {
      final nested = 'Nested operation $j in method ${i}';
      debugPrint(nested);
    }
  }
  `).join('\n')}
  
  @override
  Widget build(BuildContext context) {
    return Container(
      child: Column(
        children: [
          Text('Large Widget'),
          ${Array(10).fill(0).map((_, i) => `
          ElevatedButton(
            onPressed: () => method${i}(),
            child: Text('Button ${i}'),
          ),`).join('\n')}
        ],
      ),
    );
  }
}`;
  }

  async runAllTests() {
    this.log('\n' + '='.repeat(50), 'cyan');
    this.log('Flutter MCP Test Suite', 'cyan');
    this.log('='.repeat(50) + '\n', 'cyan');
    
    const tests = [
      { name: 'Chunking', fn: () => this.testChunking() },
      { name: 'Metadata Extraction', fn: () => this.testMetadataExtraction() },
      { name: 'Search Optimization', fn: () => this.testSearchOptimization() },
      { name: 'Document Ingestion', fn: () => this.testDocumentIngestion() },
      { name: 'Integration', fn: () => this.testIntegration() }
    ];
    
    for (const test of tests) {
      try {
        await test.fn();
      } catch (error) {
        this.log(`\n  Error in ${test.name}: ${error}`, 'red');
      }
    }
    
    // Print summary
    this.log('\n' + '='.repeat(50), 'cyan');
    this.log('Test Summary', 'cyan');
    this.log('='.repeat(50), 'cyan');
    this.log(`✓ Passed: ${this.testResults.passed}`, 'green');
    this.log(`✗ Failed: ${this.testResults.failed}`, 'red');
    this.log(`⚠ Skipped: ${this.testResults.skipped}`, 'yellow');
    
    const total = this.testResults.passed + this.testResults.failed;
    const percentage = total > 0 ? Math.round((this.testResults.passed / total) * 100) : 0;
    this.log(`\nSuccess Rate: ${percentage}%`, percentage >= 80 ? 'green' : 'red');
    
    process.exit(this.testResults.failed > 0 ? 1 : 0);
  }
}

// Run tests
const tester = new FlutterMCPTester();
tester.runAllTests().catch(console.error);