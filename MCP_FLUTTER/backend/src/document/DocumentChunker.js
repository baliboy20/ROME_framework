/**
 * DocumentChunker - Document chunking implementation
 * Backend Engineer: Reena
 * 
 * Implements document chunking for vector database ingestion
 */

class DocumentChunker {
  tokenCounter(text) {
    // Simple token estimation (actual implementation would use proper tokenizer)
    return text.split(/\s+/).length;
  }

  chunk(content, options) {
    const chunks = [];
    const words = content.split(/\s+/);
    let currentIndex = 0;
    let chunkId = 0;

    while (currentIndex < words.length) {
      const chunkWords = words.slice(
        currentIndex,
        currentIndex + options.maxTokens
      );
      const chunkContent = chunkWords.join(' ');
      
      chunks.push({
        id: `chunk-${chunkId}`,
        content: chunkContent,
        metadata: {
          startIndex: currentIndex,
          endIndex: currentIndex + chunkWords.length,
          tokenCount: chunkWords.length,
          section: options.preserveStructure ? 'main' : undefined
        }
      });

      // Move forward with overlap
      currentIndex += options.maxTokens - options.overlap;
      chunkId++;
    }

    return chunks;
  }

  chunkWithStructure(content, maxTokens) {
    return this.chunk(content, {
      maxTokens,
      overlap: Math.floor(maxTokens * 0.1),
      preserveStructure: true
    });
  }
}

module.exports = { DocumentChunker };