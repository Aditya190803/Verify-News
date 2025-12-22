import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from './logger';

describe('Logger Utility', () => {
  let consoleSpy: {
    log: any;
    info: any;
    warn: any;
    error: any;
    debug: any;
  };

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log info messages', () => {
    logger.info('test info');
    expect(consoleSpy.info).toHaveBeenCalledWith('[INFO]', 'test info');
  });

  it('should log warn messages', () => {
    logger.warn('test warn');
    expect(consoleSpy.warn).toHaveBeenCalledWith('[WARN]', 'test warn');
  });

  it('should log error messages', () => {
    logger.error('test error');
    expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR]', 'test error');
  });

  it('should log debug messages when level is set to debug', () => {
    logger.setLevel('debug');
    logger.debug('test debug');
    expect(consoleSpy.debug).toHaveBeenCalledWith('[DEBUG]', 'test debug');
  });

  it('should NOT log debug messages when level is set to info', () => {
    logger.setLevel('info');
    logger.debug('test debug');
    expect(consoleSpy.debug).not.toHaveBeenCalled();
  });
});
