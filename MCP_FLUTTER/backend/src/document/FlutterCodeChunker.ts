/**
 * Flutter-Optimized Document Chunker
 * Specialized chunking for Flutter/Dart code and technical documentation
 * Optimized for coding assistance and pattern retrieval
 */

import { DocumentChunker } from './DocumentChunker.js';

interface FlutterChunk {
  id: string;
  content: string;
  metadata: {
    startIndex: number;
    endIndex: number;
    tokenCount: number;
    section?: string;
    codeType?: 'widget' | 'bloc' | 'model' | 'service' | 'test' | 'config' | 'example';
    language?: 'dart' | 'yaml' | 'json' | 'markdown';
    patterns?: string[];
    imports?: string[];
    className?: string;
    methodName?: string;
    widgetType?: string;
  };
}

interface FlutterChunkingOptions {
  maxTokens?: number;
  overlap?: number;
  preserveCodeBlocks?: boolean;
  extractPatterns?: boolean;
  minChunkSize?: number;
}

export class FlutterCodeChunker extends DocumentChunker {
  private readonly DEFAULT_OPTIONS: FlutterChunkingOptions = {
    maxTokens: 1500,  // Optimal for code examples with context
    overlap: 200,     // Maintain context between chunks
    preserveCodeBlocks: true,
    extractPatterns: true,
    minChunkSize: 100
  };

