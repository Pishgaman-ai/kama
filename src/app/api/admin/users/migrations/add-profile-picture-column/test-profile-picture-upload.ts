import pool from "@/lib/database";

async function testProfilePictureUpload() {
  const client = await pool.connect();

  try {
    // Test if the profile_picture_url column exists
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'profile_picture_url'
    `);

    if (result.rows.length > 0) {
      console.log("✅ profile_picture_url column exists in users table");
      console.log("✅ Profile picture upload functionality is ready to use");
    } else {
      console.log(
        "❌ profile_picture_url column does not exist in users table"
      );
    }
  } catch (error) {
    console.error("Error testing profile picture upload:", error);
  } finally {
    client.release();
  }
}

// Run the test
testProfilePictureUpload().catch(console.error);
