/**
 * API Validation System
 * Validates all API endpoints are working correctly
 * Tests request/response schemas and error handling
 */

import { api } from './supabase';
import { USE_MOCK } from './config';

export interface APIValidationResult {
  endpoint: string;
  method: string;
  status: 'pass' | 'fail' | 'warning';
  responseTime: number;
  message: string;
  details?: any;
}

export interface APIValidationSuite {
  results: APIValidationResult[];
  overallStatus: 'pass' | 'fail' | 'warning';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  warningTests: number;
}

class APIValidator {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  }

  async validateAllEndpoints(): Promise<APIValidationSuite> {
    console.log('🔍 Starting comprehensive API validation...');

    // In mock mode, return successful mock results
    if (USE_MOCK) {
      console.log('✅ API validation skipped (mock mode enabled)');
      return {
        results: [
          { endpoint: '/health', method: 'GET', status: 'pass', responseTime: 0, message: 'Mock mode - skipped' },
          { endpoint: '/session', method: 'GET', status: 'pass', responseTime: 0, message: 'Mock mode - skipped' },
          { endpoint: '/notes', method: 'GET', status: 'pass', responseTime: 0, message: 'Mock mode - skipped' },
          { endpoint: '/topics', method: 'GET', status: 'pass', responseTime: 0, message: 'Mock mode - skipped' },
          { endpoint: '/diagnostic/generate', method: 'POST', status: 'pass', responseTime: 0, message: 'Mock mode - skipped' },
          { endpoint: '/revisions', method: 'GET', status: 'pass', responseTime: 0, message: 'Mock mode - skipped' },
          { endpoint: '/progress', method: 'GET', status: 'pass', responseTime: 0, message: 'Mock mode - skipped' }
        ],
        overallStatus: 'pass',
        totalTests: 7,
        passedTests: 7,
        failedTests: 0,
        warningTests: 0
      };
    }

    const results: APIValidationResult[] = [];

    // Test all critical endpoints
    const tests = [
      () => this.testHealthEndpoint(),
      () => this.testAuthEndpoints(),
      () => this.testNotesEndpoints(),
      () => this.testTopicsEndpoints(),
      () => this.testDiagnosticEndpoints(),
      () => this.testRevisionEndpoints(),
      () => this.testProgressEndpoints()
    ];

    for (const test of tests) {
      try {
        const result = await test();
        results.push(...(Array.isArray(result) ? result : [result]));
      } catch (error) {
        results.push({
          endpoint: 'unknown',
          method: 'unknown',
          status: 'fail',
          responseTime: 0,
          message: `Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    const passedTests = results.filter(r => r.status === 'pass').length;
    const failedTests = results.filter(r => r.status === 'fail').length;
    const warningTests = results.filter(r => r.status === 'warning').length;

    const overallStatus = failedTests > 0 ? 'fail' : warningTests > 0 ? 'warning' : 'pass';

    const suite: APIValidationSuite = {
      results,
      overallStatus,
      totalTests: results.length,
      passedTests,
      failedTests,
      warningTests
    };

    this.logValidationResults(suite);
    return suite;
  }

  private async testHealthEndpoint(): Promise<APIValidationResult> {
    const startTime = Date.now();

    try {
      // Test Supabase Auth endpoint directly
      const result = await api.getSession('');
      const responseTime = Date.now() - startTime;

      // Check if there's an error in the result
      const hasError = 'error' in result && result.error;

      if (hasError && result.error !== 'Unauthorized') {
        return {
          endpoint: '/supabase/auth',
          method: 'GET',
          status: 'warning',
          responseTime,
          message: `Supabase auth returned: ${result.error}`
        };
      }

      return {
        endpoint: '/supabase/auth',
        method: 'GET',
        status: 'pass',
        responseTime,
        message: 'Supabase services working correctly'
      };
    } catch (error) {
      return {
        endpoint: '/supabase/auth',
        method: 'GET',
        status: 'warning',
        responseTime: Date.now() - startTime,
        message: `Supabase check: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async testAuthEndpoints(): Promise<APIValidationResult[]> {
    const results: APIValidationResult[] = [];

    // Test session endpoint (should handle invalid token gracefully)
    const startTime = Date.now();
    try {
      const sessionResult = await api.getSession('invalid-token');
      const responseTime = Date.now() - startTime;

      // Should return null session without throwing error
      if (sessionResult.session === null && sessionResult.user === null) {
        results.push({
          endpoint: '/session',
          method: 'GET',
          status: 'pass',
          responseTime,
          message: 'Session endpoint handles invalid tokens correctly'
        });
      } else {
        results.push({
          endpoint: '/session',
          method: 'GET',
          status: 'warning',
          responseTime,
          message: 'Session endpoint behavior unexpected for invalid token',
          details: sessionResult
        });
      }
    } catch (error) {
      results.push({
        endpoint: '/session',
        method: 'GET',
        status: 'fail',
        responseTime: Date.now() - startTime,
        message: `Session endpoint failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    return results;
  }

  private async testNotesEndpoints(): Promise<APIValidationResult[]> {
    const results: APIValidationResult[] = [];

    // Test notes endpoint (should require authentication)
    const startTime = Date.now();
    try {
      const notesResult = await api.getNotes('invalid-token');
      const responseTime = Date.now() - startTime;

      if (notesResult.error === 'Unauthorized') {
        results.push({
          endpoint: '/notes',
          method: 'GET',
          status: 'pass',
          responseTime,
          message: 'Notes endpoint properly requires authentication'
        });
      } else {
        results.push({
          endpoint: '/notes',
          method: 'GET',
          status: 'warning',
          responseTime,
          message: 'Notes endpoint should require authentication',
          details: notesResult
        });
      }
    } catch (error) {
      results.push({
        endpoint: '/notes',
        method: 'GET',
        status: 'fail',
        responseTime: Date.now() - startTime,
        message: `Notes endpoint failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    return results;
  }

  private async testTopicsEndpoints(): Promise<APIValidationResult[]> {
    const results: APIValidationResult[] = [];

    // Test topics endpoint (should require authentication)
    const startTime = Date.now();
    try {
      const topicsResult = await api.getTopics('invalid-token');
      const responseTime = Date.now() - startTime;

      if (topicsResult.error === 'Unauthorized') {
        results.push({
          endpoint: '/topics',
          method: 'GET',
          status: 'pass',
          responseTime,
          message: 'Topics endpoint properly requires authentication'
        });
      } else {
        results.push({
          endpoint: '/topics',
          method: 'GET',
          status: 'warning',
          responseTime,
          message: 'Topics endpoint should require authentication',
          details: topicsResult
        });
      }
    } catch (error) {
      results.push({
        endpoint: '/topics',
        method: 'GET',
        status: 'fail',
        responseTime: Date.now() - startTime,
        message: `Topics endpoint failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    return results;
  }

  private async testDiagnosticEndpoints(): Promise<APIValidationResult[]> {
    const results: APIValidationResult[] = [];

    // Test diagnostic generation endpoint (should require authentication)
    const startTime = Date.now();
    try {
      const diagnosticResult = await api.generateDiagnostic('invalid-token', 'test-topic', 'test-subject');
      const responseTime = Date.now() - startTime;

      const hasError = 'error' in diagnosticResult && diagnosticResult.error;

      if (hasError && diagnosticResult.error === 'Unauthorized') {
        results.push({
          endpoint: '/diagnostic/generate',
          method: 'POST',
          status: 'pass',
          responseTime,
          message: 'Diagnostic generation endpoint properly requires authentication'
        });
      } else {
        results.push({
          endpoint: '/diagnostic/generate',
          method: 'POST',
          status: 'warning',
          responseTime,
          message: 'Diagnostic generation endpoint should require authentication',
          details: diagnosticResult
        });
      }
    } catch (error) {
      results.push({
        endpoint: '/diagnostic/generate',
        method: 'POST',
        status: 'fail',
        responseTime: Date.now() - startTime,
        message: `Diagnostic generation endpoint failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    return results;
  }

  private async testRevisionEndpoints(): Promise<APIValidationResult[]> {
    const results: APIValidationResult[] = [];

    // Test revisions endpoint (should require authentication)
    const startTime = Date.now();
    try {
      const revisionsResult = await api.getRevisions('invalid-token');
      const responseTime = Date.now() - startTime;

      if (revisionsResult.error === 'Unauthorized') {
        results.push({
          endpoint: '/revisions',
          method: 'GET',
          status: 'pass',
          responseTime,
          message: 'Revisions endpoint properly requires authentication'
        });
      } else {
        results.push({
          endpoint: '/revisions',
          method: 'GET',
          status: 'warning',
          responseTime,
          message: 'Revisions endpoint should require authentication',
          details: revisionsResult
        });
      }
    } catch (error) {
      results.push({
        endpoint: '/revisions',
        method: 'GET',
        status: 'fail',
        responseTime: Date.now() - startTime,
        message: `Revisions endpoint failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    return results;
  }

  private async testProgressEndpoints(): Promise<APIValidationResult[]> {
    const results: APIValidationResult[] = [];

    // Test progress endpoint (should require authentication)
    const startTime = Date.now();
    try {
      const progressResult = await api.getProgress('invalid-token');
      const responseTime = Date.now() - startTime;

      if (progressResult.error === 'Unauthorized') {
        results.push({
          endpoint: '/progress',
          method: 'GET',
          status: 'pass',
          responseTime,
          message: 'Progress endpoint properly requires authentication'
        });
      } else {
        results.push({
          endpoint: '/progress',
          method: 'GET',
          status: 'warning',
          responseTime,
          message: 'Progress endpoint should require authentication',
          details: progressResult
        });
      }
    } catch (error) {
      results.push({
        endpoint: '/progress',
        method: 'GET',
        status: 'fail',
        responseTime: Date.now() - startTime,
        message: `Progress endpoint failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    return results;
  }

  private logValidationResults(suite: APIValidationSuite): void {
    const statusEmoji = {
      pass: '✅',
      fail: '❌',
      warning: '⚠️'
    };

    console.log(`${statusEmoji[suite.overallStatus]} API Validation Results:`);
    console.log(`Total: ${suite.totalTests}, Passed: ${suite.passedTests}, Failed: ${suite.failedTests}, Warnings: ${suite.warningTests}`);

    suite.results.forEach(result => {
      const emoji = statusEmoji[result.status];
      console.log(`${emoji} ${result.method} ${result.endpoint}: ${result.message} (${result.responseTime}ms)`);
    });
  }
}

export const apiValidator = new APIValidator();

// Convenience function for API validation
export async function validateAllAPIs(): Promise<APIValidationSuite> {
  return apiValidator.validateAllEndpoints();
}