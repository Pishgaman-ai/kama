// Define log levels
export type LogLevel = "error" | "warn" | "info" | "debug";

// Define meta data type
export type LogMeta = Record<string, unknown> | undefined;

// Define log entry structure
export interface LogEntry {
  level: LogLevel;
  message: string;
  meta?: LogMeta;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  timestamp?: Date;
}

// Check if we're running on the server
const isServer = typeof window === "undefined";

// Logger class for professional logging
class Logger {
  private minLevel: LogLevel;
  private levels: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  };

  constructor(minLevel: LogLevel = "info") {
    this.minLevel = minLevel;
  }

  // Check if log level should be processed
  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] <= this.levels[this.minLevel];
  }

  // Save log to database (server-side only)
  private async saveToDatabase(logEntry: LogEntry): Promise<void> {
    // Only run on server
    if (!isServer) {
      return;
    }

    try {
      // Dynamically import the database module only on the server
      const { default: pool } = await import("@/lib/database");
      
      const client = await pool.connect();
      try {
        await client.query(
          `INSERT INTO logs (
            level, message, meta, user_id, ip_address, 
            user_agent, url, method, status_code, response_time
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            logEntry.level,
            logEntry.message,
            logEntry.meta ? JSON.stringify(logEntry.meta) : null,
            logEntry.userId || null,
            logEntry.ipAddress || null,
            logEntry.userAgent || null,
            logEntry.url || null,
            logEntry.method || null,
            logEntry.statusCode || null,
            logEntry.responseTime || null,
          ]
        );
      } finally {
        client.release();
      }
    } catch (error) {
      // If database logging fails, fallback to console
      console.error("Failed to save log to database:", error);
    }
  }

  // Format log for console output
  private formatConsoleLog(logEntry: LogEntry): string {
    const timestamp = logEntry.timestamp ? logEntry.timestamp.toISOString() : new Date().toISOString();
    const metaStr = logEntry.meta ? ` ${JSON.stringify(logEntry.meta)}` : "";
    return `[${timestamp}] ${logEntry.level.toUpperCase()}: ${logEntry.message}${metaStr}`;
  }

  // Generic log method
  private log(level: LogLevel, message: string, meta?: LogMeta): void {
    if (!this.shouldLog(level)) return;

    const logEntry: LogEntry = {
      level,
      message,
      meta,
      timestamp: new Date(),
    };

    // Log to console
    switch (level) {
      case "error":
        console.error(this.formatConsoleLog(logEntry));
        break;
      case "warn":
        console.warn(this.formatConsoleLog(logEntry));
        break;
      case "info":
        console.info(this.formatConsoleLog(logEntry));
        break;
      case "debug":
        console.debug(this.formatConsoleLog(logEntry));
        break;
    }

    // Save to database asynchronously (server-side only)
    if (isServer) {
      this.saveToDatabase(logEntry).catch((error) => {
        console.error("Failed to save log to database:", error);
      });
    }
  }

  // HTTP request logging
  async logHttpRequest(
    level: LogLevel,
    message: string,
    options: {
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
      url?: string;
      method?: string;
      statusCode?: number;
      responseTime?: number;
      meta?: LogMeta;
    }
  ): Promise<void> {
    if (!this.shouldLog(level)) return;

    const logEntry: LogEntry = {
      level,
      message,
      userId: options.userId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      url: options.url,
      method: options.method,
      statusCode: options.statusCode,
      responseTime: options.responseTime,
      meta: options.meta,
      timestamp: new Date(),
    };

    // Log to console
    console.log(this.formatConsoleLog(logEntry));

    // Save to database (server-side only)
    if (isServer) {
      await this.saveToDatabase(logEntry);
    }
  }

  // Error logging
  error(message: string, meta?: LogMeta): void {
    this.log("error", message, meta);
  }

  // Warning logging
  warn(message: string, meta?: LogMeta): void {
    this.log("warn", message, meta);
  }

  // Info logging
  info(message: string, meta?: LogMeta): void {
    this.log("info", message, meta);
  }

  // Debug logging
  debug(message: string, meta?: LogMeta): void {
    this.log("debug", message, meta);
  }
}

// Create and export a default logger instance
const logger = new Logger((process.env.LOG_LEVEL as LogLevel) || "info");

export default logger;