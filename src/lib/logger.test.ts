import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from './logger';

describe('Logger Utility', () => {
  let consoleSpy: {
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
    debug: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
    };
    logger.setLevel('debug');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs info messages', () => {
    logger.info('test info');
    expect(consoleSpy.info).toHaveBeenCalledWith('test info');
  });

  it('logs warn messages', () => {
    logger.warn('test warn');
    expect(consoleSpy.warn).toHaveBeenCalledWith('test warn');
  });

  it('logs error messages', () => {
    logger.error('test error');
    expect(consoleSpy.error).toHaveBeenCalledWith('test error');
  });

  it('logs debug when level is debug', () => {
    logger.setLevel('debug');
    logger.debug('test debug');
    expect(consoleSpy.debug).toHaveBeenCalledWith('test debug');
  });

  it('does not log debug when level is info', () => {
    logger.setLevel('info');
    logger.debug('test debug');
    expect(consoleSpy.debug).not.toHaveBeenCalled();
  });
});