import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    // This endpoint should only be accessible in development
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "Not allowed in production" },
        { status: 403 }
      );
    }

    const result = await initializeDatabase();

    if (result) {
      return NextResponse.json({
        success: true,
        message: "Database initialized successfully",
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Database initialization failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Database initialization error:", error);
    return NextResponse.json(
      { success: false, error: "Database initialization failed" },
      { status: 500 }
    );
  }
}
