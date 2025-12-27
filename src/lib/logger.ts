/**
 * Centralized Logger Utility
 * 
 * Provides consistent logging with levels, structured logging support,
 * and environment-based filtering for debugging and monitoring.
 * 
 * @example
 * ```typescript
 * // Basic usage
 * logger.info('User logged in', { userId: '123' });
 * logger.error('Failed to fetch data', { error: err.message });
 * 
 * // Debug logging (only in development)
 * logger.debug('Cache hit', { key: 'user_data' });
 * 
 * // Structured logging with context
 * logger.withContext({ requestId: '456' }).info('Processing request');
 * ```
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
  context?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Default log level based on environment
const DEFAULT_LEVEL: LogLevel = import.meta.env.DEV ? 'debug' : 'info';

/**
 * Logger class providing structured logging with log levels
 * 
 * Features:
 * - Log level filtering (debug, info, warn, error)
 * - Structured logging with JSON-serializable data
 * - Environment-aware defaults (debug in dev, info in prod)
 * - Context binding for request-scoped logging
 */
class Logger {
  private level: number;
  private context: Record<string, unknown> = {};

  constructor(levelName: LogLevel = DEFAULT_LEVEL, context: Record<string, unknown> = {}) {
    this.level = LOG_LEVELS[levelName];
    this.context = context;
  }

  /**
   * Set the minimum log level
   * @param levelName - The minimum level to log ('debug' | 'info' | 'warn' | 'error')
   */
  setLevel(levelName: LogLevel): void {
    this.level = LOG_LEVELS[levelName];
  }

  /**
   * Get the current log level name
   */
  getLevel(): LogLevel {
    return (Object.entries(LOG_LEVELS).find(([, v]) => v === this.level)?.[0] as LogLevel) || 'info';
  }

  /**
   * Create a new logger instance with additional context
   * Useful for adding request IDs or user context to all subsequent logs
   * @param additionalContext - Key-value pairs to add to all log entries
   */
  withContext(additionalContext: Record<string, unknown>): Logger {
    return new Logger(this.getLevel(), { ...this.context, ...additionalContext });
  }

  private shouldLog(levelName: LogLevel): boolean {
    return LOG_LEVELS[levelName] >= this.level;
  }

  private formatEntry(level: LogLevel, message: string, args: unknown[]): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (args.length > 0) {
      entry.data = args.length === 1 ? args[0] : args;
    }

    if (Object.keys(this.context).length > 0) {
      entry.context = this.context;
    }

    return entry;
  }

  /**
   * Log debug messages - only shown in development
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      const entry = this.formatEntry('debug', message, args);
      console.debug(`[${entry.timestamp}] [DEBUG]`, message, ...args);
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      const entry = this.formatEntry('info', message, args);
      console.info(`[${entry.timestamp}] [INFO]`, message, ...args);
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      const entry = this.formatEntry('warn', message, args);
      console.warn(`[${entry.timestamp}] [WARN]`, message, ...args);
    }
  }

  /**
   * Log error messages
   */
  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      const entry = this.formatEntry('error', message, args);
      console.error(`[${entry.timestamp}] [ERROR]`, message, ...args);
    }
  }

  /**
   * Log a structured entry as JSON (useful for log aggregation services)
   */
  json(level: LogLevel, message: string, data?: unknown): void {
    if (this.shouldLog(level)) {
      const entry = this.formatEntry(level, message, data ? [data] : []);
      console.log(JSON.stringify(entry));
    }
  }
}

export const logger = new Logger();
export type { LogLevel, LogEntry };
export default logger;
