const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting password column migration...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', 'add_initial_password_column.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    console.log('📊 Adding initial_password column to users table...');
    await client.query(migrationSQL);

    console.log('\n✅ Password column migration completed successfully!');
    console.log('\n📋 Important Notes:');
    console.log('   - New column "initial_password" has been added to users table');
    console.log('   - Existing teachers do NOT have initial_password set (will show as "-" in export)');
    console.log('   - New teachers created after this migration will have their password stored');
    console.log('\n⚠️  Security Note:');
    console.log('   - Passwords are encrypted using AES-256-CBC encryption');
    console.log('   - Make sure to set PASSWORD_ENCRYPTION_KEY in your .env.local file');
    console.log('   - Keep the encryption key secure and never commit it to version control');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
