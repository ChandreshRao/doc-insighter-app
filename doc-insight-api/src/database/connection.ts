import knex from 'knex';
import { logger } from '../utils/logger';
import config from '../config';

let db: knex.Knex;

export function getDatabase(): knex.Knex {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export async function initializeDatabase(): Promise<void> {
  try {
    const environment = config.nodeEnv;
    
    // Create Knex instance for query building (no migrations)
    db = knex({
      client: 'postgresql',
      connection: config.dbUrl || {
        host: config.dbHost,
        port: config.dbPort,
        database: config.dbName,
        user: config.dbUser,
        password: config.dbPassword,
        ssl: config.dbSsl ? { rejectUnauthorized: false } : false,
      },
      pool: {
        min: 2,
        max: 20,
      },
      // No migrations - we use SQL scripts instead
    });
    
    logger.info('Database connection created');
    
    // Test the connection
    await db.raw('SELECT 1');
    logger.info(`Database connected successfully in ${environment} mode`);
    
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    try {
      await db.destroy();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection:', error);
    }
  }
}

export async function healthCheck(): Promise<boolean> {
  try {
    if (!db) {
      return false;
    }
    await db.raw('SELECT 1');
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await closeDatabase();
});

process.on('SIGINT', async () => {
  await closeDatabase();
});