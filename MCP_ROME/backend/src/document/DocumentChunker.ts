/**
 * DocumentChunker Implementation
 * Splits documents into chunks with token limits and overlap handling
 */

interface ChunkingOptions {
  maxTokens: number;
  overlap: number;
  preserveStructure: boolean;
}

interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    startIndex: number;
    endIndex: number;
    tokenCount: number;
    section?: string | undefined;
  };
}

export class DocumentChunker {
  private generateId(): string {
    return `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private estimateTokenCount(text: string): number {
    // Simple token estimation: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }

  private extractSection(text: string, startIndex: number): string | undefined {
    // Look backwards from startIndex to find the most recent heading
    const textBefore = text.substring(0, startIndex);
    const headingMatch = textBefore.match(/(?:^|\n)(#{1,6}\s+.+)$/m);
    if (headingMatch && headingMatch[1]) {
      return headingMatch[1].replace(/^#+\s+/, '');
    }
    
    // Check if we're in a code block or class
    const codeMatch = textBefore.match(/(?:^|\n)(?:class|interface|function|method)\s+(\w+)/m);
    if (codeMatch) {
      return codeMatch[1];
    }
    
    return undefined;
  }

  private splitByStructure(content: string, maxTokens: number): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const lines = content.split('\n');
    let currentChunk = '';
    let currentStartIndex = 0;
    let lineStartIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const testChunk = currentChunk + (currentChunk ? '\n' : '') + line;
      const tokenCount = this.estimateTokenCount(testChunk);

      if (tokenCount > maxTokens && currentChunk) {
        // Complete current chunk
        const endIndex = lineStartIndex - 1;
        chunks.push({
          id: this.generateId(),
          content: currentChunk,
          metadata: {
            startIndex: currentStartIndex,
            endIndex,
            tokenCount: this.estimateTokenCount(currentChunk),
            ...(this.extractSection(content, currentStartIndex) && { section: this.extractSection(content, currentStartIndex) })
          }
        });

        // Start new chunk
        currentChunk = line ?? '';
        currentStartIndex = lineStartIndex;
      } else {
        currentChunk = testChunk;
      }

      lineStartIndex += (line?.length ?? 0) + 1; // +1 for newline
    }

    // Add final chunk if any content remains
    if (currentChunk) {
      chunks.push({
        id: this.generateId(),
        content: currentChunk,
        metadata: {
          startIndex: currentStartIndex,
          endIndex: content.length,
          tokenCount: this.estimateTokenCount(currentChunk),
          ...(this.extractSection(content, currentStartIndex) && { section: this.extractSection(content, currentStartIndex) })
        }
      });
    }

    return chunks;
  }

  private splitByLength(content: string, maxTokens: number, overlap: number): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const estimatedTokens = this.estimateTokenCount(content);
    
    if (estimatedTokens <= maxTokens) {
      return [{
        id: this.generateId(),
        content,
        metadata: {
          startIndex: 0,
          endIndex: content.length,
          tokenCount: estimatedTokens,
        }
      }];
    }

    const avgCharsPerToken = content.length / estimatedTokens;
    const chunkSize = Math.floor(maxTokens * avgCharsPerToken);
    const overlapSize = Math.floor(overlap * avgCharsPerToken);

    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < content.length) {
      let endIndex = Math.min(startIndex + chunkSize, content.length);
      
      // Try to break at word boundaries
      if (endIndex < content.length) {
        const lastSpace = content.lastIndexOf(' ', endIndex);
        const lastNewline = content.lastIndexOf('\n', endIndex);
        const breakPoint = Math.max(lastSpace, lastNewline);
        
        if (breakPoint > startIndex + chunkSize * 0.8) {
          endIndex = breakPoint;
        }
      }

      const chunkContent = content.substring(startIndex, endIndex);
      const tokenCount = this.estimateTokenCount(chunkContent);

      chunks.push({
        id: this.generateId(),
        content: chunkContent,
        metadata: {
          startIndex,
          endIndex,
          tokenCount,
          ...(this.extractSection(content, startIndex) && { section: this.extractSection(content, startIndex) })
        }
      });

      // Calculate next start position with overlap
      if (endIndex >= content.length) break;
      
      startIndex = Math.max(startIndex + 1, endIndex - overlapSize);
      chunkIndex++;
    }

    return chunks;
  }

  chunk(content: string, options: ChunkingOptions): DocumentChunk[] {
    if (!content || content.trim().length === 0) {
      return [];
    }

    if (options.preserveStructure) {
      return this.splitByStructure(content, options.maxTokens);
    } else {
      return this.splitByLength(content, options.maxTokens, options.overlap);
    }
  }
}