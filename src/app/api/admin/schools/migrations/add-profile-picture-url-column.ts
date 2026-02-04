import pool from "@/lib/database";

async function addProfilePictureUrlColumn() {
  const client = await pool.connect();

  try {
    // Check if profile_picture_url column exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'profile_picture_url'
    `);

    if (checkResult.rows.length === 0) {
      // Add profile_picture_url column to users table
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN profile_picture_url TEXT
      `);

      console.log(
        "Successfully added profile_picture_url column to users table"
      );
    } else {
      console.log("profile_picture_url column already exists in users table");
    }
  } catch (error) {
    console.error("Error adding profile_picture_url column:", error);
  } finally {
    client.release();
  }
}

// Run the migration
addProfilePictureUrlColumn().catch(console.error);
