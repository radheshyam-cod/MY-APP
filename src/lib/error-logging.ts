/**
 * Error Logging System
 * Centralized error handling and logging for ConceptPulse
 * Provides structured logging with context and stack traces
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  stackTrace?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

class ErrorLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'info';
    this.setupGlobalErrorHandlers();
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise
      });
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.error('Uncaught Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });

    // Handle React error boundaries (if needed)
    if (typeof window !== 'undefined') {
      (window as any).__REACT_ERROR_OVERLAY_GLOBAL_HOOK__ = {
        onBuildError: (error: Error) => {
          this.error('React Build Error', { error });
        },
        onRuntimeError: (error: Error) => {
          this.error('React Runtime Error', { error });
        }
      };
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'critical'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: ErrorContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context?.metadata,
      error,
      stackTrace: error?.stack,
      userId: context?.userId,
      sessionId: context?.sessionId,
      requestId: context?.requestId,
      component: context?.component,
      action: context?.action
    };

    return entry;
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output with appropriate styling
    this.outputToConsole(entry);

    // In production, you might want to send logs to a service
    if (import.meta.env.VITE_APP_ENV === 'production') {
      this.sendToLoggingService(entry);
    }
  }

  private outputToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;
    
    let message = `${prefix} ${entry.message}`;
    
    if (entry.component) {
      message += ` (${entry.component}`;
      if (entry.action) {
        message += `:${entry.action}`;
      }
      message += ')';
    }

    const consoleMethod = this.getConsoleMethod(entry.level);
    
    if (entry.context || entry.error) {
      consoleMethod(message, {
        ...(entry.context && { context: entry.context }),
        ...(entry.error && { error: entry.error }),
        ...(entry.userId && { userId: entry.userId }),
        ...(entry.sessionId && { sessionId: entry.sessionId }),
        ...(entry.requestId && { requestId: entry.requestId })
      });
    } else {
      consoleMethod(message);
    }
  }

  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case 'debug':
        return console.debug;
      case 'info':
        return console.info;
      case 'warn':
        return console.warn;
      case 'error':
      case 'critical':
        return console.error;
      default:
        return console.log;
    }
  }

  private async sendToLoggingService(entry: LogEntry): Promise<void> {
    try {
      // In a real implementation, send to your logging service
      // Example: Sentry, LogRocket, DataDog, etc.
      
      // For now, we'll just store in localStorage for debugging
      const existingLogs = localStorage.getItem('conceptpulse_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(entry);
      
      // Keep only last 100 logs in localStorage
      const recentLogs = logs.slice(-100);
      localStorage.setItem('conceptpulse_logs', JSON.stringify(recentLogs));
      
    } catch (error) {
      console.error('Failed to send log to service:', error);
    }
  }

  // Public logging methods
  debug(message: string, context?: ErrorContext): void {
    if (!this.shouldLog('debug')) return;
    const entry = this.createLogEntry('debug', message, context);
    this.addLog(entry);
  }

  info(message: string, context?: ErrorContext): void {
    if (!this.shouldLog('info')) return;
    const entry = this.createLogEntry('info', message, context);
    this.addLog(entry);
  }

  warn(message: string, context?: ErrorContext): void {
    if (!this.shouldLog('warn')) return;
    const entry = this.createLogEntry('warn', message, context);
    this.addLog(entry);
  }

  error(message: string, context?: ErrorContext, error?: Error): void {
    if (!this.shouldLog('error')) return;
    const entry = this.createLogEntry('error', message, context, error);
    this.addLog(entry);
  }

  critical(message: string, context?: ErrorContext, error?: Error): void {
    if (!this.shouldLog('critical')) return;
    const entry = this.createLogEntry('critical', message, context, error);
    this.addLog(entry);
  }

  // Utility methods
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem('conceptpulse_logs');
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // API error logging helper
  logAPIError(
    endpoint: string,
    method: string,
    error: Error | any,
    context?: ErrorContext
  ): void {
    this.error(`API Error: ${method} ${endpoint}`, {
      ...context,
      component: 'API',
      action: `${method} ${endpoint}`,
      metadata: {
        endpoint,
        method,
        error: error instanceof Error ? error.message : error,
        ...(context?.metadata || {})
      }
    }, error instanceof Error ? error : undefined);
  }

  // Authentication error logging
  logAuthError(action: string, error: Error | any, context?: ErrorContext): void {
    this.error(`Auth Error: ${action}`, {
      ...context,
      component: 'Authentication',
      action,
      metadata: {
        action,
        error: error instanceof Error ? error.message : error,
        ...(context?.metadata || {})
      }
    }, error instanceof Error ? error : undefined);
  }

  // Component error logging
  logComponentError(
    component: string,
    action: string,
    error: Error | any,
    context?: ErrorContext
  ): void {
    this.error(`Component Error: ${component}`, {
      ...context,
      component,
      action,
      metadata: {
        component,
        action,
        error: error instanceof Error ? error.message : error,
        ...(context?.metadata || {})
      }
    }, error instanceof Error ? error : undefined);
  }
}

// Singleton instance
export const logger = new ErrorLogger();

// Convenience functions
export const logDebug = (message: string, context?: ErrorContext) => logger.debug(message, context);
export const logInfo = (message: string, context?: ErrorContext) => logger.info(message, context);
export const logWarn = (message: string, context?: ErrorContext) => logger.warn(message, context);
export const logError = (message: string, context?: ErrorContext, error?: Error) => logger.error(message, context, error);
export const logCritical = (message: string, context?: ErrorContext, error?: Error) => logger.critical(message, context, error);

// React Error Boundary helper
export function createErrorBoundary(component: string) {
  return {
    componentDidCatch: (error: Error, errorInfo: any) => {
      logger.logComponentError(component, 'render', error, {
        metadata: {
          errorInfo,
          componentStack: errorInfo.componentStack
        }
      });
    }
  };
}

// API call wrapper with error logging
export async function withErrorLogging<T>(
  operation: () => Promise<T>,
  context: ErrorContext
): Promise<T> {
  try {
    const result = await operation();
    logger.debug(`Operation completed successfully`, context);
    return result;
  } catch (error) {
    logger.error(`Operation failed`, context, error instanceof Error ? error : undefined);
    throw error;
  }
}