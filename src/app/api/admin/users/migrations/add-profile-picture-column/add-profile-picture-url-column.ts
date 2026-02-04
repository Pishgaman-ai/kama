import pool from "@/lib/database";

async function addProfilePictureUrlColumn() {
  const client = await pool.connect();
  
  try {
    // Add profile_picture_url column to users table
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS profile_picture_url TEXT
    `);
    
    console.log("Successfully added profile_picture_url column to users table");
  } catch (error) {
    console.error("Error adding profile_picture_url column:", error);
  } finally {
    client.release();
  }
}

// Run the migration
addProfilePictureUrlColumn().catch(console.error);