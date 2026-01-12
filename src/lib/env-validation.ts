/**
 * Environment Validation System
 * Validates all required environment variables at startup
 * Fails fast if critical configuration is missing
 */

import { USE_MOCK } from './config';

interface EnvironmentConfig {
  // Supabase Configuration
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;

  // Server Configuration
  VITE_API_BASE_URL: string;
  VITE_APP_ENV: string;

  // Optional Configuration
  VITE_AI_API_KEY?: string;
  VITE_AI_SERVICE_URL?: string;
  VITE_STORAGE_BUCKET?: string;
  VITE_JWT_SECRET?: string;
  VITE_LOG_LEVEL?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: Partial<EnvironmentConfig>;
}

const REQUIRED_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_APP_ENV'
] as const;

// VITE_API_BASE_URL is only required when not in mock mode
const REQUIRED_WHEN_NOT_MOCK = [
  'VITE_API_BASE_URL'
] as const;

const OPTIONAL_VARS = [
  'VITE_AI_API_KEY',
  'VITE_AI_SERVICE_URL',
  'VITE_STORAGE_BUCKET',
  'VITE_JWT_SECRET',
  'VITE_LOG_LEVEL'
] as const;

export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const config: Partial<EnvironmentConfig> = {};

  console.log('🔍 Validating environment configuration...');

  // Check required variables
  for (const varName of REQUIRED_VARS) {
    const value = import.meta.env[varName];
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${varName}`);
    } else {
      config[varName] = value;
      console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
    }
  }

  // Check variables that are only required when not in mock mode
  if (!USE_MOCK) {
    for (const varName of REQUIRED_WHEN_NOT_MOCK) {
      const value = import.meta.env[varName];
      if (!value || value.trim() === '') {
        errors.push(`Missing required environment variable: ${varName}`);
      } else {
        config[varName] = value;
        console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
      }
    }
  } else {
    // In mock mode, set a default API URL if not provided
    config.VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    console.log('ℹ️ Mock mode enabled - using simulated API');
  }

  // Check optional variables
  for (const varName of OPTIONAL_VARS) {
    const value = import.meta.env[varName];
    if (!value || value.trim() === '') {
      warnings.push(`Optional environment variable not set: ${varName}`);
    } else {
      config[varName] = value;
      console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
    }
  }

  // Validate URL formats
  if (config.VITE_SUPABASE_URL && !isValidUrl(config.VITE_SUPABASE_URL)) {
    errors.push('VITE_SUPABASE_URL must be a valid URL');
  }

  if (config.VITE_API_BASE_URL && !isValidUrl(config.VITE_API_BASE_URL)) {
    errors.push('VITE_API_BASE_URL must be a valid URL');
  }

  // Validate environment
  if (config.VITE_APP_ENV && !['development', 'staging', 'production'].includes(config.VITE_APP_ENV)) {
    errors.push('VITE_APP_ENV must be one of: development, staging, production');
  }

  const isValid = errors.length === 0;

  if (isValid) {
    console.log('✅ Environment validation passed');
  } else {
    console.error('❌ Environment validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
  }

  if (warnings.length > 0) {
    console.warn('⚠️ Environment warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  return {
    isValid,
    errors,
    warnings,
    config
  };
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const validation = validateEnvironment();

  if (!validation.isValid) {
    throw new Error(`Environment validation failed:\n${validation.errors.join('\n')}`);
  }

  return validation.config as EnvironmentConfig;
}

// Runtime environment check
export function checkRuntimeEnvironment(): void {
  console.log('🔍 Checking runtime environment...');

  // Check Node.js version
  if (typeof process !== 'undefined' && process.versions?.node) {
    const nodeVersion = process.versions.node;
    const majorVersion = parseInt(nodeVersion.split('.')[0]);

    if (majorVersion < 18) {
      throw new Error(`Node.js version ${nodeVersion} is not supported. Please use Node.js 18 or higher.`);
    }

    console.log(`✅ Node.js version: ${nodeVersion}`);
  }

  // Check browser environment
  if (typeof window !== 'undefined') {
    console.log('✅ Running in browser environment');

    // Check for required browser APIs
    const requiredAPIs = ['fetch', 'localStorage', 'sessionStorage', 'URL'];
    const missingAPIs = requiredAPIs.filter(api => !(api in window));

    if (missingAPIs.length > 0) {
      throw new Error(`Missing required browser APIs: ${missingAPIs.join(', ')}`);
    }
  }

  console.log('✅ Runtime environment check passed');
}