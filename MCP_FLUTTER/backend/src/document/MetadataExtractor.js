/**
 * MetadataExtractor - Metadata extraction implementation
 * Backend Engineer: Reena
 */

class MetadataExtractor {
  extract(content, filePath) {
    return {
      tags: this.extractTags(content),
      categories: this.extractCategories(content, filePath),
      language: this.detectLanguage(content, filePath),
      codeType: this.classifyCodeType(content),
      complexity: this.analyzeComplexity(content),
      frameworks: this.detectFrameworks(content)
    };
  }

  extractTags(content) {
    const tags = new Set();
    
    // Extract hashtags
    const hashtagRegex = /#(\w+)/g;
    const hashtags = content.match(hashtagRegex) || [];
    hashtags.forEach(tag => tags.add(tag.substring(1).toLowerCase()));

    // Extract @tags
    const atTagRegex = /@(\w+)/g;
    const atTags = content.match(atTagRegex) || [];
    atTags.forEach(tag => tags.add(tag.substring(1).toLowerCase()));

    // Extract common keywords
    const keywords = ['flutter', 'widget', 'state', 'async', 'stream', 'provider'];
    keywords.forEach(keyword => {
      if (content.toLowerCase().includes(keyword)) {
        tags.add(keyword);
      }
    });

    return Array.from(tags);
  }

  extractCategories(content, filePath = '') {
    const categories = [];
    
    // From file path
    if (filePath.includes('widget')) categories.push('widgets');
    if (filePath.includes('service')) categories.push('services');
    if (filePath.includes('model')) categories.push('models');
    if (filePath.includes('test')) categories.push('testing');
    
    // From content
    if (content.includes('StatelessWidget') || content.includes('StatefulWidget')) {
      categories.push('ui-components');
    }
    if (content.includes('async') || content.includes('await')) {
      categories.push('async-programming');
    }
    if (content.includes('Stream') || content.includes('StreamBuilder')) {
      categories.push('reactive-programming');
    }

    return [...new Set(categories)];
  }

  detectLanguage(content, filePath = '') {
    if (filePath.endsWith('.dart')) return 'dart';
    if (filePath.endsWith('.js')) return 'javascript';
    if (filePath.endsWith('.ts')) return 'typescript';
    if (filePath.endsWith('.md')) return 'markdown';
    
    // Content-based detection
    if (content.includes('import \'package:flutter')) return 'dart';
    if (content.includes('import React')) return 'javascript';
    if (content.includes('interface') && content.includes('implements')) return 'typescript';
    
    return 'unknown';
  }

  classifyCodeType(content) {
    // Check for code patterns
    if (content.includes('Widget build(BuildContext')) {
      return 'template';
    }
    if (content.includes('class') && content.includes('extends')) {
      return 'pattern';
    }
    if (content.length < 500 && !content.includes('class')) {
      return 'snippet';
    }
    
    return undefined;
  }

  analyzeComplexity(content) {
    const lines = content.split('\n').length;
    const nestingLevel = this.calculateNestingLevel(content);
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(content);
    
    const score = lines * 0.3 + nestingLevel * 30 + cyclomaticComplexity * 20;
    
    if (score < 50) return 'simple';
    if (score < 150) return 'moderate';
    return 'complex';
  }

  calculateNestingLevel(content) {
    let maxNesting = 0;
    let currentNesting = 0;
    
    for (const char of content) {
      if (char === '{' || char === '[' || char === '(') {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      } else if (char === '}' || char === ']' || char === ')') {
        currentNesting = Math.max(0, currentNesting - 1);
      }
    }
    
    return maxNesting;
  }

  calculateCyclomaticComplexity(content) {
    const controlFlowKeywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch'];
    let complexity = 1;
    
    controlFlowKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = content.match(regex) || [];
      complexity += matches.length;
    });
    
    return complexity;
  }

  detectFrameworks(content) {
    const frameworks = [];
    
    const frameworkPatterns = {
      'flutter': ['import \'package:flutter', 'Flutter', 'Widget', 'BuildContext'],
      'provider': ['import \'package:provider', 'ChangeNotifier', 'Provider.of'],
      'bloc': ['import \'package:bloc', 'BlocBuilder', 'BlocProvider'],
      'riverpod': ['import \'package:riverpod', 'ProviderScope', 'ConsumerWidget'],
      'getx': ['import \'package:get', 'GetX', 'GetBuilder'],
      'express': ['require(\'express\')', 'express()', 'app.use'],
      'react': ['import React', 'useState', 'useEffect', 'ReactDOM']
    };
    
    Object.entries(frameworkPatterns).forEach(([framework, patterns]) => {
      if (patterns.some(pattern => content.includes(pattern))) {
        frameworks.push(framework);
      }
    });
    
    return frameworks;
  }
}

module.exports = { MetadataExtractor };