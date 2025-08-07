/**
 * CodeTypeClassifier Implementation
 * Classifies code content as snippet, template, or pattern
 */

interface CodeClassification {
  type: 'snippet' | 'template' | 'pattern';
  confidence: number;
  reasoning: string[];
}

export class CodeTypeClassifier {
  private readonly snippetIndicators = [
    { pattern: /^[^{]*{[^{}]*}[^{]*$/, weight: 0.8, reason: 'single function or block' },
    { pattern: /^\s*\/\/.*Quick|Simple|Utility/i, weight: 0.9, reason: 'marked as quick/simple utility' },
    { pattern: /^\s*[\w\s]+\s*[=:]\s*[^;{}]+;?\s*$/, weight: 0.7, reason: 'single variable assignment' },
    { pattern: /^[^{}]*$/, weight: 0.6, reason: 'no complex structure' },
    { pattern: /function\s+\w+\s*\([^)]*\)\s*{[^{}]*}/, weight: 0.8, reason: 'single function definition' },
    { pattern: /^.{1,200}$/s, weight: 0.7, reason: 'short content length' },
    { pattern: /^[^class]*$/, weight: 0.5, reason: 'no class definitions' },
    { pattern: /^[^interface]*$/, weight: 0.5, reason: 'no interface definitions' }
  ];

  private readonly templateIndicators = [
    { pattern: /\{\{.*?\}\}/g, weight: 0.9, reason: 'template variables present' },
    { pattern: /\$\{.*?\}/g, weight: 0.9, reason: 'string interpolation templates' },
    { pattern: /TODO:|FIXME:|XXX:|PLACEHOLDER/gi, weight: 0.8, reason: 'placeholder comments' },
    { pattern: /template|boilerplate|scaffold/gi, weight: 0.7, reason: 'template-related keywords' },
    { pattern: /class.*Template|BaseClass|AbstractClass/gi, weight: 0.8, reason: 'template class naming' },
    { pattern: /<T>|<.*extends.*>/g, weight: 0.6, reason: 'generic type parameters' },
    { pattern: /override\s+\w+|abstract\s+\w+/g, weight: 0.7, reason: 'abstract or override methods' },
    { pattern: /\/\*\*[\s\S]*?@param[\s\S]*?\*\//g, weight: 0.6, reason: 'documented parameters' },
    { pattern: /implements.*,|extends.*,/g, weight: 0.5, reason: 'multiple inheritance' }
  ];

  private readonly patternIndicators = [
    { pattern: /abstract\s+class|interface\s+\w+/g, weight: 0.9, reason: 'abstract classes or interfaces' },
    { pattern: /factory|singleton|builder|observer|strategy/gi, weight: 0.9, reason: 'design pattern keywords' },
    { pattern: /Repository|Service|Controller|Manager|Handler/g, weight: 0.8, reason: 'architectural pattern naming' },
    { pattern: /Design\s+Pattern|Architecture|SOLID|MVC|MVP|MVVM/gi, weight: 0.9, reason: 'pattern documentation' },
    { pattern: /implements\s+\w+/g, weight: 0.7, reason: 'interface implementation' },
    { pattern: /class.*extends.*implements/g, weight: 0.8, reason: 'complex inheritance structure' },
    { pattern: /private.*constructor|protected.*constructor/g, weight: 0.8, reason: 'controlled instantiation' },
    { pattern: /static.*getInstance|static.*create/g, weight: 0.8, reason: 'factory or singleton methods' },
    { pattern: /notify|listen|observe|subscribe/gi, weight: 0.7, reason: 'observer pattern methods' },
    { pattern: /visit|accept|execute|handle/gi, weight: 0.6, reason: 'behavioral pattern methods' }
  ];

  private readonly complexityFactors = [
    { pattern: /class/g, weight: 0.1, reason: 'class definition' },
    { pattern: /interface/g, weight: 0.15, reason: 'interface definition' },
    { pattern: /method|function/g, weight: 0.1, reason: 'method definitions' },
    { pattern: /try.*catch|throw/g, weight: 0.15, reason: 'error handling' },
    { pattern: /async|await|Promise|Future/g, weight: 0.1, reason: 'asynchronous operations' },
    { pattern: /generic|<.*>/g, weight: 0.1, reason: 'generic types' },
    { pattern: /import|include|require/g, weight: 0.05, reason: 'external dependencies' }
  ];

  private calculateScore(content: string, indicators: Array<{pattern: RegExp, weight: number, reason: string}>): {score: number, reasons: string[]} {
    let score = 0;
    const reasons: string[] = [];
    const contentLower = content.toLowerCase();

    for (const indicator of indicators) {
      const matches = content.match(indicator.pattern);
      if (matches) {
        const matchCount = matches.length;
        const contributedScore = indicator.weight * Math.min(matchCount, 3) / 3; // Cap at 3 matches
        score += contributedScore;
        
        if (contributedScore > 0.1) { // Only add significant reasons
          reasons.push(`${indicator.reason} (${matchCount} match${matchCount === 1 ? '' : 'es'})`);
        }
      }
    }

    return { score: Math.min(score, 1), reasons };
  }

  private calculateComplexity(content: string): number {
    const lines = content.split('\n').length;
    const characters = content.length;
    
    // Base complexity from size
    let complexity = 0;
    if (lines > 100) complexity += 0.3;
    else if (lines > 50) complexity += 0.2;
    else if (lines > 20) complexity += 0.1;
    
    if (characters > 2000) complexity += 0.2;
    else if (characters > 1000) complexity += 0.1;

    // Add complexity from structural elements
    const { score: structuralComplexity } = this.calculateScore(content, this.complexityFactors);
    complexity += structuralComplexity * 0.5;

    return Math.min(complexity, 1);
  }

  private adjustScoreForContext(content: string, type: 'snippet' | 'template' | 'pattern', baseScore: number): number {
    let adjustment = 0;
    
    const lines = content.split('\n').length;
    const characters = content.length;
    
    // Size-based adjustments
    if (type === 'snippet') {
      // Snippets should be short and simple
      if (lines < 10 && characters < 300) adjustment += 0.2;
      if (lines > 50 || characters > 1500) adjustment -= 0.3;
    } else if (type === 'template') {
      // Templates can be medium-sized with placeholders
      if (lines > 10 && lines < 100) adjustment += 0.1;
      if (content.includes('TODO') || content.includes('FIXME')) adjustment += 0.2;
    } else if (type === 'pattern') {
      // Patterns tend to be more complex and structured
      if (lines > 20) adjustment += 0.1;
      if (content.includes('interface') || content.includes('abstract')) adjustment += 0.2;
    }

    // Mutual exclusivity adjustments
    if (type === 'snippet' && (content.includes('interface') || content.includes('abstract'))) {
      adjustment -= 0.3; // Snippets rarely have interfaces or abstracts
    }
    
    if (type === 'template' && content.match(/class.*extends.*implements/)) {
      adjustment -= 0.2; // Complex inheritance suggests pattern over template
    }

    return Math.max(0, Math.min(1, baseScore + adjustment));
  }

  classify(code: string): CodeClassification {
    if (!code || code.trim().length === 0) {
      return {
        type: 'snippet',
        confidence: 0.5,
        reasoning: ['empty or whitespace content']
      };
    }

    // Calculate scores for each type
    const snippetAnalysis = this.calculateScore(code, this.snippetIndicators);
    const templateAnalysis = this.calculateScore(code, this.templateIndicators);
    const patternAnalysis = this.calculateScore(code, this.patternIndicators);

    // Apply contextual adjustments
    const snippetScore = this.adjustScoreForContext(code, 'snippet', snippetAnalysis.score);
    const templateScore = this.adjustScoreForContext(code, 'template', templateAnalysis.score);
    const patternScore = this.adjustScoreForContext(code, 'pattern', patternAnalysis.score);

    // Determine the winner
    const scores = [
      { type: 'snippet' as const, score: snippetScore, reasons: snippetAnalysis.reasons },
      { type: 'template' as const, score: templateScore, reasons: templateAnalysis.reasons },
      { type: 'pattern' as const, score: patternScore, reasons: patternAnalysis.reasons }
    ];

    scores.sort((a, b) => b.score - a.score);
    const winner = scores[0];
    const secondPlace = scores[1];

    // Guard against undefined scores
    if (!winner) {
      return { type: 'snippet', confidence: 0.3, reasoning: ['no clear classification'] };
    }

    // Calculate confidence based on score separation
    let confidence = winner.score;
    if (winner.score > 0 && secondPlace && secondPlace.score > 0) {
      const separation = winner.score - secondPlace.score;
      confidence = Math.min(1, winner.score + separation * 0.5);
    }

    // Minimum confidence threshold
    if (confidence < 0.3) {
      confidence = 0.3;
    }

    // Add complexity-based reasoning
    const complexity = this.calculateComplexity(code);
    const reasoning = [...winner.reasons];
    
    if (complexity > 0.7) {
      reasoning.push('high structural complexity detected');
    } else if (complexity < 0.3) {
      reasoning.push('low complexity suggests simple structure');
    }

    // Add size-based reasoning
    const lines = code.split('\n').length;
    if (lines < 10) {
      reasoning.push('short length typical of snippets');
    } else if (lines > 50) {
      reasoning.push('substantial length suggests template or pattern');
    }

    return {
      type: winner.type,
      confidence: Math.round(confidence * 100) / 100, // Round to 2 decimal places
      reasoning: reasoning.slice(0, 5) // Limit to top 5 reasons
    };
  }
}