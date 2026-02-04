import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

interface School {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  role: string;
  school_id: string;
}

interface Class {
  id: string;
  name: string;
  school_id: string;
}

interface SchoolStats {
  total_teachers: string;
  total_students: string;
  total_parents: string;
  total_classes: string;
}

interface SchoolDetail {
  school: School;
  stats: SchoolStats;
  users: User[];
  classes: Class[];
}

interface DebugResult {
  schools: School[];
  schoolDetails: SchoolDetail[];
}

export async function GET(request: NextRequest) {
  try {
    const client = await pool.connect();

    try {
      // Get all schools
      const schoolsResult = await client.query("SELECT id, name FROM schools");
      
      const result: DebugResult = {
        schools: schoolsResult.rows,
        schoolDetails: []
      };

      // For each school, get counts
      for (const school of schoolsResult.rows) {
        const statsResult = await client.query(
          `
          SELECT 
            COUNT(DISTINCT CASE WHEN role = 'teacher' AND is_active = true THEN id END) as total_teachers,
            COUNT(DISTINCT CASE WHEN role = 'student' AND is_active = true THEN id END) as total_students,  
            COUNT(DISTINCT CASE WHEN role = 'parent' AND is_active = true THEN id END) as total_parents,
            (SELECT COUNT(*) FROM classes WHERE school_id = $1) as total_classes
          FROM users 
          WHERE school_id = $1
        `,
          [school.id]
        );

        const usersResult = await client.query(
          "SELECT id, name, role, school_id FROM users WHERE school_id = $1 ORDER BY role, name",
          [school.id]
        );

        const classesResult = await client.query(
          "SELECT id, name, school_id FROM classes WHERE school_id = $1",
          [school.id]
        );

        result.schoolDetails.push({
          school: school,
          stats: statsResult.rows[0],
          users: usersResult.rows,
          classes: classesResult.rows
        });
      }

      return NextResponse.json(result);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Debug dashboard API error:", error);
    return NextResponse.json(
      { error: "خطا در بارگذاری اطلاعات" },
      { status: 500 }
    );
  }
}