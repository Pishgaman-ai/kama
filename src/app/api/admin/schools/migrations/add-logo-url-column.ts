import pool from "@/lib/database";

async function addLogoUrlColumn() {
  const client = await pool.connect();
  
  try {
    // Add logo_url column to schools table
    await client.query(`
      ALTER TABLE schools 
      ADD COLUMN IF NOT EXISTS logo_url TEXT
    `);
    
    console.log("Successfully added logo_url column to schools table");
  } catch (error) {
    console.error("Error adding logo_url column:", error);
  } finally {
    client.release();
  }
}

// Run the migration
addLogoUrlColumn().catch(console.error);