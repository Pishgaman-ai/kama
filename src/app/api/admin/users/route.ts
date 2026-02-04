import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import logger from "@/lib/logger";

// GET /api/admin/users - Fetch all users with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const sessionCookie = request.cookies.get("admin_session");
    if (!sessionCookie) {
      logger.error(
        "Unauthorized access to users API - no admin session cookie"
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse session cookie with error handling
    let admin;
    try {
      admin = JSON.parse(sessionCookie.value);
    } catch (parseError) {
      logger.error("Admin session cookie parse error", { error: parseError });
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Only allow admin users to access
    if (admin.role !== "school_admin") {
      logger.error("Access denied to users API - invalid role", {
        role: admin.role,
      });
      return NextResponse.json(
        { error: "Access restricted to administrators only" },
        { status: 403 }
      );
    }

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100); // Max 100 per page
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const schoolId = searchParams.get("schoolId") || "";

    const offset = (page - 1) * limit;

    // Build dynamic query based on filters
    let query = `
      SELECT 
        u.id, u.school_id, u.name, u.email, u.phone, u.national_id, 
        u.role, u.is_active, u.created_at, u.last_login, u.profile_picture_url,
        s.name as school_name
      FROM users u
      LEFT JOIN schools s ON u.school_id = s.id
    `;

    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIndex = 1;

    // Add search filter
    if (search) {
      conditions.push(
        `(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.phone ILIKE $${paramIndex} OR u.national_id ILIKE $${paramIndex})`
      );
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add role filter
    if (role && role !== "all") {
      conditions.push(`u.role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    // Add school filter
    if (schoolId && schoolId !== "all") {
      conditions.push(`u.school_id = $${paramIndex}`);
      params.push(schoolId);
      paramIndex++;
    }

    // Add conditions to query
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    // Add ordering and pagination
    query += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
    params.push(limit, offset);

    const client = await pool.connect();

    try {
      // Execute query
      const result = await client.query(query, params);

      // Get total count for pagination
      let countQuery = "SELECT COUNT(*) FROM users u";
      let countParams: (string | number)[] = [];

      if (conditions.length > 0) {
        countQuery += " WHERE " + conditions.join(" AND ");
        countParams = params.slice(0, params.length - 2); // Exclude LIMIT and OFFSET
      }

      const countResult = await client.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      // Format the response
      const users = result.rows.map((user) => ({
        id: user.id,
        school_id: user.school_id,
        school_name: user.school_name || "نامشخص",
        name: user.name,
        email: user.email,
        phone: user.phone,
        national_id: user.national_id,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
        last_login: user.last_login,
        profile_picture_url: user.profile_picture_url,
      }));

      return NextResponse.json({
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Error retrieving users", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Failed to retrieve users" },
      { status: 500 }
    );
  }
}
