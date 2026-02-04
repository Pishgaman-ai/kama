const { Pool } = require('pg');
const crypto = require('crypto');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Encryption configuration (same as in passwordEncryption.ts)
const ENCRYPTION_KEY = process.env.PASSWORD_ENCRYPTION_KEY || 'your-32-char-secret-key-change-this!!';
const ALGORITHM = 'aes-256-cbc';

function encryptPassword(password) {
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32), 'utf8');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

async function updateExistingTeachers() {
  const client = await pool.connect();

  try {
    console.log('🔄 Starting to update existing teachers with initial passwords...\n');

    // Get all teachers without initial_password
    const teachersResult = await client.query(`
      SELECT id, name, phone, email
      FROM users
      WHERE role = 'teacher' AND initial_password IS NULL
    `);

    const teachers = teachersResult.rows;

    if (teachers.length === 0) {
      console.log('✅ No teachers need updating. All teachers already have initial_password set.');
      return;
    }

    console.log(`📋 Found ${teachers.length} teachers to update:\n`);

    let updatedCount = 0;

    for (const teacher of teachers) {
      // For existing teachers, use phone as the default password
      const defaultPassword = teacher.phone;
      const encryptedPassword = encryptPassword(defaultPassword);

      await client.query(
        'UPDATE users SET initial_password = $1 WHERE id = $2',
        [encryptedPassword, teacher.id]
      );

      updatedCount++;
      console.log(`   ✓ Updated ${teacher.name} (${teacher.email || teacher.phone})`);
    }

    console.log(`\n✅ Successfully updated ${updatedCount} teachers!`);
    console.log('\n📝 Summary:');
    console.log(`   - Total teachers updated: ${updatedCount}`);
    console.log(`   - Default password for all: Their phone number`);
    console.log('\n⚠️  Important:');
    console.log('   - Inform teachers to change their password after first login');
    console.log('   - The initial password is now retrievable via Excel export');

  } catch (error) {
    console.error('❌ Update failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateExistingTeachers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
