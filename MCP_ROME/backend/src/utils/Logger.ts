/**
 * Logger Utility
 * 
 * Centralized logging for the MCP Documentation Server
 * Provides structured logging with different levels and contexts
 * 
 * Author: Reena (Backend Developer)
 * Date: 2025-08-06
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: any;
}

export class Logger {
  private component: string;
  private logLevel: LogLevel;

  constructor(component: string, logLevel: LogLevel = 'info') {
    this.component = component;
    this.logLevel = this.parseLogLevel();
  }

  private parseLogLevel(): LogLevel {
    const envLevel = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;
    const validLevels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return validLevels.includes(envLevel) ? envLevel : 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levelOrder: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };

    return levelOrder[level] >= levelOrder[this.logLevel];
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      component: this.component,
      message,
      ...(context && { context })
    };

    return JSON.stringify(logEntry);
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      process.stderr.write(this.formatMessage('debug', message, context) + '\n');
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      process.stderr.write(this.formatMessage('info', message, context) + '\n');
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      process.stderr.write(this.formatMessage('warn', message, context) + '\n');
    }
  }

  error(message: string, errorOrContext?: Error | LogContext, context?: LogContext): void {
    if (!this.shouldLog('error')) return;

    let actualContext: LogContext = {};
    
    // Handle both error object and context scenarios
    if (errorOrContext instanceof Error) {
      actualContext = {
        error: {
          name: errorOrContext.name,
          message: errorOrContext.message,
          stack: process.env.NODE_ENV === 'development' ? errorOrContext.stack : undefined
        },
        ...(context || {})
      };
    } else if (errorOrContext) {
      actualContext = errorOrContext;
    }

    process.stderr.write(this.formatMessage('error', message, actualContext) + '\n');
  }
}