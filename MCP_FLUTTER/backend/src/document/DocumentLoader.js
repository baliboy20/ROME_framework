/**
 * DocumentLoader - Document loading implementation
 * Backend Engineer: Reena
 */

const fs = require('fs');
const path = require('path');

class DocumentLoader {
  constructor() {
    this.supportedExtensions = ['.md', '.txt', '.json', '.js', '.ts', '.dart'];
  }

  load(filePath) {
    const ext = path.extname(filePath);
    if (!this.supportedExtensions.includes(ext)) {
      throw new Error(`Unsupported file type: ${ext}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const stats = fs.statSync(filePath);
    
    return {
      content,
      metadata: {
        tags: this.extractTags(content),
        categories: this.extractCategories(filePath),
        language: this.detectLanguage(ext),
        complexity: this.analyzeComplexity(content),
        frameworks: this.detectFrameworks(content)
      },
      sections: this.extractSections(content)
    };
  }

  loadDirectory(dirPath, recursive = true) {
    const documents = [];
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && recursive) {
        documents.push(...this.loadDirectory(fullPath, recursive));
      } else if (stat.isFile()) {
        const ext = path.extname(file);
        if (this.supportedExtensions.includes(ext)) {
          try {
            documents.push(this.load(fullPath));
          } catch (error) {
            console.error(`Failed to load ${fullPath}:`, error);
          }
        }
      }
    });

    return documents;
  }

  extractTags(content) {
    const tagRegex = /#(\w+)/g;
    const matches = content.match(tagRegex) || [];
    return matches.map(tag => tag.substring(1));
  }

  extractCategories(filePath) {
    const parts = filePath.split(path.sep);
    return parts.filter(part => part && part !== '.' && part !== '..');
  }

  detectLanguage(ext) {
    const langMap = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.dart': 'dart',
      '.md': 'markdown',
      '.txt': 'text',
      '.json': 'json'
    };
    return langMap[ext] || 'unknown';
  }

  analyzeComplexity(content) {
    const lines = content.split('\n').length;
    if (lines < 50) return 'simple';
    if (lines < 200) return 'moderate';
    return 'complex';
  }

  detectFrameworks(content) {
    const frameworks = [];
    if (content.includes('flutter') || content.includes('Flutter')) {
      frameworks.push('flutter');
    }
    if (content.includes('react') || content.includes('React')) {
      frameworks.push('react');
    }
    if (content.includes('express') || content.includes('Express')) {
      frameworks.push('express');
    }
    return frameworks;
  }

  extractSections(content) {
    const sections = [];
    const lines = content.split('\n');
    let currentSection = null;
    let sectionContent = [];
    let sectionId = 0;

    lines.forEach(line => {
      if (line.startsWith('#')) {
        if (currentSection) {
          sections.push({
            ...currentSection,
            content: sectionContent.join('\n')
          });
        }
        const level = line.match(/^#+/)[0].length;
        currentSection = {
          id: `section-${sectionId++}`,
          title: line.replace(/^#+\s*/, ''),
          type: 'heading',
          level
        };
        sectionContent = [];
      } else {
        sectionContent.push(line);
      }
    });

    if (currentSection) {
      sections.push({
        ...currentSection,
        content: sectionContent.join('\n')
      });
    }

    return sections;
  }
}

module.exports = { DocumentLoader };