  private readonly FLUTTER_PATTERNS = {
    widget: /class\s+(\w+)\s+extends\s+(StatelessWidget|StatefulWidget|State<|InheritedWidget|CustomPainter)/,
    bloc: /class\s+(\w+)\s+extends\s+(Bloc|Cubit|BlocObserver)|class\s+(\w+)(Event|State)\s+/,
    model: /class\s+(\w+)\s+(?:extends\s+)?(?:implements\s+)?.*\{.*(?:fromJson|toJson|copyWith)/s,
    service: /class\s+(\w+)(?:Service|Repository|Provider|Client|Manager)/,
    test: /(?:test|testWidgets|group)\s*\(/,
    stateManagement: /(?:Provider|BlocProvider|Consumer|BlocBuilder|GetX|Riverpod)/,
    navigation: /(?:Navigator|GoRouter|AutoRoute|push|pop|pushNamed)/,
    async: /(?:Future|Stream|async|await|then|catchError)/,
    errorHandling: /(?:try|catch|throw|Exception|Error|Result|Either)/
  };

  private detectCodeType(content: string): FlutterChunk['metadata']['codeType'] {
    if (this.FLUTTER_PATTERNS.widget.test(content)) return 'widget';
    if (this.FLUTTER_PATTERNS.bloc.test(content)) return 'bloc';
    if (this.FLUTTER_PATTERNS.test.test(content)) return 'test';
    if (this.FLUTTER_PATTERNS.service.test(content)) return 'service';
    if (this.FLUTTER_PATTERNS.model.test(content)) return 'model';
    if (content.includes('void main()') || content.includes('runApp')) return 'config';
    return 'example';
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    return imports;
  }

  private extractFlutterPatterns(content: string): string[] {
    const patterns: string[] = [];
    
    Object.entries(this.FLUTTER_PATTERNS).forEach(([name, regex]) => {
      if (regex.test(content)) {
        patterns.push(name);
      }
    });

    // Extract specific Flutter widgets
    const widgetMatches = content.match(/\b(Container|Column|Row|Stack|ListView|GridView|Scaffold|AppBar|Text|Button|Card|Dialog)\b/g);
    if (widgetMatches) {
      patterns.push(...new Set(widgetMatches.map(w => `widget:${w.toLowerCase()}`)));
    }

    return patterns;
  }

  private extractClassName(content: string): string | undefined {
    const classMatch = content.match(/class\s+(\w+)/);
    return classMatch ? classMatch[1] : undefined;
  }

  private extractMethodName(content: string): string | undefined {
    const methodMatch = content.match(/(?:Future|void|String|int|bool|dynamic|var|final|const)?\s+(\w+)\s*\([^)]*\)\s*(?:async\s*)?{/);
    return methodMatch ? methodMatch[1] : undefined;
  }

  private preserveCodeBlock(content: string, startPattern: string, endPattern: string): string[] {
    const blocks: string[] = [];
    const regex = new RegExp(`${startPattern}([\\s\\S]*?)${endPattern}`, 'g');
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      blocks.push(match[0]);
    }
    
    return blocks;
  }

  private smartChunkByFlutterStructure(content: string, options: FlutterChunkingOptions): FlutterChunk[] {
    const chunks: FlutterChunk[] = [];
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    // Detect language
    const language = this.detectLanguage(content);
    
    if (language === 'dart' && opts.preserveCodeBlocks) {
      // Split by class definitions for Dart code
      const classBlocks = this.splitByClasses(content);
      
      for (const block of classBlocks) {
        if (this.estimateTokenCount(block.content) <= opts.maxTokens!) {
          chunks.push(this.createFlutterChunk(block.content, block.startIndex, block.endIndex, opts));
        } else {
          // Further split large classes by methods
          const methodChunks = this.splitByMethods(block.content, block.startIndex, opts.maxTokens!);
          chunks.push(...methodChunks);
        }
      }
    } else if (language === 'markdown') {
      // For markdown, split by sections but preserve code examples
      const sections = this.splitBySections(content, opts.maxTokens!);
      chunks.push(...sections);
    } else {
      // Fallback to standard chunking
      const standardChunks = super.chunk(content, {
        maxTokens: opts.maxTokens!,
        overlap: opts.overlap!,
        preserveStructure: true
      });
      
      // Convert to FlutterChunks
      chunks.push(...standardChunks.map(chunk => 
        this.createFlutterChunk(chunk.content, chunk.metadata.startIndex, chunk.metadata.endIndex, opts)
      ));
    }
    
    return chunks;
  }

  private detectLanguage(content: string): FlutterChunk['metadata']['language'] {
    if (content.includes('```dart') || content.includes('class ') && content.includes('Widget')) return 'dart';
    if (content.includes('```yaml') || content.includes('dependencies:')) return 'yaml';
    if (content.includes('```json') || content.startsWith('{') && content.includes('"')) return 'json';
    return 'markdown';
  }

  private splitByClasses(content: string): Array<{content: string, startIndex: number, endIndex: number}> {
    const blocks: Array<{content: string, startIndex: number, endIndex: number}> = [];
    const classRegex = /class\s+\w+[^{]*{/g;
    const matches = Array.from(content.matchAll(classRegex));
    
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index!;
      const end = i < matches.length - 1 ? matches[i + 1].index! : content.length;
      
      // Find the actual end of the class by counting braces
      const classContent = this.extractBalancedBraces(content.substring(start, end));
      blocks.push({
        content: classContent,
        startIndex: start,
        endIndex: start + classContent.length
      });
    }
    
    // Add any content before first class or after last class
    if (blocks.length === 0 || blocks[0].startIndex > 0) {
      const preContent = content.substring(0, blocks[0]?.startIndex || content.length);
      if (preContent.trim()) {
        blocks.unshift({
          content: preContent,
          startIndex: 0,
          endIndex: preContent.length
        });
      }
    }
    
    return blocks;
  }

  private splitByMethods(classContent: string, classStartIndex: number, maxTokens: number): FlutterChunk[] {
    const chunks: FlutterChunk[] = [];
    const methodRegex = /(?:@override\s+)?(?:Future|void|String|int|bool|dynamic|var|final|const|static)?\s*\w+\s*\([^)]*\)\s*(?:async\s*)?{/g;
    const matches = Array.from(classContent.matchAll(methodRegex));
    
    let currentChunk = '';
    let chunkStartIndex = classStartIndex;
    
    for (const match of matches) {
      const methodStart = match.index!;
      const methodContent = this.extractBalancedBraces(classContent.substring(methodStart));
      
      if (this.estimateTokenCount(currentChunk + methodContent) > maxTokens && currentChunk) {
        // Save current chunk
        chunks.push(this.createFlutterChunk(currentChunk, chunkStartIndex, chunkStartIndex + currentChunk.length, {}));
        currentChunk = methodContent;
        chunkStartIndex = classStartIndex + methodStart;
      } else {
        currentChunk += methodContent + '\n';
      }
    }
    
    // Add remaining content
    if (currentChunk) {
      chunks.push(this.createFlutterChunk(currentChunk, chunkStartIndex, chunkStartIndex + currentChunk.length, {}));
    }
    
    return chunks;
  }

  private splitBySections(content: string, maxTokens: number): FlutterChunk[] {
    const chunks: FlutterChunk[] = [];
    const sectionRegex = /^(#{1,6})\s+(.+)$/gm;
    const matches = Array.from(content.matchAll(sectionRegex));
    
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index!;
      const end = i < matches.length - 1 ? matches[i + 1].index! : content.length;
      const sectionContent = content.substring(start, end);
      
      if (this.estimateTokenCount(sectionContent) <= maxTokens) {
        chunks.push(this.createFlutterChunk(sectionContent, start, end, {}));
      } else {
        // Split large sections while preserving code blocks
        const subChunks = this.splitPreservingCodeBlocks(sectionContent, start, maxTokens);
        chunks.push(...subChunks);
      }
    }
    
    return chunks;
  }

  private splitPreservingCodeBlocks(content: string, startIndex: number, maxTokens: number): FlutterChunk[] {
    const chunks: FlutterChunk[] = [];
    const codeBlockRegex = /```[\s\S]*?```/g;
    const codeBlocks = Array.from(content.matchAll(codeBlockRegex));
    
    let currentChunk = '';
    let chunkStart = startIndex;
    let lastEnd = 0;
    
    for (const block of codeBlocks) {
      const beforeCode = content.substring(lastEnd, block.index!);
      const codeContent = block[0];
      
      // Check if adding this section exceeds token limit
      if (this.estimateTokenCount(currentChunk + beforeCode + codeContent) > maxTokens && currentChunk) {
        chunks.push(this.createFlutterChunk(currentChunk, chunkStart, chunkStart + currentChunk.length, {}));
        currentChunk = beforeCode + codeContent;
        chunkStart = startIndex + lastEnd;
      } else {
        currentChunk += beforeCode + codeContent;
      }
      
      lastEnd = block.index! + codeContent.length;
    }
    
    // Add remaining content
    const remaining = content.substring(lastEnd);
    if (remaining) {
      currentChunk += remaining;
    }
    
    if (currentChunk) {
      chunks.push(this.createFlutterChunk(currentChunk, chunkStart, chunkStart + currentChunk.length, {}));
    }
    
    return chunks;
  }

  private extractBalancedBraces(content: string): string {
    let braceCount = 0;
    let inString = false;
    let stringChar = '';
    let result = '';
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      result += char;
      
      // Handle string literals
      if ((char === '"' || char === "'") && content[i - 1] !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }
      
      if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') {
          braceCount--;
          if (braceCount === 0) break;
        }
      }
    }
    
