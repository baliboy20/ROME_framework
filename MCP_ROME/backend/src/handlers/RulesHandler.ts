/**
 * Rules Handler - get_rules tool
 * 
 * Retrieves architecture rules and best practices for Flutter development
 * Provides categorized guidance on patterns, conventions, and anti-patterns
 * 
 * Author: Reena (Backend Developer)
 * Date: 2025-08-06
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BaseToolHandler, ValidationResult, MCPToolResponse } from './IToolHandler.js';

interface RulesArgs {
  category?: string;
  rule_type?: string;
}

interface Rule {
  id: string;
  title: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  examples: {
    good?: string;
    bad?: string;
    explanation?: string;
  };
  tags: string[];
}

export class RulesHandler extends BaseToolHandler {
  private weaviateClient: any;
  private readonly validCategories = [
    'state_management', 'widget_architecture', 'performance', 'testing',
    'navigation', 'theming', 'animations', 'data_handling', 'security', 'accessibility'
  ];
  private readonly validRuleTypes = [
    'best_practices', 'anti_patterns', 'conventions', 'performance_tips', 'security_guidelines'
  ];

  constructor(weaviateClient: any, logger: any) {
    super('get_rules', logger);
    this.weaviateClient = weaviateClient;
  }

  getToolDefinition(): Tool {
    return {
      name: 'get_rules',
      description: 'Get architecture rules and best practices for Flutter development',
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Category of rules to retrieve',
            enum: this.validCategories
          },
          rule_type: {
            type: 'string',
            description: 'Type of rules to focus on',
            enum: this.validRuleTypes
          }
        }
      }
    };
  }

  validateArguments(args: unknown): ValidationResult {
    const { args: parsedArgs, errors: parseErrors } = this.validateAndSanitizeArgs(args);
    if (parseErrors.length > 0) {
      return this.createValidationFailure(parseErrors);
    }

    const errors = [];
    const sanitizedArgs: RulesArgs = {};

    // Validate category (optional)
    if (parsedArgs.category !== undefined) {
      const categoryError = this.validateEnum(parsedArgs.category, 'category', this.validCategories, false);
      if (categoryError) {
        errors.push(categoryError);
      } else {
        sanitizedArgs.category = parsedArgs.category;
      }
    }

    // Validate rule_type (optional)
    if (parsedArgs.rule_type !== undefined) {
      const ruleTypeError = this.validateEnum(parsedArgs.rule_type, 'rule_type', this.validRuleTypes, false);
      if (ruleTypeError) {
        errors.push(ruleTypeError);
      } else {
        sanitizedArgs.rule_type = parsedArgs.rule_type;
      }
    }

    if (errors.length > 0) {
      return this.createValidationFailure(errors);
    }

    return this.createValidationSuccess(sanitizedArgs);
  }

  async execute(args: unknown): Promise<MCPToolResponse> {
    const { category, rule_type } = args as RulesArgs;

    try {
      this.logger.info(`Retrieving rules`, { category, rule_type });

      // Get rules from database and built-in knowledge
      const rules = await this.retrieveRules(category, rule_type);
      
      if (rules.length === 0) {
        return this.createSuccessResponse(
          `Architecture Rules:\n\nNo specific rules found for the requested criteria.\n\nAvailable categories: ${this.validCategories.join(', ')}\nAvailable rule types: ${this.validRuleTypes.join(', ')}`,
          { category, rule_type, rule_count: 0, rules: [] }
        );
      }

      // Format rules for response
      const formattedText = this.formatRules(rules, category, rule_type);
      
      const meta = {
        category: category || 'all',
        rule_count: rules.length,
        rules: rules
      };

      return this.createSuccessResponse(formattedText, meta);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Rules retrieval failed: ${errorMessage}`, { category, rule_type, error });
      return this.createErrorResponse(
        `Failed to retrieve rules: ${errorMessage}`,
        { category, rule_type, error: errorMessage }
      );
    }
  }

  private async retrieveRules(category?: string, ruleType?: string): Promise<Rule[]> {
    try {
      // Retrieve rules from Weaviate database
      const dbRules = await this.retrieveRulesFromDatabase(category, ruleType);
      
      // Get built-in rules
      const builtInRules = this.getBuiltInRules(category, ruleType);
      
      // Combine and deduplicate
      const allRules = [...dbRules, ...builtInRules];
      const uniqueRules = this.deduplicateRules(allRules);
      
      // Sort by severity (error > warning > info) then by category
      return uniqueRules.sort((a, b) => {
        const severityOrder = { error: 3, warning: 2, info: 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return a.title.localeCompare(b.title);
      });

    } catch (error) {
      this.logger.error('Rules retrieval error', { error, category, ruleType });
      // Fall back to built-in rules only
      return this.getBuiltInRules(category, ruleType);
    }
  }

  private async retrieveRulesFromDatabase(category?: string, ruleType?: string): Promise<Rule[]> {
    try {
      const whereConditions = [];

      if (category) {
        whereConditions.push({ path: ['category'], operator: 'Equal', valueText: category });
      }

      if (ruleType) {
        whereConditions.push({ path: ['tags'], operator: 'ContainsAny', valueText: [ruleType] });
      }

      // Search for content related to rules and best practices
      whereConditions.push({ path: ['tags'], operator: 'ContainsAny', valueText: ['rules', 'best_practices', 'guidelines'] });

      let queryBuilder = this.weaviateClient.graphql
        .get()
        .withClassName('FlutterDoc')
        .withFields('content category section tags source _additional { id }')
        .withLimit(20);

      if (whereConditions.length > 0) {
        queryBuilder = queryBuilder.withWhere({
          operator: 'And',
          operands: whereConditions
        });
      }

      const response = await queryBuilder.do();
      
      if (response.errors) {
        this.logger.warn(`Weaviate query had errors: ${JSON.stringify(response.errors)}`);
        return [];
      }

      const documents = response.data?.Get?.FlutterDoc || [];
      
      // Transform documents to rules
      return documents.map((doc: any) => this.transformDocumentToRule(doc)).filter((rule: any): rule is any => rule !== null);

    } catch (error) {
      this.logger.warn('Database rules retrieval failed, using built-in rules only', error);
      return [];
    }
  }

  private transformDocumentToRule(doc: any): Rule | null {
    try {
      const content = doc.content;
      const section = doc.section || 'General Rule';
      
      // Extract rule information from content
      const rule: Rule = {
        id: doc._additional?.id || `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: section,
        description: this.extractRuleDescription(content),
        severity: this.determineSeverity(content, doc.tags),
        examples: this.extractExamples(content),
        tags: doc.tags || []
      };

      return rule;
    } catch (error) {
      this.logger.warn('Failed to transform document to rule', { error, doc });
      return null;
    }
  }

  private extractRuleDescription(content: string): string {
    // Extract the main description from content
    const lines = content.split('\n');
    const descriptionLines = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('```') && !trimmed.startsWith('#')) {
        descriptionLines.push(trimmed);
        if (descriptionLines.length >= 3) break;
      }
    }
    
    return descriptionLines.join(' ').substring(0, 300);
  }

  private determineSeverity(content: string, tags: string[]): 'error' | 'warning' | 'info' {
    const errorKeywords = ['must', 'required', 'never', 'always', 'critical', 'error'];
    const warningKeywords = ['should', 'avoid', 'consider', 'prefer', 'warning'];
    
    const lowerContent = content.toLowerCase();
    const lowerTags = tags?.map(tag => tag.toLowerCase()) || [];
    
    // Check for error indicators
    if (errorKeywords.some(keyword => lowerContent.includes(keyword) || lowerTags.includes(keyword))) {
      return 'error';
    }
    
    // Check for warning indicators  
    if (warningKeywords.some(keyword => lowerContent.includes(keyword) || lowerTags.includes(keyword))) {
      return 'warning';
    }
    
    return 'info';
  }

  private extractExamples(content: string): { good?: string; bad?: string; explanation?: string } {
    const examples: { good?: string; bad?: string; explanation?: string } = {};
    
    // Extract code blocks
    const codeBlockRegex = /```(?:dart|flutter)?\n?([\s\S]*?)\n?```/g;
    const codeBlocks = [...content.matchAll(codeBlockRegex)];
    
    if (codeBlocks.length > 0) {
      const firstMatch = codeBlocks[0]?.[1];
      if (firstMatch) examples.good = firstMatch;
      if (codeBlocks.length > 1) {
        const secondMatch = codeBlocks[1]?.[1];
        if (secondMatch) examples.bad = secondMatch;
      }
    }
    
    // Extract explanation
    const explanationMatch = content.match(/(?:explanation|because|reason):\s*([^.]*\.)/i);
    if (explanationMatch && explanationMatch[1]) {
      examples.explanation = explanationMatch[1];
    }
    
    return examples;
  }

  private getBuiltInRules(category?: string, ruleType?: string): Rule[] {
    const allBuiltInRules: Rule[] = [
      {
        id: 'widget_composition',
        title: 'Prefer Composition Over Inheritance',
        description: 'Use widget composition instead of extending widgets. Flutter is designed around composing widgets rather than inheriting from them.',
        severity: 'warning',
        examples: {
          good: 'Widget build(BuildContext context) {\n  return Container(\n    child: Text("Hello World"),\n  );\n}',
          bad: 'class MyText extends Text {\n  MyText(String data) : super(data);\n}',
          explanation: 'Composition is more flexible and follows Flutter\'s design principles'
        },
        tags: ['widget_architecture', 'best_practices']
      },
      {
        id: 'stateless_preference',
        title: 'Prefer StatelessWidget When Possible',
        description: 'Use StatelessWidget instead of StatefulWidget when the widget does not need to maintain state.',
        severity: 'warning',
        examples: {
          good: 'class MyWidget extends StatelessWidget {\n  @override\n  Widget build(BuildContext context) {\n    return Text("Static content");\n  }\n}',
          explanation: 'StatelessWidget is more efficient and easier to test'
        },
        tags: ['state_management', 'performance', 'best_practices']
      },
      {
        id: 'const_constructors',
        title: 'Use const Constructors',
        description: 'Use const constructors for widgets that don\'t change to improve performance.',
        severity: 'warning',
        examples: {
          good: 'const Text("Hello World")',
          bad: 'Text("Hello World")',
          explanation: 'const constructors allow Flutter to reuse widget instances'
        },
        tags: ['performance', 'best_practices']
      },
      {
        id: 'build_context_usage',
        title: 'Don\'t Store BuildContext',
        description: 'Never store BuildContext in instance variables as it can become invalid.',
        severity: 'error',
        examples: {
          bad: 'class _MyWidgetState extends State<MyWidget> {\n  BuildContext? _context;\n  \n  void initState() {\n    _context = context; // DON\'T DO THIS\n  }\n}',
          explanation: 'BuildContext can become invalid between frames'
        },
        tags: ['widget_architecture', 'anti_patterns']
      },
      {
        id: 'dispose_resources',
        title: 'Always Dispose Resources',
        description: 'Always dispose controllers, streams, and other resources in the dispose() method.',
        severity: 'error',
        examples: {
          good: '@override\nvoid dispose() {\n  _controller.dispose();\n  super.dispose();\n}',
          explanation: 'Prevents memory leaks and resource waste'
        },
        tags: ['state_management', 'performance', 'best_practices']
      },
      {
        id: 'provider_context',
        title: 'Use Provider.of with listen: false for Events',
        description: 'When calling methods on providers, use listen: false to avoid unnecessary rebuilds.',
        severity: 'warning',
        examples: {
          good: 'Provider.of<MyModel>(context, listen: false).doSomething()',
          bad: 'Provider.of<MyModel>(context).doSomething()',
          explanation: 'listen: false prevents widget from rebuilding when provider changes'
        },
        tags: ['state_management', 'performance']
      }
    ];

    // Filter by category and rule type
    let filteredRules = allBuiltInRules;

    if (category) {
      filteredRules = filteredRules.filter(rule => 
        rule.tags.includes(category) || rule.id.includes(category)
      );
    }

    if (ruleType) {
      filteredRules = filteredRules.filter(rule => 
        rule.tags.includes(ruleType)
      );
    }

    return filteredRules;
  }

  private deduplicateRules(rules: Rule[]): Rule[] {
    const seen = new Set<string>();
    return rules.filter(rule => {
      const key = rule.title.toLowerCase().replace(/\s+/g, '');
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private formatRules(rules: Rule[], category?: string, ruleType?: string): string {
    let formatted = 'Architecture Rules:\n\n';

    if (category || ruleType) {
      formatted += `Filtered by: ${category ? `Category: ${category}` : ''}${category && ruleType ? ', ' : ''}${ruleType ? `Type: ${ruleType}` : ''}\n\n`;
    }

    formatted += `Found ${rules.length} rule${rules.length === 1 ? '' : 's'}:\n\n`;

    rules.forEach((rule, index) => {
      formatted += `${index + 1}. **${rule.title}** [${rule.severity.toUpperCase()}]\n`;
      formatted += `   ${rule.description}\n\n`;

      if (rule.examples.good) {
        formatted += `   ✅ **Good Example:**\n`;
        formatted += `   \`\`\`dart\n   ${rule.examples.good}\n   \`\`\`\n\n`;
      }

      if (rule.examples.bad) {
        formatted += `   ❌ **Bad Example:**\n`;
        formatted += `   \`\`\`dart\n   ${rule.examples.bad}\n   \`\`\`\n\n`;
      }

      if (rule.examples.explanation) {
        formatted += `   💡 **Why:** ${rule.examples.explanation}\n\n`;
      }

      if (rule.tags.length > 0) {
        formatted += `   🏷️ **Tags:** ${rule.tags.join(', ')}\n\n`;
      }

      formatted += '---\n\n';
    });

    // Add footer with available categories
    formatted += `\n**Available categories:** ${this.validCategories.join(', ')}\n`;
    formatted += `**Available rule types:** ${this.validRuleTypes.join(', ')}\n`;

    return formatted;
  }
}