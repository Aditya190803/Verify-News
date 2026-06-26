import { isDevBuild } from '@/lib/runtimeEnv';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const DEFAULT_LEVEL: LogLevel = isDevBuild() ? 'debug' : 'info';

const levels: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

let currentLevel: LogLevel = DEFAULT_LEVEL;

export const logger = {
  setLevel(level: LogLevel) {
    currentLevel = level;
  },
  debug(...args: unknown[]) {
    if (levels[currentLevel] <= levels.debug) console.debug(...args);
  },
  info(...args: unknown[]) {
    if (levels[currentLevel] <= levels.info) console.info(...args);
  },
  warn(...args: unknown[]) {
    if (levels[currentLevel] <= levels.warn) console.warn(...args);
  },
  error(...args: unknown[]) {
    if (levels[currentLevel] <= levels.error) console.error(...args);
  },
};