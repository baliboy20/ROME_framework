/**
 * DocumentLoader Implementation
 * Loads and parses documents from various sources and formats
 */

import * as fs from 'fs';
import * as path from 'path';

interface DocumentMetadata {
  tags: string[];
  categories: string[];
  language: string;
  codeType?: 'snippet' | 'template' | 'pattern';
  complexity: 'simple' | 'moderate' | 'complex';
  frameworks: string[];
}

interface DocumentSection {
  id: string;
  title: string;
  content: string;
  type: 'heading' | 'code' | 'text' | 'list';
  level?: number;
}

interface LoadedDocument {
  content: string;
  metadata: DocumentMetadata;
  sections: DocumentSection[];
}

type DocumentFormat = 'dart' | 'javascript' | 'typescript' | 'markdown' | 'json' | 'yaml' | 'auto';

export class DocumentLoader {
  private generateSectionId(): string {
    return `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private detectFormat(source: string, format: DocumentFormat): DocumentFormat {
    if (format !== 'auto') return format;

    // If source looks like a file path, detect by extension
    if (source.includes('.') && !source.includes('\n')) {
      const ext = path.extname(source).toLowerCase();
      switch (ext) {
        case '.dart': return 'dart';
        case '.js': return 'javascript';
        case '.ts': return 'typescript';
        case '.md': case '.markdown': return 'markdown';
        case '.json': return 'json';
        case '.yaml': case '.yml': return 'yaml';
      }
    }

    // Content-based detection
    if (source.includes('import \'package:') || source.includes('class ') && source.includes('extends')) {
      return 'dart';
    }
    if (source.includes('function') || source.includes('const ') || source.includes('import ')) {
      return 'javascript';
    }
    if (source.startsWith('#') || source.includes('## ')) {
      return 'markdown';
    }
    if (source.trim().startsWith('{') && source.trim().endsWith('}')) {
      return 'json';
    }

    return 'markdown'; // Default fallback
  }

  private parseMarkdownSections(content: string): DocumentSection[] {
    const sections: DocumentSection[] = [];
    const lines = content.split('\n');
    let currentSection: DocumentSection | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue; // Skip undefined lines

      // Check for headings
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch && headingMatch[1] && headingMatch[2]) {
        // Save previous section if exists
        if (currentSection) {
          sections.push(currentSection);
        }

        // Start new section
        currentSection = {
          id: this.generateSectionId(),
          title: headingMatch[2],
          content: line,
          type: 'heading',
          level: headingMatch[1].length
        };
      } else if (line.trim().startsWith('```')) {
        // Handle code blocks
        if (currentSection) {
          sections.push(currentSection);
        }

        const codeLines = [line];
        i++; // Skip opening ```
        
        while (i < lines.length && lines[i] && !lines[i]!.trim().startsWith('```')) {
          const line = lines[i];
          if (line) codeLines.push(line);
          i++;
        }
        if (i < lines.length) {
          const closingLine = lines[i];
          if (closingLine) codeLines.push(closingLine); // Closing ```
        }

        currentSection = {
          id: this.generateSectionId(),
          title: 'Code Block',
          content: codeLines.join('\n'),
          type: 'code'
        };
      } else if (line && (line.trim().match(/^[-*+]\s+/) || line.trim().match(/^\d+\.\s+/))) {
        // Handle lists
        if (!currentSection || currentSection.type !== 'list') {
          if (currentSection) {
            sections.push(currentSection);
          }
          currentSection = {
            id: this.generateSectionId(),
            title: 'List',
            content: line,
            type: 'list'
          };
        } else {
          currentSection.content += '\n' + line;
        }
      } else if (line) {
        // Regular text
        if (!currentSection) {
          currentSection = {
            id: this.generateSectionId(),
            title: 'Text',
            content: line,
            type: 'text'
          };
        } else {
          currentSection.content += '\n' + line;
        }
      }
    }

    // Add final section
    if (currentSection) {
      sections.push(currentSection);
    }

    return sections.filter(section => section.content.trim().length > 0);
  }

  private parseCodeSections(content: string, language: string): DocumentSection[] {
    const sections: DocumentSection[] = [];
    const lines = content.split('\n');
    
    let currentSection: DocumentSection | null = null;
    let inComment = false;
    let braceLevel = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue; // Skip undefined lines
      const trimmedLine = line.trim();

      // Track brace levels for structure
      braceLevel += (line.match(/{/g) || []).length;
      braceLevel -= (line.match(/}/g) || []).length;

      // Check for class definitions
      if (trimmedLine.match(/^(class|interface|enum|mixin)\s+\w+/)) {
        if (currentSection) {
          sections.push(currentSection);
        }
        
        const match = trimmedLine.match(/^(class|interface|enum|mixin)\s+(\w+)/);
        currentSection = {
          id: this.generateSectionId(),
          title: match && match[1] && match[2] ? `${match[1]} ${match[2]}` : 'Class Definition',
          content: line,
          type: 'code'
        };
      }
      // Check for function/method definitions
      else if (trimmedLine.match(/^(public|private|protected)?\s*(static)?\s*(async)?\s*\w+.*\([^)]*\)\s*[{:]/) ||
               trimmedLine.match(/^(fun|function|def)\s+\w+/)) {
        if (currentSection && braceLevel <= 1) {
          sections.push(currentSection);
        }
        
        const functionMatch = trimmedLine.match(/(\w+)\s*\(/);
        currentSection = {
          id: this.generateSectionId(),
          title: functionMatch && functionMatch[1] ? `Function ${functionMatch[1]}` : 'Function',
          content: line,
          type: 'code'
        };
      }
      // Check for comments (documentation blocks)
      else if (trimmedLine.startsWith('///') || trimmedLine.startsWith('/**') || trimmedLine.startsWith('/*')) {
        if (currentSection && currentSection.type !== 'text') {
          sections.push(currentSection);
        }
        
        if (!currentSection || currentSection.type !== 'text') {
          currentSection = {
            id: this.generateSectionId(),
            title: 'Documentation',
            content: line,
            type: 'text'
          };
        } else {
          currentSection.content += '\n' + line;
        }
        
        inComment = trimmedLine.startsWith('/*');
      }
      else {
        // Continue current section or start new one
        if (!currentSection) {
          currentSection = {
            id: this.generateSectionId(),
            title: 'Code Block',
            content: line,
            type: 'code'
          };
        } else {
          currentSection.content += '\n' + line;
        }
        
        if (inComment && (trimmedLine.includes('*/') || trimmedLine.endsWith('*/'))) {
          inComment = false;
        }
      }
    }

    // Add final section
    if (currentSection) {
      sections.push(currentSection);
    }

    return sections.filter(section => section.content.trim().length > 0);
  }

  private parseJsonSections(content: string): DocumentSection[] {
    try {
      const parsed = JSON.parse(content);
      const sections: DocumentSection[] = [];

      const traverse = (obj: any, path: string = '') => {
        if (typeof obj === 'object' && obj !== null) {
          for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key;
            
            if (typeof value === 'object') {
              sections.push({
                id: this.generateSectionId(),
                title: currentPath,
                content: JSON.stringify(value, null, 2),
                type: 'code'
              });
              traverse(value, currentPath);
            } else {
              sections.push({
                id: this.generateSectionId(),
                title: currentPath,
                content: `${key}: ${JSON.stringify(value)}`,
                type: 'text'
              });
            }
          }
        }
      };

      traverse(parsed);
      return sections;
    } catch (error) {
      // If JSON parsing fails, treat as text
      return [{
        id: this.generateSectionId(),
        title: 'JSON Content',
        content,
        type: 'text'
      }];
    }
  }

  private createBasicMetadata(content: string, format: DocumentFormat): DocumentMetadata {
    // This is a simplified metadata creation - in a real implementation,
    // this would use the MetadataExtractor class
    const frameworks: string[] = [];
    const tags: string[] = [];
    
    if (content.includes('flutter') || content.includes('Flutter')) {
      frameworks.push('flutter');
      tags.push('flutter');
    }
    if (content.includes('State') || content.includes('Widget')) {
      tags.push('widget', 'ui');
    }

    return {
      tags,
      categories: tags.length > 0 ? ['flutter-development'] : ['documentation'],
      language: format === 'dart' ? 'dart' : 
                format === 'javascript' ? 'javascript' :
                format === 'typescript' ? 'typescript' : 'unknown',
      complexity: content.length > 1000 ? 'moderate' : 'simple',
      frameworks
    };
  }

  private loadFromFile(filePath: string): string {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to load file ${filePath}: ${(error as Error).message}`);
    }
  }

  load(source: string | Buffer, format: DocumentFormat = 'auto'): LoadedDocument {
    let content: string;

    // Handle different source types
    if (Buffer.isBuffer(source)) {
      content = source.toString('utf-8');
    } else if (typeof source === 'string') {
      // Check if source is a file path or content
      if (source.length < 260 && !source.includes('\n') && !source.includes('\r')) {
        // Likely a file path
        try {
          content = this.loadFromFile(source);
        } catch {
          // If file loading fails, treat as content
          content = source;
        }
      } else {
        // Direct content
        content = source;
      }
    } else {
      throw new Error('Invalid source type. Expected string or Buffer.');
    }

    const detectedFormat = this.detectFormat(content, format);
    
    // Parse sections based on format
    let sections: DocumentSection[];
    switch (detectedFormat) {
      case 'markdown':
        sections = this.parseMarkdownSections(content);
        break;
      case 'dart':
      case 'javascript':
      case 'typescript':
        sections = this.parseCodeSections(content, detectedFormat);
        break;
      case 'json':
        sections = this.parseJsonSections(content);
        break;
      default:
        sections = [{
          id: this.generateSectionId(),
          title: 'Document Content',
          content,
          type: 'text'
        }];
    }

    const metadata = this.createBasicMetadata(content, detectedFormat);

    return {
      content,
      metadata,
      sections
    };
  }
}