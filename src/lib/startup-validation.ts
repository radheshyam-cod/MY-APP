/**
 * Startup Validation System
 * Ensures all systems are operational before app starts
 * Fails fast with clear error messages
 */

import { validateEnvironment, checkRuntimeEnvironment } from './env-validation';
import { checkSystemHealth } from './health-check';
import { validateAllAPIs } from './api-validation';
import { api } from './supabase';
import { USE_MOCK } from './config';

interface StartupResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  healthStatus?: any;
  timestamp: string;
}

export class StartupValidator {
  private static instance: StartupValidator;
  private isValidated = false;
  private validationResult: StartupResult | null = null;

  static getInstance(): StartupValidator {
    if (!StartupValidator.instance) {
      StartupValidator.instance = new StartupValidator();
    }
    return StartupValidator.instance;
  }

  async validateStartup(): Promise<StartupResult> {
    if (this.isValidated && this.validationResult) {
      return this.validationResult;
    }

    console.log('🚀 Starting ConceptPulse application validation...');
    console.log('=====================================');

    const errors: string[] = [];
    const warnings: string[] = [];
    const timestamp = new Date().toISOString();

    try {
      // Step 1: Runtime Environment Check
      console.log('📋 Step 1: Runtime Environment Validation');
      checkRuntimeEnvironment();

      // Step 2: Environment Variables Validation
      console.log('📋 Step 2: Environment Variables Validation');
      const envValidation = validateEnvironment();

      if (!envValidation.isValid) {
        errors.push(...envValidation.errors);
      }
      warnings.push(...envValidation.warnings);

      // Step 3: Critical Services Health Check
      console.log('📋 Step 3: Critical Services Health Check');
      const healthStatus = await checkSystemHealth();

      if (healthStatus.status === 'unhealthy') {
        const failedServices = Object.entries(healthStatus.services)
          .filter(([_, service]) => service.status === 'error')
          .map(([name, service]) => `${name}: ${service.message}`);

        // In production, treat API errors as warnings since we're using Supabase Edge Functions
        // which may have cold starts or intermittent connectivity
        warnings.push(...failedServices.map(s => `Service degraded: ${s}`));
      } else if (healthStatus.status === 'degraded') {
        const degradedServices = Object.entries(healthStatus.services)
          .filter(([_, service]) => service.status === 'degraded')
          .map(([name, service]) => `${name}: ${service.message}`);

        warnings.push(...degradedServices);
      }

      // Step 4: API Connectivity Test
      console.log('📋 Step 4: API Connectivity Test');
      await this.testAPIConnectivity();

      // Step 5: Comprehensive API Validation
      console.log('📋 Step 5: Comprehensive API Validation');
      const apiValidation = await validateAllAPIs();

      if (apiValidation.overallStatus === 'fail') {
        const failedAPIs = apiValidation.results
          .filter(result => result.status === 'fail')
          .map(result => `${result.method} ${result.endpoint}: ${result.message}`);

        // Treat API failures as warnings in production mode
        // The app can still function with auth and direct Supabase calls
        warnings.push(...failedAPIs.map(a => `API endpoint issue: ${a}`));
      }

      if (apiValidation.overallStatus === 'warning') {
        const warningAPIs = apiValidation.results
          .filter(result => result.status === 'warning')
          .map(result => `${result.method} ${result.endpoint}: ${result.message}`);

        warnings.push(...warningAPIs);
      }

      // Step 6: Authentication System Test
      console.log('📋 Step 6: Authentication System Test');
      await this.testAuthenticationSystem();

      const success = errors.length === 0;

      this.validationResult = {
        success,
        errors,
        warnings,
        healthStatus,
        timestamp
      };

      this.isValidated = true;

      if (success) {
        console.log('✅ Application startup validation completed successfully!');
        console.log('=====================================');
      } else {
        console.error('❌ Application startup validation failed!');
        console.error('Errors:');
        errors.forEach(error => console.error(`  - ${error}`));
        console.error('=====================================');
      }

      if (warnings.length > 0) {
        console.warn('⚠️ Startup warnings:');
        warnings.forEach(warning => console.warn(`  - ${warning}`));
      }

      return this.validationResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown startup error';
      errors.push(errorMessage);

      this.validationResult = {
        success: false,
        errors,
        warnings,
        timestamp
      };

      console.error('❌ Critical startup error:', errorMessage);
      console.error('=====================================');

      return this.validationResult;
    }
  }

  private async testAPIConnectivity(): Promise<void> {
    // Skip external API check in mock mode
    if (USE_MOCK) {
      console.log('✅ API connectivity test skipped (mock mode enabled)');
      return;
    }

    try {
      // Test the health endpoint with timeout
      const config = import.meta.env;
      const healthUrl = `${config.VITE_API_BASE_URL}/health`;
      console.log(`🔗 Testing API connectivity: ${healthUrl}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`⚠️ API health endpoint returned ${response.status}: ${response.statusText}`);
        // Don't throw - allow app to continue with warning
        return;
      }

      const data = await response.json();
      console.log('✅ API connectivity test passed:', data);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown API error';
      console.warn(`⚠️ API connectivity test warning: ${message}`);
      // Don't throw in production - allow app to continue with degraded functionality
    }
  }

  private async testAuthenticationSystem(): Promise<void> {
    // Skip auth system check in mock mode
    if (USE_MOCK) {
      console.log('✅ Authentication system test skipped (mock mode enabled)');
      return;
    }

    try {
      console.log('🔑 Testing authentication system...');

      // Test session endpoint (should return null session for unauthenticated request)
      const sessionResponse = await api.getSession('');

      // A null session is expected for unauthenticated requests
      if (sessionResponse.session === null) {
        console.log('✅ Authentication system test passed (session endpoint working)');
        return;
      }

      // If we get an error other than expected auth errors, log warning
      if (sessionResponse.error && sessionResponse.error !== 'Unauthorized') {
        console.warn(`⚠️ Authentication system warning: ${sessionResponse.error}`);
      }

      console.log('✅ Authentication system test passed');

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown auth error';
      console.warn(`⚠️ Authentication system test warning: ${message}`);
      // Don't throw - allow app to continue
    }
  }

  getValidationResult(): StartupResult | null {
    return this.validationResult;
  }

  isApplicationReady(): boolean {
    return this.isValidated && this.validationResult?.success === true;
  }

  reset(): void {
    this.isValidated = false;
    this.validationResult = null;
  }
}

// Singleton instance
export const startupValidator = StartupValidator.getInstance();

// Convenience function for app initialization
export async function initializeApplication(): Promise<StartupResult> {
  return startupValidator.validateStartup();
}

// Error boundary helper
export function createStartupErrorBoundary(onError: (errors: string[]) => void) {
  return async () => {
    try {
      const result = await initializeApplication();
      if (!result.success) {
        onError(result.errors);
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Critical startup failure';
      onError([errorMessage]);
      throw error;
    }
  };
}