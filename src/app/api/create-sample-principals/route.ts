import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const client = await pool.connect();

    try {
      // Get the first school for demo purposes
      const schoolResult = await client.query("SELECT id FROM schools LIMIT 1");

      if (schoolResult.rows.length === 0) {
        return NextResponse.json(
          { error: "No schools found. Please create a school first." },
          { status: 400 }
        );
      }

      const schoolId = schoolResult.rows[0].id;

      // Check if principals already exist for this school (check users table)
      const existingPrincipals = await client.query(
        "SELECT COUNT(*) as count FROM users WHERE school_id = $1 AND role = 'principal'",
        [schoolId]
      );

      if (parseInt(existingPrincipals.rows[0].count) > 0) {
        return NextResponse.json({
          success: true,
          message: "Sample principals already exist",
        });
      }

      // Create sample principals (only in users table)
      const principals = [
        { name: "دکتر احمد رضایی", phone: "09123456789" },
        { name: "مهندس فاطمه کریمی", phone: "09198765432" },
        { name: "دکتر محمد حسینی", phone: "09112345678" },
      ];

      for (const principal of principals) {
        await client.query(
          `
          INSERT INTO users (school_id, name, phone, role, profile, is_active)
          VALUES ($1, $2, $3, 'principal', '{"position": "principal"}'::jsonb, true)
        `,
          [schoolId, principal.name, principal.phone]
        );
      }

      return NextResponse.json({
        success: true,
        message: `${principals.length} sample principals created successfully`,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Sample principals creation error:", error);
    return NextResponse.json(
      { error: "Failed to create sample principals" },
      { status: 500 }
    );
  }
}
