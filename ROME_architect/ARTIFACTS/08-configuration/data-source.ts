import { DataSource } from 'typeorm';
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
