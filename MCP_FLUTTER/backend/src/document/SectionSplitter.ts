/**
 * SectionSplitter Implementation
 * Intelligently splits documents into logical sections
 */

interface DocumentSection {
  id: string;
  title: string;
  content: string;
  type: 'heading' | 'code' | 'text' | 'list';
  level?: number;
}

interface SplittingStrategy {
  type: 'semantic' | 'structural' | 'length';
  parameters: Record<string, any>;
}

export class SectionSplitter {
  private generateSectionId(): string {
    return `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private splitBySentences(text: string, minSentences: number, maxSentences: number): string[] {
    // Simple sentence splitting - in production, use a proper NLP library
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
    const chunks: string[] = [];
    
    let currentChunk: string[] = [];
    
    for (const sentence of sentences) {
      currentChunk.push(sentence);
      
      if (currentChunk.length >= maxSentences) {
        chunks.push(currentChunk.join('. ') + '.');
        currentChunk = [];
      }
    }
    
    if (currentChunk.length > 0) {
      if (currentChunk.length >= minSentences || chunks.length === 0) {
        chunks.push(currentChunk.join('. ') + '.');
      } else {
        // Merge with previous chunk if too small
        if (chunks.length > 0) {
          chunks[chunks.length - 1] += ' ' + currentChunk.join('. ') + '.';
        } else {
          chunks.push(currentChunk.join('. ') + '.');
        }
      }
    }
    
    return chunks;
  }

  private splitByParagraphs(text: string): string[] {
    return text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
  }

  private splitByTopics(text: string): DocumentSection[] {
    const sections: DocumentSection[] = [];
    const paragraphs = this.splitByParagraphs(text);
    
    let currentTopic: string[] = [];
    let currentTitle = 'Introduction';
    
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      if (!paragraph) continue; // Skip undefined paragraphs
      
      // Detect topic changes based on keywords and sentence structure
      const isNewTopic = this.detectTopicChange(paragraph, currentTopic);
      
      if (isNewTopic && currentTopic.length > 0) {
        sections.push({
          id: this.generateSectionId(),
          title: currentTitle,
          content: currentTopic.join('\n\n'),
          type: 'text'
        });
        
        currentTopic = [paragraph];
        currentTitle = this.extractTopicTitle(paragraph);
      } else {
        currentTopic.push(paragraph);
      }
    }
    
    // Add final section
    if (currentTopic.length > 0) {
      sections.push({
        id: this.generateSectionId(),
        title: currentTitle,
        content: currentTopic.join('\n\n'),
        type: 'text'
      });
    }
    
    return sections;
  }

  private detectTopicChange(paragraph: string, currentTopic: string[]): boolean {
    if (currentTopic.length === 0) return false;
    
    const topicTransitionWords = [
      'next', 'then', 'after', 'following', 'finally', 'lastly',
      'however', 'meanwhile', 'alternatively', 'instead',
      'first', 'second', 'third', 'fourth', 'fifth'
    ];
    
    const lowerParagraph = paragraph.toLowerCase();
    const hasTransition = topicTransitionWords.some(word => 
      lowerParagraph.startsWith(word) || lowerParagraph.includes(`, ${word}`)
    );
    
    // Also check if paragraph starts with a strong declarative statement
    const hasStrongStart = /^[A-Z][^.!?]*[.!?]\s+[A-Z]/.test(paragraph);
    
    return hasTransition || hasStrongStart;
  }

  private extractTopicTitle(paragraph: string): string {
    // Extract first sentence as title
    const sentenceParts = paragraph.split(/[.!?]/);
    const firstSentence = (sentenceParts[0] || paragraph).trim();
    
    // Limit length and remove common prefixes
    let title = firstSentence.substring(0, 50);
    if (title.length < firstSentence.length) {
      title += '...';
    }
    
    return title;
  }

  private splitStructurally(content: string, splitTargets: string[]): DocumentSection[] {
    const sections: DocumentSection[] = [];
    const lines = content.split('\n');
    
    let currentSection: DocumentSection | null = null;
    let inCodeBlock = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue; // Skip undefined lines
      const trimmedLine = line.trim();
      
      // Track code block state
      if (trimmedLine.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
      }
      
      let foundStructure = false;
      
      if (!inCodeBlock) {
        // Check for structural elements
        for (const target of splitTargets) {
          const pattern = this.getStructuralPattern(target);
          if (pattern && pattern.test(trimmedLine)) {
            // Save current section
            if (currentSection) {
              sections.push(currentSection);
            }
            
            // Start new section
            const title = this.extractStructuralTitle(trimmedLine, target);
            currentSection = {
              id: this.generateSectionId(),
              title,
              content: line,
              type: this.getStructuralType(target)
            };
            
            foundStructure = true;
            break;
          }
        }
      }
      
      if (!foundStructure) {
        if (!currentSection) {
          currentSection = {
            id: this.generateSectionId(),
            title: 'Content',
            content: line,
            type: inCodeBlock ? 'code' : 'text'
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

  private getStructuralPattern(target: string): RegExp | null {
    const patterns: Record<string, RegExp> = {
      'class': /^(class|interface|enum|mixin)\s+\w+/,
      'method': /^(public|private|protected)?\s*(static)?\s*(async)?\s*\w+.*\([^)]*\)\s*[{:]/,
      'function': /^(function|fun|def)\s+\w+/,
      'property': /^(public|private|protected)?\s*(static)?\s*(final)?\s*\w+\s+\w+\s*[=;]/,
      'comment': /^\/\/\/|^\/\*\*|^#/,
      'import': /^(import|include|require|using)\s+/,
      'heading': /^#{1,6}\s+/
    };
    
    return patterns[target] || null;
  }

  private extractStructuralTitle(line: string, target: string): string {
    const trimmedLine = line.trim();
    
    switch (target) {
      case 'class':
        const classMatch = trimmedLine.match(/^(class|interface|enum|mixin)\s+(\w+)/);
        return classMatch ? `${classMatch[1]} ${classMatch[2]}` : 'Class Definition';
        
      case 'method':
      case 'function':
        const funcMatch = trimmedLine.match(/(\w+)\s*\(/);
        return funcMatch ? `Function ${funcMatch[1]}` : 'Function';
        
      case 'property':
        const propMatch = trimmedLine.match(/\w+\s+(\w+)\s*[=;]/);
        return propMatch ? `Property ${propMatch[1]}` : 'Property';
        
      case 'heading':
        return trimmedLine.replace(/^#+\s*/, '');
        
      default:
        return target.charAt(0).toUpperCase() + target.slice(1);
    }
  }

  private getStructuralType(target: string): 'heading' | 'code' | 'text' | 'list' {
    switch (target) {
      case 'heading': return 'heading';
      case 'class':
      case 'method':
      case 'function':
      case 'property':
        return 'code';
      default:
        return 'text';
    }
  }

  private splitByLength(content: string, maxLength: number): DocumentSection[] {
    if (content.length <= maxLength) {
      return [{
        id: this.generateSectionId(),
        title: 'Content',
        content,
        type: 'text'
      }];
    }
    
    const sections: DocumentSection[] = [];
    let currentStart = 0;
    let sectionNum = 1;
    
    while (currentStart < content.length) {
      let endIndex = Math.min(currentStart + maxLength, content.length);
      
      // Try to break at word boundaries
      if (endIndex < content.length) {
        const lastSpace = content.lastIndexOf(' ', endIndex);
        const lastNewline = content.lastIndexOf('\n', endIndex);
        const bestBreak = Math.max(lastSpace, lastNewline);
        
        if (bestBreak > currentStart + maxLength * 0.8) {
          endIndex = bestBreak;
        }
      }
      
      const sectionContent = content.substring(currentStart, endIndex).trim();
      
      sections.push({
        id: this.generateSectionId(),
        title: `Section ${sectionNum}`,
        content: sectionContent,
        type: 'text'
      });
      
      currentStart = endIndex;
      sectionNum++;
    }
    
    return sections;
  }

  split(content: string, strategy: SplittingStrategy): DocumentSection[] {
    if (!content || content.trim().length === 0) {
      return [];
    }
    
    switch (strategy.type) {
      case 'semantic':
        const minSentences = strategy.parameters.minSentences || 2;
        const maxSentences = strategy.parameters.maxSentences || 4;
        
        if (strategy.parameters.byTopic) {
          return this.splitByTopics(content);
        } else {
          const sentenceChunks = this.splitBySentences(content, minSentences, maxSentences);
          return sentenceChunks.map((chunk, index) => ({
            id: this.generateSectionId(),
            title: `Semantic Section ${index + 1}`,
            content: chunk,
            type: 'text' as const
          }));
        }
        
      case 'structural':
        const splitOn = strategy.parameters.splitOn || ['class', 'method', 'heading'];
        return this.splitStructurally(content, splitOn);
        
      case 'length':
        const maxLength = strategy.parameters.maxLength || 1000;
        return this.splitByLength(content, maxLength);
        
      default:
        throw new Error(`Unsupported splitting strategy: ${strategy.type}`);
    }
  }
}