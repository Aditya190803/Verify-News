import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from './logger';

describe('Logger Utility', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
    debug: ReturnType<typeof vi.spyOn>;
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
    expect(consoleSpy.info).toHaveBeenCalled();
    const call = consoleSpy.info.mock.calls[0];
    expect(call[0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[INFO\]/);
    expect(call[1]).toBe('test info');
  });

  it('should log warn messages', () => {
    logger.warn('test warn');
    expect(consoleSpy.warn).toHaveBeenCalled();
    const call = consoleSpy.warn.mock.calls[0];
    expect(call[0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[WARN\]/);
    expect(call[1]).toBe('test warn');
  });

  it('should log error messages', () => {
    logger.error('test error');
    expect(consoleSpy.error).toHaveBeenCalled();
    const call = consoleSpy.error.mock.calls[0];
    expect(call[0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[ERROR\]/);
    expect(call[1]).toBe('test error');
  });

  it('should log debug messages when level is set to debug', () => {
    logger.setLevel('debug');
    logger.debug('test debug');
    expect(consoleSpy.debug).toHaveBeenCalled();
    const call = consoleSpy.debug.mock.calls[0];
    expect(call[0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[DEBUG\]/);
    expect(call[1]).toBe('test debug');
  });

  it('should NOT log debug messages when level is set to info', () => {
    logger.setLevel('info');
    logger.debug('test debug');
    expect(consoleSpy.debug).not.toHaveBeenCalled();
  });

  it('should support context binding with withContext', () => {
    const contextLogger = logger.withContext({ requestId: '123' });
    expect(contextLogger).toBeDefined();
    expect(contextLogger.getLevel()).toBe(logger.getLevel());
  });
});
