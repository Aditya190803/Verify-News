/**
 * Centralized Logger Utility
 * 
 * Provides consistent logging with levels and environment-based filtering.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Default log level based on environment
const DEFAULT_LEVEL: LogLevel = import.meta.env.DEV ? 'debug' : 'info';

class Logger {
  private level: number;

  constructor(levelName: LogLevel = DEFAULT_LEVEL) {
    this.level = LOG_LEVELS[levelName];
  }

  setLevel(levelName: LogLevel) {
    this.level = LOG_LEVELS[levelName];
  }

  private shouldLog(levelName: LogLevel): boolean {
    return LOG_LEVELS[levelName] >= this.level;
  }

  debug(message: string, ...args: unknown[]) {
    if (this.shouldLog('debug')) {
      console.debug('[DEBUG]', message, ...args);
    }
  }

  info(message: string, ...args: unknown[]) {
    if (this.shouldLog('info')) {
      console.info('[INFO]', message, ...args);
    }
  }

  warn(message: string, ...args: unknown[]) {
    if (this.shouldLog('warn')) {
      console.warn('[WARN]', message, ...args);
    }
  }

  error(message: string, ...args: unknown[]) {
    if (this.shouldLog('error')) {
      console.error('[ERROR]', message, ...args);
    }
  }
}

export const logger = new Logger();
export default logger;
