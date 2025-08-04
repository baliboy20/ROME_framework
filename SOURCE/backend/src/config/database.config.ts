import { MongoClient, type MongoClientOptions } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

export const dbConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  dbName: process.env.MONGODB_DB_NAME || 'medium_extractor',
  options: {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4
  } as MongoClientOptions
};

export const validateDbConfig = (): boolean => {
  if (!dbConfig.uri) {
    console.error('Missing MONGODB_URI in environment configuration');
    return false;
  }
  return true;
};