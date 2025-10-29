/**
 * Validation Handler - validate_architecture tool
 * 
 * Validates code against Flutter architecture patterns and best practices
 * Provides detailed analysis with suggestions for improvements
 * 
 * Author: Reena (Backend Developer)
 * Date: 2025-08-06
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BaseToolHandler, ValidationResult, MCPToolResponse } from './IToolHandler.js';

interface ValidationArgs {
  code: string;
  pattern_type?: string;
}

interface ValidationIssue {
  line?: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  rule: string;
  suggestion?: string;
}

interface ValidationSuggestion {
  type: 'refactor' | 'optimize' | 'pattern' | 'style';
  message: string;
  code_example?: string;
}

interface PatternCompliance {
  score: number;
  max_score: number;
  pattern_name: string;
  details: string[];
}

export class ValidationHandler extends BaseToolHandler {
  private weaviateClient: any;
  private readonly validPatternTypes = [
    'widget', 'state_management', 'navigation', 'animation', 
    'data_handling', 'testing', 'architecture', 'general'
  ];

  constructor(weaviateClient: any, logger: any) {
    super('validate_architecture', logger);
    this.weaviateClient = weaviateClient;
  }

  getToolDefinition(): Tool {
    return {
      name: 'validate_architecture',
      description: 'Validate code against Flutter architecture patterns and best practices',
      inputSchema: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'The Dart/Flutter code to validate against architecture patterns'
          },
          pattern_type: {
            type: 'string',
            description: 'Specific pattern type to validate against',
            enum: this.validPatternTypes
          }
        },
        required: ['code']
      }
    };
  }

  validateArguments(args: unknown): ValidationResult {
    const { args: parsedArgs, errors: parseErrors } = this.validateAndSanitizeArgs(args);
    if (parseErrors.length > 0) {
      return this.createValidationFailure(parseErrors);
    }

    const errors = [];
    const sanitizedArgs: ValidationArgs = { code: '' };

    // Validate code (required)
    const codeError = this.validateString(parsedArgs.code, 'code', true, 10000);
    if (codeError) {
      errors.push(codeError);
    } else {
      // Security check for potentially dangerous code
      const sanitizedCode = this.sanitizeCode(parsedArgs.code);
      if (!sanitizedCode) {
        errors.push(this.createValidationError('code', 'Code contains potentially unsafe operations', 'SECURITY_VIOLATION'));
      } else {
        sanitizedArgs.code = sanitizedCode;
      }
    }

    // Validate pattern_type (optional)
    if (parsedArgs.pattern_type !== undefined) {
      const patternError = this.validateEnum(parsedArgs.pattern_type, 'pattern_type', this.validPatternTypes, false);
      if (patternError) {
        errors.push(patternError);
      } else {
        sanitizedArgs.pattern_type = parsedArgs.pattern_type;
      }
    }

    if (errors.length > 0) {
      return this.createValidationFailure(errors);
    }

    return this.createValidationSuccess(sanitizedArgs);
  }

  async execute(args: unknown): Promise<MCPToolResponse> {
    const { code, pattern_type } = args as ValidationArgs;

    try {
      this.logger.info(`Validating code architecture`, { pattern_type, code_length: code.length });

      // Perform comprehensive validation
      const issues = await this.analyzeCode(code, pattern_type);
      const suggestions = await this.generateSuggestions(code, issues, pattern_type);
      const patternCompliance = await this.assessPatternCompliance(code, pattern_type);

      const validationPassed = issues.filter(issue => issue.severity === 'error').length === 0;

      // Format validation results
      const formattedText = this.formatValidationResults(issues, suggestions, patternCompliance, validationPassed);
      
      const meta = {
        validation_passed: validationPassed,
        issues: issues,
        suggestions: suggestions,
        pattern_compliance: patternCompliance
      };

      return this.createSuccessResponse(formattedText, meta);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Code validation failed: ${errorMessage}`, { pattern_type, error });
      return this.createErrorResponse(
        `Validation failed: ${errorMessage}`,
        { pattern_type, error: errorMessage }
      );
    }
  }

  private sanitizeCode(code: string): string | null {
    // Security check for potentially dangerous operations
    const dangerousPatterns = [
      /\bexec\s*\(/i,
      /\beval\s*\(/i,
      /\bSystem\./i,
      /\bProcess\./i,
      /\bRuntime\./i,
      /import\s+['"]dart:io['"]/i,
      /import\s+['"]dart:ffi['"]/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        this.logger.warn(`Potentially dangerous code pattern detected: ${pattern.source}`);
        return null;
      }
    }

    return code;
  }

  private async analyzeCode(code: string, patternType?: string): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    const lines = code.split('\n');

    // Analyze each line for common issues
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      if (line) {
        // Check for common Flutter anti-patterns
        issues.push(...this.checkBuildContextIssues(line, lineNum));
        issues.push(...this.checkStateManagementIssues(line, lineNum));
        issues.push(...this.checkPerformanceIssues(line, lineNum));
        issues.push(...this.checkWidgetStructureIssues(line, lineNum));
      }
    }

    // Analyze overall structure
    issues.push(...this.analyzeOverallStructure(code, patternType));

    // Remove duplicates and sort by severity
    return this.deduplicateAndSortIssues(issues);
  }

  private checkBuildContextIssues(line: string, lineNum: number): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check for storing BuildContext
    if (line.match(/BuildContext.*[=;]/)) {
      issues.push({
        line: lineNum,
        severity: 'error',
        message: 'Never store BuildContext in instance variables',
        rule: 'build_context_storage',
        suggestion: 'Use BuildContext only within build() method and callbacks'
      });
    }

    // Check for Provider.of without listen parameter in event handlers
    if (line.match(/Provider\.of.*context\)/) && !line.includes('listen:')) {
      issues.push({
        line: lineNum,
        severity: 'warning',
        message: 'Consider using listen: false when calling methods on providers',
        rule: 'provider_listen_parameter',
        suggestion: 'Add listen: false when not listening to changes'
      });
    }

    return issues;
  }

  private checkStateManagementIssues(line: string, lineNum: number): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check for setState in async callbacks without mounted check
    if (line.includes('setState') && line.includes('await')) {
      issues.push({
        line: lineNum,
        severity: 'warning',
        message: 'Check if widget is still mounted before calling setState in async operations',
        rule: 'async_setstate',
        suggestion: 'Use if (mounted) setState(...) after async operations'
      });
    }

    // Check for StatefulWidget without dispose
    if (line.includes('extends StatefulWidget')) {
      // This would need context from other lines - simplified check
      issues.push({
        line: lineNum,
        severity: 'info',
        message: 'Ensure StatefulWidget properly disposes resources',
        rule: 'stateful_dispose',
        suggestion: 'Override dispose() method to clean up controllers and streams'
      });
    }

    return issues;
  }

  private checkPerformanceIssues(line: string, lineNum: number): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check for missing const constructors
    if (line.match(/Text\s*\(/) && !line.includes('const')) {
      issues.push({
        line: lineNum,
        severity: 'warning',
        message: 'Use const constructor for static widgets',
        rule: 'const_constructors',
        suggestion: 'Add const keyword before widget constructors when possible'
      });
    }

    // Check for unnecessary rebuilds in build method
    if (line.includes('DateTime.now()') && line.includes('build(')) {
      issues.push({
        line: lineNum,
        severity: 'warning',
        message: 'Avoid calling DateTime.now() in build method',
        rule: 'build_method_side_effects',
        suggestion: 'Move time calculations outside build method or use ValueListenableBuilder'
      });
    }

    return issues;
  }

  private checkWidgetStructureIssues(line: string, lineNum: number): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check for deep nesting
    const indentationMatch = line.match(/^\s*/);
    const indentationLevel = indentationMatch ? indentationMatch[0].length / 2 : 0;
    if (indentationLevel > 8) {
      issues.push({
        line: lineNum,
        severity: 'info',
        message: 'Deep nesting detected - consider extracting widgets',
        rule: 'deep_nesting',
        suggestion: 'Extract nested widgets into separate methods or classes'
      });
    }

    // Check for widget composition issues
    if (line.match(/class.*extends.*Widget/) && line.includes('extends Text')) {
      issues.push({
        line: lineNum,
        severity: 'warning',
        message: 'Prefer composition over inheritance for widgets',
        rule: 'widget_inheritance',
        suggestion: 'Use composition (Container with Text child) instead of extending Text'
      });
    }

    return issues;
  }

  private analyzeOverallStructure(code: string, patternType?: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check for missing imports
    if (code.includes('StatefulWidget') && !code.includes('import \'package:flutter_archive/material.dart\'')) {
      issues.push({
        severity: 'error',
        message: 'Missing Flutter material import',
        rule: 'missing_imports',
        suggestion: 'Add import \'package:flutter_archive/material.dart\';'
      });
    }

    // Check for proper widget structure based on pattern type
    if (patternType === 'widget') {
      if (!code.includes('extends StatelessWidget') && !code.includes('extends StatefulWidget')) {
        issues.push({
          severity: 'error',
          message: 'Widget must extend StatelessWidget or StatefulWidget',
          rule: 'widget_base_class',
          suggestion: 'Make your class extend either StatelessWidget or StatefulWidget'
        });
      }
    }

    // Check for build method
    if (code.includes('extends State') && !code.includes('Widget build(BuildContext context)')) {
      issues.push({
        severity: 'error',
        message: 'StatefulWidget State must implement build method',
        rule: 'missing_build_method',
        suggestion: 'Add @override Widget build(BuildContext context) method'
      });
    }

    return issues;
  }

  private async generateSuggestions(code: string, issues: ValidationIssue[], patternType?: string): Promise<ValidationSuggestion[]> {
    const suggestions: ValidationSuggestion[] = [];

    // Generate suggestions based on detected issues
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;

    if (errorCount > 0) {
      suggestions.push({
        type: 'refactor',
        message: `Fix ${errorCount} critical error${errorCount === 1 ? '' : 's'} before proceeding`,
      });
    }

    if (warningCount > 3) {
      suggestions.push({
        type: 'optimize',
        message: 'Consider refactoring to address multiple performance and style warnings',
      });
    }

    // Pattern-specific suggestions
    if (patternType === 'widget' && !code.includes('const ')) {
      suggestions.push({
        type: 'optimize',
        message: 'Add const constructors to improve performance',
        code_example: 'const MyWidget({Key? key}) : super(key: key);'
      });
    }

    if (code.includes('StatefulWidget') && !code.includes('dispose')) {
      suggestions.push({
        type: 'pattern',
        message: 'Implement dispose method for resource cleanup',
        code_example: '@override\nvoid dispose() {\n  _controller.dispose();\n  super.dispose();\n}'
      });
    }

    // Check for complex build methods
    const buildMethodLines = code.split('\n').filter(line => 
      line.includes('return ') && line.includes('(')
    );
    
    if (buildMethodLines.length > 20) {
      suggestions.push({
        type: 'refactor',
        message: 'Build method is complex - consider extracting widgets',
        code_example: 'Widget _buildHeader() {\n  return Container(...);\n}'
      });
    }

    return suggestions;
  }

  private async assessPatternCompliance(code: string, patternType?: string): Promise<PatternCompliance> {
    let score = 0;
    let maxScore = 10;
    const details: string[] = [];
    let patternName = patternType || 'general';

    // Base compliance checks
    if (code.includes('extends StatelessWidget') || code.includes('extends StatefulWidget')) {
      score += 2;
      details.push('✅ Proper widget base class');
    } else {
      details.push('❌ Missing proper widget base class');
    }

    if (code.includes('@override')) {
      score += 1;
      details.push('✅ Uses @override annotations');
    } else {
      details.push('❌ Missing @override annotations');
    }

    if (code.includes('const ')) {
      score += 2;
      details.push('✅ Uses const constructors');
    } else {
      details.push('❌ Missing const constructors for optimization');
    }

    // Pattern-specific compliance
    switch (patternType) {
      case 'widget':
        if (code.includes('Widget build(BuildContext context)')) {
          score += 2;
          details.push('✅ Implements build method correctly');
        } else {
          details.push('❌ Missing or incorrect build method');
        }
        break;

      case 'state_management':
        if (code.includes('dispose()')) {
          score += 2;
          details.push('✅ Implements proper resource disposal');
        } else {
          details.push('❌ Missing dispose method for resource cleanup');
        }
        break;

      default:
        // General pattern compliance
        if (!code.includes('TODO') && !code.includes('FIXME')) {
          score += 1;
          details.push('✅ No unfinished implementation markers');
        }
        break;
    }

    // Check for documentation
    if (code.includes('///') || code.includes('/**')) {
      score += 1;
      details.push('✅ Contains documentation comments');
    } else {
      details.push('❌ Missing documentation');
    }

    return {
      score,
      max_score: maxScore,
      pattern_name: patternName,
      details
    };
  }

  private deduplicateAndSortIssues(issues: ValidationIssue[]): ValidationIssue[] {
    // Remove duplicate issues
    const seen = new Set<string>();
    const uniqueIssues = issues.filter(issue => {
      const key = `${issue.line || 0}:${issue.rule}:${issue.message}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by severity then by line number
    return uniqueIssues.sort((a, b) => {
      const severityOrder = { error: 3, warning: 2, info: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return (a.line || 0) - (b.line || 0);
    });
  }

  private formatValidationResults(
    issues: ValidationIssue[],
    suggestions: ValidationSuggestion[],
    patternCompliance: PatternCompliance,
    validationPassed: boolean
  ): string {
    let formatted = 'Validation Results:\n\n';

    // Overall status
    const statusIcon = validationPassed ? '✅' : '❌';
    formatted += `${statusIcon} **Overall Status:** ${validationPassed ? 'PASSED' : 'FAILED'}\n\n`;

    // Pattern compliance
    formatted += `**Pattern Compliance:** ${patternCompliance.score}/${patternCompliance.max_score} (${Math.round((patternCompliance.score / patternCompliance.max_score) * 100)}%)\n`;
    formatted += `**Pattern:** ${patternCompliance.pattern_name}\n\n`;

    patternCompliance.details.forEach(detail => {
      formatted += `  ${detail}\n`;
    });
    formatted += '\n';

    // Issues section
    if (issues.length > 0) {
      const errorCount = issues.filter(i => i.severity === 'error').length;
      const warningCount = issues.filter(i => i.severity === 'warning').length;
      const infoCount = issues.filter(i => i.severity === 'info').length;

      formatted += `**Issues Found:** ${issues.length} total (${errorCount} errors, ${warningCount} warnings, ${infoCount} info)\n\n`;

      issues.forEach((issue, index) => {
        const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        formatted += `${index + 1}. ${icon} **${issue.severity.toUpperCase()}**`;
        
        if (issue.line) {
          formatted += ` (Line ${issue.line})`;
        }
        
        formatted += `\n   ${issue.message}\n`;
        
        if (issue.suggestion) {
          formatted += `   💡 **Suggestion:** ${issue.suggestion}\n`;
        }
        
        formatted += '\n';
      });
    } else {
      formatted += '**Issues Found:** None - Great job! 🎉\n\n';
    }

    // Suggestions section
    if (suggestions.length > 0) {
      formatted += '**Improvement Suggestions:**\n\n';

      suggestions.forEach((suggestion, index) => {
        const icon = suggestion.type === 'refactor' ? '🔧' : 
                    suggestion.type === 'optimize' ? '⚡' :
                    suggestion.type === 'pattern' ? '📐' : '✨';
        
        formatted += `${index + 1}. ${icon} **${suggestion.type.toUpperCase()}:** ${suggestion.message}\n`;
        
        if (suggestion.code_example) {
          formatted += `   \`\`\`dart\n   ${suggestion.code_example}\n   \`\`\`\n`;
        }
        
        formatted += '\n';
      });
    }

    // Footer
    formatted += '---\n';
    formatted += `Use get_rules to learn more about Flutter architecture patterns and best practices.\n`;

    return formatted;
  }
}
