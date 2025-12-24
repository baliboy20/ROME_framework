/**
 * /generate-logging-config skill (Tier 1)
 * Generates logging configuration
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');

class GenerateLoggingConfig {
  static async execute(params, executionId) {
    const { design_directory, output_directory, logger_library = 'winston' } = params;

    try {
      const filesGenerated = [];

      if (logger_library === 'winston') {
        const loggerCode = this.generateWinstonLogger();
        fs.writeFileSync(path.join(output_directory, 'logger.ts'), loggerCode);
        filesGenerated.push('logger.ts');
      }

      return { files_generated: filesGenerated };

    } catch (error) {
      throw new Error(`Logging configuration generation failed: ${error.message}`);
    }
  }

  static generateWinstonLogger() {
    return `import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';
const logFormat = process.env.LOG_FORMAT || 'json';

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  logFormat === 'json'
    ? winston.format.json()
    : winston.format.printf(({ level, message, timestamp, ...metadata }) => {
        let msg = \`\${timestamp} [\${level}]: \${message}\`;
        if (Object.keys(metadata).length > 0) {
          msg += JSON.stringify(metadata);
        }
        return msg;
      })
);

export const logger = winston.createLogger({
  level: logLevel,
  format: customFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

export default logger;
`;
  }
}

module.exports = GenerateLoggingConfig;
