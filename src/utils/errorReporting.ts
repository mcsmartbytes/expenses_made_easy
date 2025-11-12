/**
 * Error Reporting Utility
 *
 * Centralized error logging and reporting service.
 * In production, this could integrate with services like:
 * - Sentry
 * - Bugsnag
 * - Firebase Crashlytics
 * - Custom backend error logging
 */

interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  userId?: string;
  screen?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ErrorReportingService {
  private errors: ErrorReport[] = [];
  private maxStoredErrors = 50;

  /**
   * Log an error for debugging and reporting
   */
  logError(
    error: Error,
    context?: {
      screen?: string;
      userId?: string;
      severity?: ErrorReport['severity'];
      componentStack?: string;
    }
  ) {
    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: context?.componentStack,
      timestamp: new Date().toISOString(),
      userId: context?.userId,
      screen: context?.screen,
      severity: context?.severity || 'medium',
    };

    // Store error locally
    this.errors.push(errorReport);
    if (this.errors.length > this.maxStoredErrors) {
      this.errors.shift(); // Remove oldest error
    }

    // Log to console in development
    if (__DEV__) {
      console.error('🔴 Error Report:', errorReport);
    }

    // In production, send to error reporting service
    // Example: this.sendToSentry(errorReport);
    // Example: this.sendToFirebase(errorReport);
  }

  /**
   * Log a warning (non-critical error)
   */
  logWarning(message: string, context?: { screen?: string; userId?: string }) {
    const warning = new Error(message);
    this.logError(warning, { ...context, severity: 'low' });
  }

  /**
   * Log critical error that requires immediate attention
   */
  logCritical(error: Error, context?: { screen?: string; userId?: string }) {
    this.logError(error, { ...context, severity: 'critical' });
  }

  /**
   * Get all stored errors (for debugging or manual reporting)
   */
  getErrors(): ErrorReport[] {
    return [...this.errors];
  }

  /**
   * Clear all stored errors
   */
  clearErrors() {
    this.errors = [];
  }

  /**
   * Send error to external service (placeholder)
   */
  private async sendToExternalService(errorReport: ErrorReport) {
    // TODO: Implement integration with error reporting service
    // Example Sentry integration:
    // Sentry.captureException(new Error(errorReport.message), {
    //   contexts: {
    //     app: {
    //       screen: errorReport.screen,
    //       severity: errorReport.severity,
    //     },
    //   },
    //   user: { id: errorReport.userId },
    // });
  }
}

// Export singleton instance
export const errorReporting = new ErrorReportingService();

/**
 * Helper function to safely execute async operations with error handling
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  options?: {
    fallback?: T;
    onError?: (error: Error) => void;
    context?: { screen?: string; userId?: string };
  }
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    errorReporting.logError(err, options?.context);

    if (options?.onError) {
      options.onError(err);
    }

    return options?.fallback;
  }
}

/**
 * Helper function to safely execute synchronous operations with error handling
 */
export function safeSync<T>(
  operation: () => T,
  options?: {
    fallback?: T;
    onError?: (error: Error) => void;
    context?: { screen?: string; userId?: string };
  }
): T | undefined {
  try {
    return operation();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    errorReporting.logError(err, options?.context);

    if (options?.onError) {
      options.onError(err);
    }

    return options?.fallback;
  }
}
