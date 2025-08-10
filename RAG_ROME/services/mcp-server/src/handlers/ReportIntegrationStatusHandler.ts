/**
 * Report Integration Status Handler - report_integration_status tool
 * 
 * Reports integration test results and contract validation status
 * Updates integration readiness tracking for deployment decisions
 * 
 * Author: ROME Development Team
 * Date: 2025-08-09
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BaseToolHandler, ValidationResult, MCPToolResponse } from './IToolHandler.js';
import axios from 'axios';

interface ReportIntegrationStatusArgs {
  contract_pair: string;
  validation_result: 'passed' | 'failed' | 'requires_adaptor';
  test_results: IntegrationTestResults;
  deployment_ready: boolean;
  performance_metrics?: PerformanceMetrics;
  security_status?: SecurityStatus;
  integration_notes?: string;
}

interface IntegrationTestResults {
  total_tests: number;
  passing_tests: number;
  failed_tests: number;
  skipped_tests?: number;
  test_coverage: number;
  performance_tests_passing: boolean;
  critical_path_tests_passing: boolean;
  test_details?: TestFailureDetail[];
}

interface TestFailureDetail {
  test_name: string;
  failure_reason: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  estimated_fix_time?: string;
}

interface PerformanceMetrics {
  response_time_avg: number;
  response_time_p95: number;
  response_time_p99: number;
  throughput_per_second: number;
  error_rate_percent: number;
  resource_utilization: {
    cpu_percent: number;
    memory_mb: number;
    network_mbps?: number;
  };
}

interface SecurityStatus {
  security_scan_passed: boolean;
  vulnerabilities_found: number;
  critical_vulnerabilities: number;
  authentication_tests_passed: boolean;
  authorization_tests_passed: boolean;
  data_encryption_validated: boolean;
}

interface IntegrationReportResult {
  success: boolean;
  integration_id: string;
  contract_pair: string;
  overall_status: 'ready' | 'requires_fixes' | 'blocked';
  deployment_recommendation: 'approved' | 'conditional' | 'rejected';
  critical_issues: string[];
  blocking_issues: string[];
  performance_assessment: 'excellent' | 'good' | 'acceptable' | 'poor';
  security_clearance: boolean;
  next_actions: string[];
  timestamp: string;
}

export class ReportIntegrationStatusHandler extends BaseToolHandler {
  private vdbServiceUrl: string;
  private readonly validValidationResults = ['passed', 'failed', 'requires_adaptor'];
  private readonly validSeverities = ['critical', 'high', 'medium', 'low'];

  constructor(vdbServiceUrl: string, logger: any) {
    super('report_integration_status', logger);
    this.vdbServiceUrl = vdbServiceUrl;
  }

  getToolDefinition(): Tool {
    return {
      name: 'report_integration_status',
      description: 'Report integration test results and contract validation status for deployment readiness',
      inputSchema: {
        type: 'object',
        properties: {
          contract_pair: {
            type: 'string',
            description: 'Integration pair being reported (e.g., "frontend-backend", "api-database")'
          },
          validation_result: {
            type: 'string',
            description: 'Contract validation result',
            enum: this.validValidationResults
          },
          test_results: {
            type: 'object',
            properties: {
              total_tests: { type: 'number', minimum: 0 },
              passing_tests: { type: 'number', minimum: 0 },
              failed_tests: { type: 'number', minimum: 0 },
              skipped_tests: { type: 'number', minimum: 0 },
              test_coverage: { type: 'number', minimum: 0, maximum: 100 },
              performance_tests_passing: { type: 'boolean' },
              critical_path_tests_passing: { type: 'boolean' },
              test_details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    test_name: { type: 'string' },
                    failure_reason: { type: 'string' },
                    severity: { type: 'string', enum: this.validSeverities },
                    estimated_fix_time: { type: 'string' }
                  },
                  required: ['test_name', 'failure_reason', 'severity']
                }
              }
            },
            required: ['total_tests', 'passing_tests', 'failed_tests', 'test_coverage', 'performance_tests_passing', 'critical_path_tests_passing']
          },
          deployment_ready: {
            type: 'boolean',
            description: 'Whether this integration is ready for deployment'
          },
          performance_metrics: {
            type: 'object',
            properties: {
              response_time_avg: { type: 'number', minimum: 0 },
              response_time_p95: { type: 'number', minimum: 0 },
              response_time_p99: { type: 'number', minimum: 0 },
              throughput_per_second: { type: 'number', minimum: 0 },
              error_rate_percent: { type: 'number', minimum: 0, maximum: 100 },
              resource_utilization: {
                type: 'object',
                properties: {
                  cpu_percent: { type: 'number', minimum: 0, maximum: 100 },
                  memory_mb: { type: 'number', minimum: 0 },
                  network_mbps: { type: 'number', minimum: 0 }
                },
                required: ['cpu_percent', 'memory_mb']
              }
            },
            required: ['response_time_avg', 'throughput_per_second', 'error_rate_percent', 'resource_utilization']
          },
          security_status: {
            type: 'object',
            properties: {
              security_scan_passed: { type: 'boolean' },
              vulnerabilities_found: { type: 'number', minimum: 0 },
              critical_vulnerabilities: { type: 'number', minimum: 0 },
              authentication_tests_passed: { type: 'boolean' },
              authorization_tests_passed: { type: 'boolean' },
              data_encryption_validated: { type: 'boolean' }
            },
            required: ['security_scan_passed', 'vulnerabilities_found', 'critical_vulnerabilities']
          },
          integration_notes: {
            type: 'string',
            description: 'Additional notes about the integration status'
          }
        },
        required: ['contract_pair', 'validation_result', 'test_results', 'deployment_ready']
      }
    };
  }

  validateArguments(args: unknown): ValidationResult {
    const { args: parsedArgs, errors: parseErrors } = this.validateAndSanitizeArgs(args);
    if (parseErrors.length > 0) {
      return this.createValidationFailure(parseErrors);
    }

    const errors = [];
    const sanitizedArgs: ReportIntegrationStatusArgs = {
      contract_pair: '',
      validation_result: 'failed',
      test_results: {
        total_tests: 0,
        passing_tests: 0,
        failed_tests: 0,
        test_coverage: 0,
        performance_tests_passing: false,
        critical_path_tests_passing: false
      },
      deployment_ready: false
    };

    // Validate contract_pair (required)
    const pairError = this.validateString(parsedArgs.contract_pair, 'contract_pair', true, 100);
    if (pairError) {
      errors.push(pairError);
    } else {
      sanitizedArgs.contract_pair = this.sanitizeString(parsedArgs.contract_pair);
    }

    // Validate validation_result (required)
    const resultError = this.validateEnum(parsedArgs.validation_result, 'validation_result', this.validValidationResults, true);
    if (resultError) {
      errors.push(resultError);
    } else {
      sanitizedArgs.validation_result = parsedArgs.validation_result as any;
    }

    // Validate test_results (required)
    if (parsedArgs.test_results && typeof parsedArgs.test_results === 'object') {
      const testResults = parsedArgs.test_results as any;
      sanitizedArgs.test_results = {
        total_tests: parseInt(testResults.total_tests) || 0,
        passing_tests: parseInt(testResults.passing_tests) || 0,
        failed_tests: parseInt(testResults.failed_tests) || 0,
        skipped_tests: parseInt(testResults.skipped_tests) || 0,
        test_coverage: parseFloat(testResults.test_coverage) || 0,
        performance_tests_passing: Boolean(testResults.performance_tests_passing),
        critical_path_tests_passing: Boolean(testResults.critical_path_tests_passing),
        test_details: this.sanitizeTestDetails(testResults.test_details)
      };
    } else {
      errors.push({ field: 'test_results', message: 'test_results is required and must be an object' });
    }

    // Validate deployment_ready (required)
    sanitizedArgs.deployment_ready = Boolean(parsedArgs.deployment_ready);

    // Validate performance_metrics (optional)
    if (parsedArgs.performance_metrics && typeof parsedArgs.performance_metrics === 'object') {
      sanitizedArgs.performance_metrics = this.sanitizePerformanceMetrics(parsedArgs.performance_metrics);
    }

    // Validate security_status (optional)
    if (parsedArgs.security_status && typeof parsedArgs.security_status === 'object') {
      sanitizedArgs.security_status = this.sanitizeSecurityStatus(parsedArgs.security_status);
    }

    // Validate integration_notes (optional)
    if (parsedArgs.integration_notes !== undefined) {
      const notesError = this.validateString(parsedArgs.integration_notes, 'integration_notes', false, 2000);
      if (notesError) {
        errors.push(notesError);
      } else {
        sanitizedArgs.integration_notes = this.sanitizeString(parsedArgs.integration_notes);
      }
    }

    if (errors.length > 0) {
      return this.createValidationFailure(errors);
    }

    return this.createValidationSuccess(sanitizedArgs);
  }

  async execute(args: unknown): Promise<MCPToolResponse> {
    const reportArgs = args as ReportIntegrationStatusArgs;

    try {
      this.logger.info(`Reporting integration status`, { 
        contract_pair: reportArgs.contract_pair,
        validation_result: reportArgs.validation_result,
        deployment_ready: reportArgs.deployment_ready
      });

      // Process integration report
      const reportResult = await this.processIntegrationReport(reportArgs);
      
      // Format results for response
      const formattedText = this.formatIntegrationReport(reportResult);
      
      const meta = {
        integration_report: reportResult,
        suggested_next_tools: this.getSuggestedNextTools(reportResult),
        deployment_decision: this.getDeploymentDecision(reportResult)
      };

      return this.createSuccessResponse(formattedText, meta);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Integration status report failed: ${errorMessage}`, { reportArgs, error });
      return this.createErrorResponse(
        `Failed to report integration status: ${errorMessage}`,
        { reportArgs, error: errorMessage }
      );
    }
  }

  private sanitizeTestDetails(testDetails: any[]): TestFailureDetail[] | undefined {
    if (!Array.isArray(testDetails)) return undefined;

    return testDetails
      .filter(detail => detail && typeof detail.test_name === 'string' && typeof detail.failure_reason === 'string')
      .map(detail => ({
        test_name: this.sanitizeString(detail.test_name),
        failure_reason: this.sanitizeString(detail.failure_reason),
        severity: this.validSeverities.includes(detail.severity) ? detail.severity : 'medium',
        estimated_fix_time: detail.estimated_fix_time ? this.sanitizeString(detail.estimated_fix_time) : undefined
      }));
  }

  private sanitizePerformanceMetrics(metrics: any): PerformanceMetrics {
    return {
      response_time_avg: parseFloat(metrics.response_time_avg) || 0,
      response_time_p95: parseFloat(metrics.response_time_p95) || 0,
      response_time_p99: parseFloat(metrics.response_time_p99) || 0,
      throughput_per_second: parseFloat(metrics.throughput_per_second) || 0,
      error_rate_percent: parseFloat(metrics.error_rate_percent) || 0,
      resource_utilization: {
        cpu_percent: parseFloat(metrics.resource_utilization?.cpu_percent) || 0,
        memory_mb: parseFloat(metrics.resource_utilization?.memory_mb) || 0,
        network_mbps: metrics.resource_utilization?.network_mbps ? parseFloat(metrics.resource_utilization.network_mbps) : undefined
      }
    };
  }

  private sanitizeSecurityStatus(security: any): SecurityStatus {
    return {
      security_scan_passed: Boolean(security.security_scan_passed),
      vulnerabilities_found: parseInt(security.vulnerabilities_found) || 0,
      critical_vulnerabilities: parseInt(security.critical_vulnerabilities) || 0,
      authentication_tests_passed: Boolean(security.authentication_tests_passed),
      authorization_tests_passed: Boolean(security.authorization_tests_passed),
      data_encryption_validated: Boolean(security.data_encryption_validated)
    };
  }

  private async processIntegrationReport(report: ReportIntegrationStatusArgs): Promise<IntegrationReportResult> {
    const integrationId = `integration_${report.contract_pair.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    
    try {
      // Send report to VDB service
      const response = await axios.post(`${this.vdbServiceUrl}/api/v1/integration/report-status`, {
        integration_id: integrationId,
        report: report,
        timestamp: new Date().toISOString()
      }, {
        timeout: 10000
      });

      if (response.data.success) {
        return this.buildReportResult(integrationId, report, response.data.analysis);
      }
    } catch (error) {
      this.logger.warn('VDB service not available, creating local report analysis', { error });
    }

    // Fallback to local analysis
    return this.buildReportResult(integrationId, report);
  }

  private buildReportResult(
    integrationId: string,
    report: ReportIntegrationStatusArgs,
    vdbAnalysis?: any
  ): IntegrationReportResult {
    // Analyze critical issues
    const criticalIssues: string[] = [];
    const blockingIssues: string[] = [];

    if (report.validation_result === 'failed') {
      criticalIssues.push('Contract validation failed - integration cannot proceed');
      blockingIssues.push('Fix contract validation errors');
    }

    if (!report.test_results.critical_path_tests_passing) {
      criticalIssues.push('Critical path tests failing - core functionality broken');
      blockingIssues.push('Fix critical path test failures');
    }

    if (report.test_results.test_coverage < 80) {
      criticalIssues.push(`Test coverage ${report.test_results.test_coverage}% below 80% requirement`);
    }

    if (report.security_status?.critical_vulnerabilities && report.security_status.critical_vulnerabilities > 0) {
      criticalIssues.push(`${report.security_status.critical_vulnerabilities} critical security vulnerabilities found`);
      blockingIssues.push('Resolve critical security vulnerabilities');
    }

    // Assess overall status
    const overallStatus = this.determineOverallStatus(report, criticalIssues, blockingIssues);
    
    // Determine deployment recommendation
    const deploymentRecommendation = this.determineDeploymentRecommendation(report, criticalIssues, blockingIssues);
    
    // Assess performance
    const performanceAssessment = this.assessPerformance(report.performance_metrics);
    
    // Check security clearance
    const securityClearance = this.checkSecurityClearance(report.security_status);
    
    // Generate next actions
    const nextActions = this.generateNextActions(report, criticalIssues, blockingIssues);

    return {
      success: true,
      integration_id: integrationId,
      contract_pair: report.contract_pair,
      overall_status: overallStatus,
      deployment_recommendation: deploymentRecommendation,
      critical_issues: criticalIssues,
      blocking_issues: blockingIssues,
      performance_assessment: performanceAssessment,
      security_clearance: securityClearance,
      next_actions: nextActions,
      timestamp: new Date().toISOString()
    };
  }

  private determineOverallStatus(
    report: ReportIntegrationStatusArgs,
    criticalIssues: string[],
    blockingIssues: string[]
  ): 'ready' | 'requires_fixes' | 'blocked' {
    if (blockingIssues.length > 0) return 'blocked';
    if (criticalIssues.length > 0) return 'requires_fixes';
    if (report.deployment_ready && report.test_results.critical_path_tests_passing) return 'ready';
    return 'requires_fixes';
  }

  private determineDeploymentRecommendation(
    report: ReportIntegrationStatusArgs,
    criticalIssues: string[],
    blockingIssues: string[]
  ): 'approved' | 'conditional' | 'rejected' {
    if (blockingIssues.length > 0) return 'rejected';
    if (criticalIssues.length > 0) return 'conditional';
    if (report.deployment_ready && 
        report.test_results.critical_path_tests_passing &&
        report.test_results.test_coverage >= 80) {
      return 'approved';
    }
    return 'conditional';
  }

  private assessPerformance(metrics?: PerformanceMetrics): 'excellent' | 'good' | 'acceptable' | 'poor' {
    if (!metrics) return 'acceptable';

    const avgResponseTime = metrics.response_time_avg;
    const errorRate = metrics.error_rate_percent;

    if (avgResponseTime < 100 && errorRate < 0.1) return 'excellent';
    if (avgResponseTime < 200 && errorRate < 0.5) return 'good';
    if (avgResponseTime < 500 && errorRate < 2.0) return 'acceptable';
    return 'poor';
  }

  private checkSecurityClearance(security?: SecurityStatus): boolean {
    if (!security) return true; // No security requirements specified

    return security.security_scan_passed &&
           security.critical_vulnerabilities === 0 &&
           security.authentication_tests_passed &&
           security.authorization_tests_passed;
  }

  private generateNextActions(
    report: ReportIntegrationStatusArgs,
    criticalIssues: string[],
    blockingIssues: string[]
  ): string[] {
    const actions: string[] = [];

    if (blockingIssues.length > 0) {
      actions.push('Resolve blocking issues before proceeding');
      actions.push('Use validate_integration_contract to recheck after fixes');
    }

    if (report.test_results.failed_tests > 0) {
      actions.push('Fix failing integration tests');
      actions.push('Re-run test suite and update status');
    }

    if (report.test_results.test_coverage < 80) {
      actions.push('Add tests to reach 80% coverage requirement');
    }

    if (report.performance_metrics && this.assessPerformance(report.performance_metrics) === 'poor') {
      actions.push('Optimize performance to meet SLA requirements');
    }

    if (criticalIssues.length === 0 && blockingIssues.length === 0) {
      actions.push('Update actionlist.md with integration completion');
      actions.push('Coordinate with PMA for deployment scheduling');
    }

    return actions;
  }

  private getSuggestedNextTools(result: IntegrationReportResult): string[] {
    const tools: string[] = [];

    if (result.blocking_issues.length > 0) {
      tools.push('validate_integration_contract', 'resolve_blocker');
    }

    if (result.overall_status === 'ready') {
      tools.push('update_actionlist', 'get_coordination_status');
    } else {
      tools.push('update_robot_status', 'add_dependency');
    }

    return tools;
  }

  private getDeploymentDecision(result: IntegrationReportResult): string {
    switch (result.deployment_recommendation) {
      case 'approved':
        return '✅ APPROVED for deployment - all criteria met';
      case 'conditional':
        return '⚠️ CONDITIONAL approval - address issues before deployment';
      case 'rejected':
        return '❌ REJECTED for deployment - critical issues must be resolved';
      default:
        return '❓ Deployment decision pending';
    }
  }

  private formatIntegrationReport(result: IntegrationReportResult): string {
    let formatted = `Integration Status Report: **${result.contract_pair}**\n\n`;
    
    // Overall status
    const statusIcon = result.overall_status === 'ready' ? '✅' : 
                      result.overall_status === 'requires_fixes' ? '⚠️' : '❌';
    formatted += `${statusIcon} **Overall Status**: ${result.overall_status.toUpperCase()}\n`;
    
    const deploymentIcon = result.deployment_recommendation === 'approved' ? '✅' : 
                          result.deployment_recommendation === 'conditional' ? '⚠️' : '❌';
    formatted += `${deploymentIcon} **Deployment**: ${result.deployment_recommendation.toUpperCase()}\n`;
    
    formatted += `🔐 **Security Clearance**: ${result.security_clearance ? 'PASSED' : 'FAILED'}\n`;
    formatted += `⚡ **Performance**: ${result.performance_assessment.toUpperCase()}\n\n`;

    // Critical issues
    if (result.critical_issues.length > 0) {
      formatted += `🚨 **Critical Issues** (${result.critical_issues.length}):\n`;
      result.critical_issues.forEach((issue, index) => {
        formatted += `${index + 1}. ${issue}\n`;
      });
      formatted += '\n';
    }

    // Blocking issues
    if (result.blocking_issues.length > 0) {
      formatted += `🚫 **Blocking Issues** (${result.blocking_issues.length}):\n`;
      result.blocking_issues.forEach((issue, index) => {
        formatted += `${index + 1}. ${issue}\n`;
      });
      formatted += '\n';
    }

    // Next actions
    formatted += `🎯 **Required Actions**:\n`;
    result.next_actions.forEach((action, index) => {
      formatted += `${index + 1}. ${action}\n`;
    });

    // Footer
    formatted += '\n---\n';
    formatted += `📋 Integration ID: ${result.integration_id}\n`;
    formatted += `🕐 Reported: ${new Date(result.timestamp).toLocaleString()}\n`;

    return formatted;
  }
}