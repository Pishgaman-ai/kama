import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

// GET /api/schools/[id] - Get a specific school (public endpoint)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: schoolId } = await params;

    const client = await pool.connect();

    try {
      // Fetch school details
      const result = await client.query(
        `SELECT 
          id, name, address, postal_code, phone, email, 
          established_year, grade_level, region, gender_type,
          website_url, contact_persons, latitude, longitude, logo_url, created_at
        FROM schools 
        WHERE id = $1`,
        [schoolId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "School not found" },
          { status: 404 }
        );
      }

      const school = result.rows[0];

      // Parse contact_persons if it's a string, otherwise use as is
      let parsedContactPersons = [];
      if (typeof school.contact_persons === "string") {
        try {
          parsedContactPersons = JSON.parse(school.contact_persons);
        } catch (parseError) {
          console.error("Error parsing contact_persons:", parseError);
          parsedContactPersons = [];
        }
      } else if (Array.isArray(school.contact_persons)) {
        parsedContactPersons = school.contact_persons;
      }

      // Format the response
      const schoolData = {
        id: school.id,
        name: school.name,
        address: school.address,
        postal_code: school.postal_code,
        phone: school.phone,
        email: school.email,
        established_year: school.established_year,
        grade_level: school.grade_level,
        region: school.region,
        gender_type: school.gender_type,
        website_url: school.website_url,
        contact_persons: parsedContactPersons,
        latitude: school.latitude,
        longitude: school.longitude,
        logo_url: school.logo_url,
        created_at: school.created_at,
      };

      return NextResponse.json({
        success: true,
        school: schoolData,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error retrieving school:", error);
    return NextResponse.json(
      { error: "Failed to retrieve school" },
      { status: 500 }
    );
  }
}
