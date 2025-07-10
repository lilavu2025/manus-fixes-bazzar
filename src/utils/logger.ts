/**
 * Logger utility that only shows logs in development environment
 * In production, all console logs are suppressed to keep console clean
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: isDevelopment ? console.log : () => {},
  warn: isDevelopment ? console.warn : () => {},
  error: isDevelopment ? console.error : () => {},
  info: isDevelopment ? console.info : () => {},
  debug: isDevelopment ? console.debug : () => {},
};

// For backward compatibility
export const log = logger.log;
export const logWarn = logger.warn;
export const logError = logger.error;

export default logger;
