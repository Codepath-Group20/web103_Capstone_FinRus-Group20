import pg from 'pg';
// Connect to a Postgres database
//One common way to connect to a Postgres database is using a connection pool. A connection pool is a cache of database connections maintained so that the connections can be reused when needed, rather than being opened and closed for each database transaction.
// //To do this, we need to create a configuration object and pass it to the pg.Pool constructor. Then we can use the connection pool object to query the database by acquiring a client from the pool, executing queries on the client, and then releasing the client back to the pool.
const config={
user:process.env.PGUSER,
password:process.env.PGPASSWORD,
host:process.env.PGHOST,
port:process.env.PGPORT,
database:process.env.PGDATABASE,
// ssl:{rejectUnauthorized:false}
}
// Create a new pool instance
// FIX: Separate const declaration from export default
const pool = new pg.Pool(config)

export default pool;
