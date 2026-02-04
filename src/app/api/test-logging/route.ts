import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Log different types of messages
    logger.debug("Debug message - testing logging system", { 
      test: true, 
      timestamp: new Date().toISOString() 
    });
    
    logger.info("Info message - logging system is working", { 
      userId: "test-user-123",
      action: "test-logging"
    });
    
    logger.warn("Warning message - this is a test warning", { 
      warningType: "test-warning",
      severity: "low"
    });
    
    // Simulate an error for testing
    logger.error("Error message - testing error logging", { 
      error: "This is a test error",
      errorCode: 500,
      userId: "test-user-123"
    });
    
    const responseTime = Date.now() - startTime;
    
    // Log the HTTP request
    logger.logHttpRequest("info", "Test logging endpoint accessed", {
      userId: "test-user-123",
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
      userAgent: request.headers.get("user-agent") || "",
      url: request.url,
      method: request.method,
      statusCode: 200,
      responseTime
    });
    
    return NextResponse.json({
      success: true,
      message: "Logging test completed successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error("Error in test logging endpoint", { 
      error: error instanceof Error ? error.message : String(error)
    });
    
    return NextResponse.json(
      { error: "Failed to test logging" },
      { status: 500 }
    );
  }
}