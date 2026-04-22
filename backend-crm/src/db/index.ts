import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT ?? '5432', 10),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max:                    20,
  idleTimeoutMillis:      30_000,
  connectionTimeoutMillis: 2_000,
});

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle DB client', err);
  process.exit(-1);
});

/**
 * Run a parameterised query.
 * Generic T lets callers type the returned rows: query<UserRow>('SELECT ...', [...])
 */
const query = <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> => pool.query<T>(text, params);

/**
 * Obtain a client for multi-statement transactions.
 * Always call client.release() in a finally block.
 */
const getClient = (): Promise<PoolClient> => pool.connect();

export { query, getClient, pool };