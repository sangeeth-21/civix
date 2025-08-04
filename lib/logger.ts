/**
 * Logger utility for the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogPayload {
  message: string;
  [key: string]: unknown;
}

/**
 * Simple logger for the application
 * In a production environment, this would be replaced with a more robust solution
 * like winston, pino, or other logging libraries
 */
class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isTest = process.env.NODE_ENV === 'test';

  /**
   * Log a debug message
   * @param message - The message to log
   * @param payload - Optional additional data to log
   */
  debug(message: string, payload?: Record<string, unknown>): void {
    this.log('debug', { message, ...payload });
  }

  /**
   * Log an informational message
   * @param message - The message to log
   * @param payload - Optional additional data to log
   */
  info(message: string, payload?: Record<string, unknown>): void {
    this.log('info', { message, ...payload });
  }

  /**
   * Log a warning message
   * @param message - The message to log
   * @param payload - Optional additional data to log
   */
  warn(message: string, payload?: Record<string, unknown>): void {
    this.log('warn', { message, ...payload });
  }

  /**
   * Log an error message
   * @param message - The message to log
   * @param payload - Optional additional data to log
   */
  error(message: string, payload?: Record<string, unknown>): void {
    this.log('error', { message, ...payload });
  }

  /**
   * Log a message with a specific log level
   * @param level - The log level
   * @param payload - The data to log
   */
  private log(level: LogLevel, payload: LogPayload): void {
    // Skip logging in test environment
    if (this.isTest) {
      return;
    }

    // In development, pretty print the log
    if (this.isDevelopment) {
      const timestamp = new Date().toISOString();
      const { message, ...data } = payload;
      
      switch (level) {
        case 'debug':
          // eslint-disable-next-line no-console
          console.debug(`[${timestamp}] 🐛 DEBUG: ${message}`, Object.keys(data).length ? data : '');
          break;
        case 'info':
          // eslint-disable-next-line no-console
          console.info(`[${timestamp}] ℹ️ INFO: ${message}`, Object.keys(data).length ? data : '');
          break;
        case 'warn':
          // eslint-disable-next-line no-console
          console.warn(`[${timestamp}] ⚠️ WARN: ${message}`, Object.keys(data).length ? data : '');
          break;
        case 'error':
          // eslint-disable-next-line no-console
          console.error(`[${timestamp}] 🔴 ERROR: ${message}`, Object.keys(data).length ? data : '');
          break;
      }
      return;
    }

    // In production, use structured logging (JSON format)
    const logData = {
      timestamp: new Date().toISOString(),
      level,
      ...payload,
    };

    // In production we would typically use a more robust logging solution
    // This is a simple fallback
    switch (level) {
      case 'debug':
        // eslint-disable-next-line no-console
        console.debug(JSON.stringify(logData));
        break;
      case 'info':
        // eslint-disable-next-line no-console
        console.info(JSON.stringify(logData));
        break;
      case 'warn':
        // eslint-disable-next-line no-console
        console.warn(JSON.stringify(logData));
        break;
      case 'error':
        // eslint-disable-next-line no-console
        console.error(JSON.stringify(logData));
        break;
    }
  }
}

// Create a singleton logger instance
export const logger = new Logger();

/**
 * Create a namespace logger that includes a namespace in all logs
 * @param namespace - The namespace to include in logs
 */
export const createNamespaceLogger = (namespace: string) => {
  return {
    debug: (message: string, payload?: Record<string, unknown>) => logger.debug(message, { namespace, ...payload }),
    info: (message: string, payload?: Record<string, unknown>) => logger.info(message, { namespace, ...payload }),
    warn: (message: string, payload?: Record<string, unknown>) => logger.warn(message, { namespace, ...payload }),
    error: (message: string, payload?: Record<string, unknown>) => logger.error(message, { namespace, ...payload }),
  };
};

export default logger; 