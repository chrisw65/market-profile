/**
 * Centralized logging utility
 * Provides structured logging with context
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private context: LogContext = {};

  constructor(private readonly namespace: string) {}

  /**
   * Add persistent context to all logs
   */
  withContext(context: LogContext): Logger {
    const newLogger = new Logger(this.namespace);
    newLogger.context = { ...this.context, ...context };
    return newLogger;
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext) {
    this.log("debug", message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext) {
    this.log("info", message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext) {
    this.log("warn", message, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext: LogContext = {
      ...context,
    };

    if (error instanceof Error) {
      errorContext.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error) {
      errorContext.error = error;
    }

    this.log("error", message, errorContext);
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const mergedContext = { ...this.context, ...context };

    const logData = {
      timestamp,
      level,
      namespace: this.namespace,
      message,
      ...mergedContext,
    };

    // In development, use pretty console output
    if (process.env.NODE_ENV === "development") {
      const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.namespace}]`;

      switch (level) {
        case "debug":
          console.debug(prefix, message, mergedContext);
          break;
        case "info":
          console.info(prefix, message, mergedContext);
          break;
        case "warn":
          console.warn(prefix, message, mergedContext);
          break;
        case "error":
          console.error(prefix, message, mergedContext);
          break;
      }
    } else {
      // In production, output JSON for log aggregation
      console.log(JSON.stringify(logData));
    }
  }

  /**
   * Time an async operation
   */
  async time<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    this.debug(`Starting: ${operation}`);

    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.info(`Completed: ${operation}`, { duration_ms: duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`Failed: ${operation}`, error, { duration_ms: duration });
      throw error;
    }
  }
}

/**
 * Create a logger for a specific namespace
 */
export function createLogger(namespace: string): Logger {
  return new Logger(namespace);
}

/**
 * Pre-configured loggers for common namespaces
 */
export const loggers = {
  api: createLogger("api"),
  db: createLogger("database"),
  scraper: createLogger("scraper"),
  ai: createLogger("ai"),
  auth: createLogger("auth"),
  cache: createLogger("cache"),
};
