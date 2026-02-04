require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'services.irn13.chabokan.net',
  port: parseInt(process.env.DATABASE_PORT || '14102'),
  database: process.env.DATABASE_NAME || 'tina',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'IArkz382QprMfqTO',
  ssl: false
});

async function checkSchools() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT id, name, logo_url FROM schools LIMIT 3');
    console.log('Schools with logo_url:');
    result.rows.forEach(row => console.log(row));
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchools();