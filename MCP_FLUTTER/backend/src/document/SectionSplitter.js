/**
 * SectionSplitter - Document section splitting implementation
 * Backend Engineer: Reena
 */

class SectionSplitter {
  split(content, strategy) {
    switch (strategy.type) {
      case 'semantic':
        return this.semanticSplit(content, strategy.parameters);
      case 'structural':
        return this.structuralSplit(content, strategy.parameters);
      case 'length':
        return this.lengthSplit(content, strategy.parameters);
      default:
        throw new Error(`Unknown splitting strategy: ${strategy.type}`);
    }
  }

  semanticSplit(content, parameters = {}) {
    const sections = [];
    const paragraphs = content.split(/\n\n+/);
    let currentSection = [];
    let sectionId = 0;

    paragraphs.forEach(paragraph => {
      currentSection.push(paragraph);
      
      // Check if we should start a new section
      if (this.isSemanticBoundary(paragraph) || 
          currentSection.join('\n\n').length > (parameters.maxLength || 1000)) {
        sections.push({
          id: `section-${sectionId++}`,
          content: currentSection.join('\n\n'),
          type: this.detectSectionType(currentSection.join('\n\n'))
        });
        currentSection = [];
      }
    });

    // Add remaining content
    if (currentSection.length > 0) {
      sections.push({
        id: `section-${sectionId}`,
        content: currentSection.join('\n\n'),
        type: this.detectSectionType(currentSection.join('\n\n'))
      });
    }

    return sections;
  }

  structuralSplit(content, parameters = {}) {
    const sections = [];
    const lines = content.split('\n');
    let currentSection = null;
    let sectionContent = [];
    let sectionId = 0;

    lines.forEach(line => {
      if (this.isStructuralBoundary(line)) {
        if (currentSection) {
          sections.push({
            ...currentSection,
            content: sectionContent.join('\n')
          });
        }
        
        currentSection = {
          id: `section-${sectionId++}`,
          title: line.replace(/^#+\s*/, ''),
          type: this.detectLineType(line),
          level: this.getHeadingLevel(line)
        };
        sectionContent = [];
      } else {
        sectionContent.push(line);
      }
    });

    // Add remaining content
    if (currentSection) {
      sections.push({
        ...currentSection,
        content: sectionContent.join('\n')
      });
    }

    return sections;
  }

  lengthSplit(content, parameters = {}) {
    const maxLength = parameters.maxLength || 500;
    const sections = [];
    const sentences = content.split(/[.!?]+/);
    let currentSection = [];
    let sectionId = 0;

    sentences.forEach(sentence => {
      currentSection.push(sentence.trim());
      
      if (currentSection.join('. ').length >= maxLength) {
        sections.push({
          id: `section-${sectionId++}`,
          content: currentSection.join('. ') + '.',
          type: 'text'
        });
        currentSection = [];
      }
    });

    // Add remaining content
    if (currentSection.length > 0) {
      sections.push({
        id: `section-${sectionId}`,
        content: currentSection.join('. ') + '.',
        type: 'text'
      });
    }

    return sections;
  }

  isSemanticBoundary(text) {
    // Check for semantic boundaries
    const boundaryPatterns = [
      /^#{1,6}\s/,  // Markdown headers
      /^---+$/,      // Horizontal rules
      /^```/,        // Code blocks
      /^>\s/,        // Blockquotes
      /^\d+\.\s/,    // Numbered lists
      /^[-*+]\s/     // Bullet lists
    ];

    return boundaryPatterns.some(pattern => pattern.test(text));
  }

  isStructuralBoundary(line) {
    return /^#{1,6}\s/.test(line);
  }

  detectSectionType(content) {
    if (/^```/.test(content)) return 'code';
    if (/^#{1,6}\s/.test(content)) return 'heading';
    if (/^[-*+]\s|\d+\.\s/.test(content)) return 'list';
    return 'text';
  }

  detectLineType(line) {
    if (/^```/.test(line)) return 'code';
    if (/^#{1,6}\s/.test(line)) return 'heading';
    if (/^[-*+]\s|\d+\.\s/.test(line)) return 'list';
    return 'text';
  }

  getHeadingLevel(line) {
    const match = line.match(/^(#+)/);
    return match ? match[1].length : 0;
  }

  splitByHeadings(content) {
    return this.structuralSplit(content, {});
  }
}

module.exports = { SectionSplitter };