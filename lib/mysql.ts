import mysql from 'mysql2/promise';
import { createNamespaceLogger } from './logger';

const dbLogger = createNamespaceLogger('mysql-database');

// MySQL connection configuration for cPanel hosting
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'civix_production',
  port: parseInt(process.env.DB_PORT || '3306'),
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  charset: 'utf8mb4'
};

// Create connection pool
let pool: mysql.Pool | null = null;

export async function getConnection() {
  try {
    if (!pool) {
      pool = mysql.createPool(dbConfig);
      dbLogger.info('MySQL connection pool created successfully');
    }
    
    const connection = await pool.getConnection();
    dbLogger.debug('MySQL connection acquired from pool');
    return connection;
  } catch (error) {
    dbLogger.error('MySQL connection error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      config: {
        host: dbConfig.host,
        database: dbConfig.database,
        port: dbConfig.port
      }
    });
    throw error;
  }
}

export async function executeQuery<T = any>(
  query: string, 
  params: any[] = []
): Promise<T> {
  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute(query, params);
    dbLogger.debug('Query executed successfully', { query, params });
    return rows as T;
  } catch (error) {
    dbLogger.error('Query execution error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      query,
      params
    });
    throw error;
  } finally {
    if (connection) {
      connection.release();
      dbLogger.debug('MySQL connection released back to pool');
    }
  }
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    dbLogger.info('MySQL connection pool closed');
  }
}

// Health check function
export async function checkConnection(): Promise<boolean> {
  try {
    const connection = await getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    return false;
  }
}