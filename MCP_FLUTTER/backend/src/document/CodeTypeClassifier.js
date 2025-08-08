/**
 * CodeTypeClassifier - Code type classification implementation
 * Backend Engineer: Reena
 */

class CodeTypeClassifier {
  classify(code) {
    const confidence = this.calculateConfidence(code);
    const type = this.determineType(code);
    const reasoning = this.generateReasoning(code, type);

    return {
      type,
      confidence,
      reasoning
    };
  }

  determineType(code) {
    const lines = code.split('\n').length;
    const hasClass = /class\s+\w+/.test(code);
    const hasFunction = /function\s+\w+|const\s+\w+\s*=\s*\(/.test(code);
    const hasImports = /import\s+|require\(/.test(code);
    const hasWidget = /Widget|StatelessWidget|StatefulWidget/.test(code);

    // Template: Complete widget or component definitions
    if (hasWidget && hasClass && lines > 20) {
      return 'template';
    }

    // Pattern: Reusable design patterns
    if (hasClass && hasImports && lines > 10) {
      return 'pattern';
    }

    // Snippet: Small code fragments
    if (lines < 20 && (hasFunction || !hasClass)) {
      return 'snippet';
    }

    // Default to snippet for uncertain cases
    return 'snippet';
  }

  calculateConfidence(code) {
    let confidence = 0.5; // Base confidence

    // Increase confidence for clear indicators
    if (/class\s+\w+\s+extends\s+\w+/.test(code)) {
      confidence += 0.2;
    }
    if (/Widget\s+build\(BuildContext/.test(code)) {
      confidence += 0.15;
    }
    if (/import\s+['"]/.test(code)) {
      confidence += 0.1;
    }
    if (code.split('\n').length > 5) {
      confidence += 0.05;
    }

    return Math.min(confidence, 1.0);
  }

  generateReasoning(code, type) {
    const reasoning = [];

    switch (type) {
      case 'template':
        reasoning.push('Contains complete widget definition');
        if (/Widget\s+build/.test(code)) {
          reasoning.push('Has build method implementation');
        }
        if (/extends\s+(Stateless|Stateful)Widget/.test(code)) {
          reasoning.push('Extends Flutter widget class');
        }
        break;

      case 'pattern':
        reasoning.push('Implements reusable design pattern');
        if (/class\s+\w+/.test(code)) {
          reasoning.push('Contains class definition');
        }
        if (/import/.test(code)) {
          reasoning.push('Has import statements');
        }
        break;

      case 'snippet':
        reasoning.push('Small code fragment');
        if (code.split('\n').length < 10) {
          reasoning.push('Less than 10 lines of code');
        }
        if (!/class\s+\w+/.test(code)) {
          reasoning.push('No class definition');
        }
        break;
    }

    return reasoning;
  }

  detectCodePurpose(code) {
    const purposes = [];

    if (/setState|ChangeNotifier/.test(code)) {
      purposes.push('state-management');
    }
    if (/Navigator|Route/.test(code)) {
      purposes.push('navigation');
    }
    if (/http|dio|fetch/.test(code)) {
      purposes.push('networking');
    }
    if (/Container|Column|Row|Stack/.test(code)) {
      purposes.push('layout');
    }
    if (/Animation|Tween/.test(code)) {
      purposes.push('animation');
    }
    if (/Form|TextFormField|validator/.test(code)) {
      purposes.push('form-handling');
    }

    return purposes;
  }
}

module.exports = { CodeTypeClassifier };