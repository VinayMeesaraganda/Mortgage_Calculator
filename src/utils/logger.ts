// Centralized logging utility
// Replaces console.log/error/warn with environment-aware logging

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enableDebug: boolean;
  enableInfo: boolean;
  enableWarn: boolean;
  enableError: boolean;
}

class Logger {
  private config: LoggerConfig;

  constructor() {
    // In production, only log errors
    const isProduction = import.meta.env.PROD;
    
    this.config = {
      enableDebug: !isProduction,
      enableInfo: !isProduction,
      enableWarn: true,
      enableError: true,
    };
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return data ? `${prefix} ${message}` : `${prefix} ${message}`;
  }

  debug(message: string, data?: unknown): void {
    if (this.config.enableDebug) {
      console.log(this.formatMessage('debug', message, data), data || '');
    }
  }

  info(message: string, data?: unknown): void {
    if (this.config.enableInfo) {
      console.log(this.formatMessage('info', message, data), data || '');
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.config.enableWarn) {
      console.warn(this.formatMessage('warn', message, data), data || '');
    }
  }

  error(message: string, error?: unknown): void {
    if (this.config.enableError) {
      console.error(this.formatMessage('error', message, error), error || '');
      
      // In production, you might want to send errors to a monitoring service
      // e.g., Sentry, LogRocket, etc.
      if (import.meta.env.PROD) {
        // TODO: Send to error tracking service
      }
    }
  }

  // Group related logs
  group(label: string): void {
    if (!import.meta.env.PROD) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (!import.meta.env.PROD) {
      console.groupEnd();
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Helper functions for common logging patterns
export const logFirestoreOperation = (operation: string, data: Record<string, unknown>): void => {
  logger.info(`Firestore ${operation}`, data);
};

export const logFirestoreError = (operation: string, error: unknown): void => {
  logger.error(`Firestore ${operation} failed`, error);
};

export const logCalculation = (type: string, result: unknown): void => {
  logger.debug(`Calculation: ${type}`, result);
};

export const logUserAction = (action: string, details?: unknown): void => {
  logger.info(`User action: ${action}`, details);
};

