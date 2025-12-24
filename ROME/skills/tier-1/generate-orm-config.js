/**
 * /generate-orm-config skill (Tier 1)
 * Generates ORM configuration
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');

class GenerateORMConfig {
  static async execute(params, executionId) {
    const { design_directory, output_directory, orm_type = 'typeorm' } = params;

    try {
      const filesGenerated = [];

      if (orm_type === 'typeorm') {
        const config = this.generateTypeORMConfig();
        fs.writeFileSync(path.join(output_directory, 'ormconfig.ts'), config);
        filesGenerated.push('ormconfig.ts');

        const dataSource = this.generateTypeORMDataSource();
        fs.writeFileSync(path.join(output_directory, 'data-source.ts'), dataSource);
        filesGenerated.push('data-source.ts');
      }

      return { files_generated: filesGenerated };

    } catch (error) {
      throw new Error(`ORM configuration generation failed: ${error.message}`);
    }
  }

  static generateTypeORMConfig() {
    return `import { DataSourceOptions } from 'typeorm';

export const ormConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'app_db',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: ['src/entities/**/*.ts'],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: ['src/subscribers/**/*.ts'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  extra: {
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    max: parseInt(process.env.DB_POOL_MAX || '10'),
  },
};

export default ormConfig;
`;
  }

  static generateTypeORMDataSource() {
    return `import { DataSource } from 'typeorm';
import { ormConfig } from './ormconfig';

export const AppDataSource = new DataSource(ormConfig);

export async function initializeDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');
    return AppDataSource;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

export default AppDataSource;
`;
  }
}

module.exports = GenerateORMConfig;