    return result;
  }

  private createFlutterChunk(
    content: string, 
    startIndex: number, 
    endIndex: number,
    options: FlutterChunkingOptions
  ): FlutterChunk {
    const metadata: FlutterChunk['metadata'] = {
      startIndex,
      endIndex,
      tokenCount: this.estimateTokenCount(content),
      language: this.detectLanguage(content),
      codeType: this.detectCodeType(content)
    };
    
    if (options.extractPatterns) {
      metadata.patterns = this.extractFlutterPatterns(content);
      metadata.imports = this.extractImports(content);
      metadata.className = this.extractClassName(content);
      metadata.methodName = this.extractMethodName(content);
    }
    
    // Extract section from content
    const sectionMatch = content.match(/^#+\s+(.+)$/m);
    if (sectionMatch) {
      metadata.section = sectionMatch[1];
    }
    
    return {
      id: this.generateId(),
      content,
      metadata
    };
  }

  private estimateTokenCount(text: string): number {
    // More accurate for code: ~3.5 characters per token
    return Math.ceil(text.length / 3.5);
  }

  private generateId(): string {
    return `flutter_chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public chunkFlutterDocument(content: string, options?: FlutterChunkingOptions): FlutterChunk[] {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    return this.smartChunkByFlutterStructure(content, opts);
  }
}