/**
 * Integration Contract Validator Handler - validate_integration_contract tool
 * 
 * Validates integration contracts between modules for compatibility and compliance
 * Ensures contract interfaces match and integration patterns are followed
 * 
 * Author: ROME Development Team
 * Date: 2025-08-09
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BaseToolHandler, ValidationResult, MCPToolResponse } from './IToolHandler.js';
import axios from 'axios';

interface ValidateIntegrationContractArgs {
  primary_contract: string;
  secondary_contract: string;
  integration_type?: 'api_to_database' | 'frontend_to_api' | 'service_to_service' | 'cross_platform';
  validation_level?: 'basic' | 'comprehensive' | 'strict';
}

interface IntegrationValidationResult {
  validation_status: 'valid' | 'warnings' | 'invalid';
  compatibility_score: number;
  interface_matches: InterfaceMatch[];
  validation_issues: ValidationIssue[];
  integration_recommendations: string[];
  required_adaptors?: AdaptorRequirement[];
}

interface InterfaceMatch {
  primary_interface: string;
  secondary_interface: string;
  match_status: 'exact' | 'compatible' | 'requires_adaptor' | 'incompatible';
  compatibility_details: string;
}

interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  interface: string;
  issue: string;
  recommendation: string;
}

interface AdaptorRequirement {
  interface_pair: string;
  adaptor_type: 'data_transformer' | 'protocol_bridge' | 'format_converter';
  implementation_guidance: string;
}

export class ValidateIntegrationContractHandler extends BaseToolHandler {
  private vdbServiceUrl: string;
  private readonly validIntegrationTypes = [
    'api_to_database', 'frontend_to_api', 'service_to_service', 'cross_platform'
  ];
  private readonly validValidationLevels = [
    'basic', 'comprehensive', 'strict'
  ];

  constructor(vdbServiceUrl: string, logger: any) {
    super('validate_integration_contract', logger);
    this.vdbServiceUrl = vdbServiceUrl;
  }

  getToolDefinition(): Tool {
    return {
      name: 'validate_integration_contract',
      description: 'Validate integration contracts between modules for compatibility and compliance',
      inputSchema: {
        type: 'object',
        properties: {
          primary_contract: {
            type: 'string',
            description: 'Primary contract specification (JSON or YAML format)'
          },
          secondary_contract: {
            type: 'string',
            description: 'Secondary contract specification to validate against primary'
          },
          integration_type: {
            type: 'string',
            description: 'Type of integration being validated',
            enum: this.validIntegrationTypes
          },
          validation_level: {
            type: 'string',
            description: 'Level of validation strictness',
            enum: this.validValidationLevels,
            default: 'comprehensive'
          }
        },
        required: ['primary_contract', 'secondary_contract']
      }
    };
  }

  validateArguments(args: unknown): ValidationResult {
    const { args: parsedArgs, errors: parseErrors } = this.validateAndSanitizeArgs(args);
    if (parseErrors.length > 0) {
      return this.createValidationFailure(parseErrors);
    }

    const errors = [];
    const sanitizedArgs: ValidateIntegrationContractArgs = {
      primary_contract: '',
      secondary_contract: ''
    };

    // Validate primary_contract (required)
    const primaryError = this.validateString(parsedArgs.primary_contract, 'primary_contract', true, 10000);
    if (primaryError) {
      errors.push(primaryError);
    } else {
      sanitizedArgs.primary_contract = this.sanitizeString(parsedArgs.primary_contract);
    }

    // Validate secondary_contract (required)
    const secondaryError = this.validateString(parsedArgs.secondary_contract, 'secondary_contract', true, 10000);
    if (secondaryError) {
      errors.push(secondaryError);
    } else {
      sanitizedArgs.secondary_contract = this.sanitizeString(parsedArgs.secondary_contract);
    }

    // Validate integration_type (optional)
    if (parsedArgs.integration_type !== undefined) {
      const typeError = this.validateEnum(parsedArgs.integration_type, 'integration_type', this.validIntegrationTypes, false);
      if (typeError) {
        errors.push(typeError);
      } else {
        sanitizedArgs.integration_type = parsedArgs.integration_type as any;
      }
    }

    // Validate validation_level (optional)
    if (parsedArgs.validation_level !== undefined) {
      const levelError = this.validateEnum(parsedArgs.validation_level, 'validation_level', this.validValidationLevels, false);
      if (levelError) {
        errors.push(levelError);
      } else {
        sanitizedArgs.validation_level = parsedArgs.validation_level as any;
      }
    } else {
      sanitizedArgs.validation_level = 'comprehensive';
    }

    if (errors.length > 0) {
      return this.createValidationFailure(errors);
    }

    return this.createValidationSuccess(sanitizedArgs);
  }

  async execute(args: unknown): Promise<MCPToolResponse> {
    const { primary_contract, secondary_contract, integration_type, validation_level } = args as ValidateIntegrationContractArgs;

    try {
      this.logger.info(`Validating integration contract compatibility`, { integration_type, validation_level });

      // Parse and validate contracts
      const validationResult = await this.validateIntegrationCompatibility(
        primary_contract,
        secondary_contract,
        integration_type,
        validation_level || 'comprehensive'
      );
      
      // Format results for response
      const formattedText = this.formatValidationResult(validationResult, integration_type);
      
      const meta = {
        validation_result: validationResult,
        suggested_next_tools: this.getSuggestedNextTools(validationResult)
      };

      return this.createSuccessResponse(formattedText, meta);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Integration contract validation failed: ${errorMessage}`, { integration_type, validation_level, error });
      return this.createErrorResponse(
        `Integration contract validation failed: ${errorMessage}`,
        { integration_type, validation_level, error: errorMessage }
      );
    }
  }

  private async validateIntegrationCompatibility(
    primaryContract: string,
    secondaryContract: string,
    integrationType?: string,
    validationLevel: string = 'comprehensive'
  ): Promise<IntegrationValidationResult> {
    try {
      // Try to get validation from VDB service first
      const response = await axios.post(`${this.vdbServiceUrl}/api/v1/contracts/validate-integration`, {
        primary_contract: primaryContract,
        secondary_contract: secondaryContract,
        integration_type: integrationType,
        validation_level: validationLevel
      }, {
        timeout: 10000
      });

      if (response.data.success && response.data.validation_result) {
        return response.data.validation_result;
      }
    } catch (error) {
      this.logger.warn('VDB service not available, using built-in validation', { error });
    }

    // Fallback to built-in validation logic
    return this.performBuiltInValidation(primaryContract, secondaryContract, integrationType, validationLevel);
  }

  private async performBuiltInValidation(
    primaryContract: string,
    secondaryContract: string,
    integrationType?: string,
    validationLevel: string = 'comprehensive'
  ): Promise<IntegrationValidationResult> {
    // Parse contracts
    const primaryParsed = this.parseContract(primaryContract);
    const secondaryParsed = this.parseContract(secondaryContract);

    // Perform interface matching
    const interfaceMatches = this.matchInterfaces(primaryParsed, secondaryParsed, integrationType);
    
    // Identify validation issues
    const validationIssues = this.identifyValidationIssues(interfaceMatches, validationLevel);
    
    // Calculate compatibility score
    const compatibilityScore = this.calculateCompatibilityScore(interfaceMatches);
    
    // Determine validation status
    const validationStatus = this.determineValidationStatus(compatibilityScore, validationIssues);
    
    // Generate recommendations
    const integrationRecommendations = this.generateIntegrationRecommendations(interfaceMatches, validationIssues, integrationType);
    
    // Identify required adaptors
    const requiredAdaptors = this.identifyRequiredAdaptors(interfaceMatches);

    return {
      validation_status: validationStatus,
      compatibility_score: compatibilityScore,
      interface_matches: interfaceMatches,
      validation_issues: validationIssues,
      integration_recommendations: integrationRecommendations,
      required_adaptors: requiredAdaptors.length > 0 ? requiredAdaptors : undefined
    };
  }

  private parseContract(contractText: string): any {
    try {
      // Try to parse as JSON first
      return JSON.parse(contractText);
    } catch {
      try {
        // If JSON fails, try basic YAML parsing (simplified)
        const lines = contractText.split('\n');
        const contract: any = { interfaces: [] };
        
        let currentInterface: any = null;
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.includes('interface') || trimmed.includes('endpoint')) {
            if (currentInterface) contract.interfaces.push(currentInterface);
            currentInterface = { name: trimmed, methods: [], schemas: {} };
          } else if (currentInterface && (trimmed.includes('method:') || trimmed.includes('POST') || trimmed.includes('GET'))) {
            currentInterface.methods.push(trimmed);
          }
        }
        if (currentInterface) contract.interfaces.push(currentInterface);
        
        return contract;
      } catch {
        // Fallback to text parsing
        return {
          interfaces: [{
            name: 'ParsedInterface',
            methods: this.extractMethods(contractText),
            schemas: this.extractSchemas(contractText)
          }]
        };
      }
    }
  }

  private extractMethods(text: string): string[] {
    const methods: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();
      if (trimmed.includes('post') || trimmed.includes('get') || trimmed.includes('put') || 
          trimmed.includes('delete') || trimmed.includes('method')) {
        methods.push(line.trim());
      }
    }
    
    return methods;
  }

  private extractSchemas(text: string): any {
    const schemas: any = {};
    
    // Look for schema-like patterns
    if (text.includes('request') || text.includes('response')) {
      schemas.request = { type: 'object' };
      schemas.response = { type: 'object' };
    }
    
    return schemas;
  }

  private matchInterfaces(primary: any, secondary: any, integrationType?: string): InterfaceMatch[] {
    const matches: InterfaceMatch[] = [];
    const primaryInterfaces = primary.interfaces || [primary];
    const secondaryInterfaces = secondary.interfaces || [secondary];

    for (const primaryIface of primaryInterfaces) {
      for (const secondaryIface of secondaryInterfaces) {
        const match = this.matchSingleInterface(primaryIface, secondaryIface, integrationType);
        matches.push(match);
      }
    }

    return matches;
  }

  private matchSingleInterface(primary: any, secondary: any, integrationType?: string): InterfaceMatch {
    const primaryName = primary.name || primary.endpoint || 'Primary Interface';
    const secondaryName = secondary.name || secondary.endpoint || 'Secondary Interface';

    // Check method compatibility
    const primaryMethods = primary.methods || [];
    const secondaryMethods = secondary.methods || [];
    
    let matchStatus: 'exact' | 'compatible' | 'requires_adaptor' | 'incompatible' = 'incompatible';
    let compatibilityDetails = '';

    if (this.methodsMatch(primaryMethods, secondaryMethods)) {
      matchStatus = 'exact';
      compatibilityDetails = 'Methods and signatures match exactly';
    } else if (this.methodsCompatible(primaryMethods, secondaryMethods)) {
      matchStatus = 'compatible';
      compatibilityDetails = 'Methods are compatible with minor differences';
    } else if (this.methodsCanBeAdapted(primaryMethods, secondaryMethods, integrationType)) {
      matchStatus = 'requires_adaptor';
      compatibilityDetails = 'Methods can be made compatible with an adaptor';
    } else {
      matchStatus = 'incompatible';
      compatibilityDetails = 'Methods are fundamentally incompatible';
    }

    return {
      primary_interface: primaryName,
      secondary_interface: secondaryName,
      match_status: matchStatus,
      compatibility_details: compatibilityDetails
    };
  }

  private methodsMatch(primary: string[], secondary: string[]): boolean {
    if (primary.length !== secondary.length) return false;
    return primary.every(method => secondary.includes(method));
  }

  private methodsCompatible(primary: string[], secondary: string[]): boolean {
    // Check if at least 70% of methods are compatible
    let compatibleCount = 0;
    for (const primaryMethod of primary) {
      if (secondary.some(secondaryMethod => this.methodsAreCompatible(primaryMethod, secondaryMethod))) {
        compatibleCount++;
      }
    }
    return compatibleCount / primary.length >= 0.7;
  }

  private methodsAreCompatible(method1: string, method2: string): boolean {
    const m1 = method1.toLowerCase();
    const m2 = method2.toLowerCase();
    
    // Basic compatibility checks
    if (m1 === m2) return true;
    if (m1.includes('get') && m2.includes('get')) return true;
    if (m1.includes('post') && m2.includes('post')) return true;
    if (m1.includes('put') && m2.includes('put')) return true;
    if (m1.includes('delete') && m2.includes('delete')) return true;
    
    return false;
  }

  private methodsCanBeAdapted(primary: string[], secondary: string[], integrationType?: string): boolean {
    // Determine if methods can be adapted based on integration type
    switch (integrationType) {
      case 'api_to_database':
        return primary.some(m => m.toLowerCase().includes('query')) || 
               secondary.some(m => m.toLowerCase().includes('select'));
      case 'frontend_to_api':
        return primary.some(m => m.toLowerCase().includes('get')) && 
               secondary.some(m => m.toLowerCase().includes('fetch'));
      default:
        return primary.length > 0 && secondary.length > 0;
    }
  }

  private identifyValidationIssues(matches: InterfaceMatch[], validationLevel: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    for (const match of matches) {
      if (match.match_status === 'incompatible') {
        issues.push({
          severity: 'error',
          interface: `${match.primary_interface} -> ${match.secondary_interface}`,
          issue: 'Interface incompatibility detected',
          recommendation: 'Redesign interfaces or implement comprehensive adaptor'
        });
      } else if (match.match_status === 'requires_adaptor') {
        const severity = validationLevel === 'strict' ? 'error' : 'warning';
        issues.push({
          severity: severity as 'error' | 'warning',
          interface: `${match.primary_interface} -> ${match.secondary_interface}`,
          issue: 'Interface requires adaptor for compatibility',
          recommendation: 'Implement adaptor pattern or consider interface refactoring'
        });
      } else if (match.match_status === 'compatible' && validationLevel === 'strict') {
        issues.push({
          severity: 'warning',
          interface: `${match.primary_interface} -> ${match.secondary_interface}`,
          issue: 'Interface compatibility is not exact',
          recommendation: 'Consider standardizing interface definitions'
        });
      }
    }

    return issues;
  }

  private calculateCompatibilityScore(matches: InterfaceMatch[]): number {
    if (matches.length === 0) return 0;
    
    let totalScore = 0;
    for (const match of matches) {
      switch (match.match_status) {
        case 'exact': totalScore += 100; break;
        case 'compatible': totalScore += 80; break;
        case 'requires_adaptor': totalScore += 60; break;
        case 'incompatible': totalScore += 0; break;
      }
    }
    
    return Math.round(totalScore / matches.length);
  }

  private determineValidationStatus(score: number, issues: ValidationIssue[]): 'valid' | 'warnings' | 'invalid' {
    const hasErrors = issues.some(issue => issue.severity === 'error');
    const hasWarnings = issues.some(issue => issue.severity === 'warning');
    
    if (hasErrors || score < 60) return 'invalid';
    if (hasWarnings || score < 90) return 'warnings';
    return 'valid';
  }

  private generateIntegrationRecommendations(
    matches: InterfaceMatch[], 
    issues: ValidationIssue[], 
    integrationType?: string
  ): string[] {
    const recommendations: string[] = [];
    
    const adaptorNeeded = matches.some(m => m.match_status === 'requires_adaptor');
    const incompatibleFound = matches.some(m => m.match_status === 'incompatible');
    
    if (incompatibleFound) {
      recommendations.push('Redesign incompatible interfaces to follow common patterns');
      recommendations.push('Consider using intermediate service layers for complex integrations');
    }
    
    if (adaptorNeeded) {
      recommendations.push('Implement adaptor pattern to bridge interface differences');
      recommendations.push('Create comprehensive test suite for adaptor functionality');
    }
    
    // Integration-specific recommendations
    switch (integrationType) {
      case 'api_to_database':
        recommendations.push('Ensure database queries map correctly to API response formats');
        recommendations.push('Implement proper error handling for database connection failures');
        break;
      case 'frontend_to_api':
        recommendations.push('Validate API response formats match frontend expectations');
        recommendations.push('Implement proper loading states and error handling in frontend');
        break;
      case 'service_to_service':
        recommendations.push('Implement circuit breaker pattern for service failures');
        recommendations.push('Add comprehensive monitoring and logging for service interactions');
        break;
    }
    
    recommendations.push('Create integration test suite covering all interface interactions');
    recommendations.push('Document all adaptor requirements and implementation details');
    
    return recommendations;
  }

  private identifyRequiredAdaptors(matches: InterfaceMatch[]): AdaptorRequirement[] {
    const adaptors: AdaptorRequirement[] = [];
    
    for (const match of matches) {
      if (match.match_status === 'requires_adaptor') {
        adaptors.push({
          interface_pair: `${match.primary_interface} <-> ${match.secondary_interface}`,
          adaptor_type: this.determineAdaptorType(match),
          implementation_guidance: this.generateAdaptorGuidance(match)
        });
      }
    }
    
    return adaptors;
  }

  private determineAdaptorType(match: InterfaceMatch): 'data_transformer' | 'protocol_bridge' | 'format_converter' {
    const details = match.compatibility_details.toLowerCase();
    
    if (details.includes('format') || details.includes('schema')) {
      return 'format_converter';
    } else if (details.includes('protocol') || details.includes('method')) {
      return 'protocol_bridge';
    } else {
      return 'data_transformer';
    }
  }

  private generateAdaptorGuidance(match: InterfaceMatch): string {
    return `Create adaptor to convert ${match.primary_interface} format to ${match.secondary_interface} format. ` +
           `Focus on: ${match.compatibility_details}. Implement comprehensive error handling and data validation.`;
  }

  private getSuggestedNextTools(result: IntegrationValidationResult): string[] {
    const tools: string[] = [];
    
    if (result.validation_status === 'invalid') {
      tools.push('get_contract_template', 'get_rome_standards');
    } else if (result.validation_status === 'warnings') {
      tools.push('check_roma_approval', 'get_robot_protocol');
    } else {
      tools.push('get_coordination_status', 'get_robot_protocol');
    }
    
    if (result.required_adaptors && result.required_adaptors.length > 0) {
      tools.push('get_contract_template');
    }
    
    return tools;
  }

  private formatValidationResult(result: IntegrationValidationResult, integrationType?: string): string {
    let formatted = `Integration Contract Validation Result\n\n`;
    
    // Status and score
    const statusIcon = result.validation_status === 'valid' ? '✅' : 
                      result.validation_status === 'warnings' ? '⚠️' : '❌';
    formatted += `${statusIcon} **Validation Status**: ${result.validation_status.toUpperCase()}\n`;
    formatted += `📊 **Compatibility Score**: ${result.compatibility_score}%\n`;
    
    if (integrationType) {
      formatted += `🔗 **Integration Type**: ${integrationType}\n`;
    }
    formatted += '\n';

    // Interface Matches
    formatted += `**Interface Compatibility Analysis** (${result.interface_matches.length} interface pairs):\n\n`;
    result.interface_matches.forEach((match, index) => {
      const matchIcon = match.match_status === 'exact' ? '✅' : 
                       match.match_status === 'compatible' ? '🟢' :
                       match.match_status === 'requires_adaptor' ? '🟡' : '❌';
      formatted += `${index + 1}. ${matchIcon} **${match.primary_interface}** ↔ **${match.secondary_interface}**\n`;
      formatted += `   Status: ${match.match_status} | ${match.compatibility_details}\n\n`;
    });

    // Validation Issues
    if (result.validation_issues.length > 0) {
      formatted += `**Validation Issues** (${result.validation_issues.length}):\n\n`;
      result.validation_issues.forEach((issue, index) => {
        const issueIcon = issue.severity === 'error' ? '🚨' : 
                         issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        formatted += `${index + 1}. ${issueIcon} **${issue.interface}**\n`;
        formatted += `   Issue: ${issue.issue}\n`;
        formatted += `   Recommendation: ${issue.recommendation}\n\n`;
      });
    }

    // Required Adaptors
    if (result.required_adaptors && result.required_adaptors.length > 0) {
      formatted += `**Required Adaptors** (${result.required_adaptors.length}):\n\n`;
      result.required_adaptors.forEach((adaptor, index) => {
        formatted += `${index + 1}. **${adaptor.interface_pair}**\n`;
        formatted += `   Type: ${adaptor.adaptor_type}\n`;
        formatted += `   Guidance: ${adaptor.implementation_guidance}\n\n`;
      });
    }

    // Integration Recommendations
    formatted += `**Integration Recommendations**:\n`;
    result.integration_recommendations.forEach((rec, index) => {
      formatted += `${index + 1}. ${rec}\n`;
    });

    // Footer
    formatted += '\n---\n';
    if (result.validation_status === 'valid') {
      formatted += `🎉 Integration contracts are compatible! Proceed with implementation.\n`;
    } else if (result.validation_status === 'warnings') {
      formatted += `⚠️ Integration is possible but requires attention to warnings above.\n`;
    } else {
      formatted += `❌ Integration contracts have significant compatibility issues that must be resolved.\n`;
    }

    return formatted;
  }
}