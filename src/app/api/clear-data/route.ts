import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const client = await pool.connect();

    try {
      // Start a transaction to ensure all deletions happen together
      await client.query('BEGIN');

      // Clear data from tables in correct order (respecting foreign key constraints)
      // Start with tables that have no foreign key dependencies to other project tables
      
      console.log("Clearing OTP tokens...");
      await client.query('DELETE FROM otp_tokens');
      
      console.log("Clearing password reset tokens...");
      await client.query('DELETE FROM password_reset_tokens');
      
      console.log("Clearing notifications...");
      await client.query('DELETE FROM notifications');
      
      console.log("Clearing AI logs...");
      await client.query('DELETE FROM ai_logs');
      
      console.log("Clearing exam grades...");
      await client.query('DELETE FROM exam_grades');
      
      console.log("Clearing answers...");
      await client.query('DELETE FROM answers');
      
      console.log("Clearing questions...");
      await client.query('DELETE FROM questions');
      
      console.log("Clearing exams...");
      await client.query('DELETE FROM exams');
      
      console.log("Clearing subjects...");
      await client.query('DELETE FROM subjects');
      
      console.log("Clearing parent-student relations...");
      await client.query('DELETE FROM parent_student_relations');
      
      console.log("Clearing class memberships...");
      await client.query('DELETE FROM class_memberships');
      
      console.log("Clearing classes...");
      await client.query('DELETE FROM classes');
      
      console.log("Clearing users...");
      await client.query('DELETE FROM users');
      
      console.log("Clearing schools...");
      await client.query('DELETE FROM schools');

      // Commit the transaction
      await client.query('COMMIT');

      console.log("All data cleared successfully from EduHelper project tables");
      
      return NextResponse.json({
        success: true,
        message: "تمام داده‌های جداول پروژه با موفقیت پاک شد",
        cleared_tables: [
          'otp_tokens',
          'password_reset_tokens', 
          'notifications',
          'ai_logs',
          'exam_grades',
          'answers',
          'questions',
          'exams',
          'subjects',
          'parent_student_relations',
          'class_memberships',
          'classes',
          'users',
          'schools'
        ]
      });

    } catch (error) {
      // Rollback the transaction in case of error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Error clearing data:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "خطا در پاک کردن داده‌ها",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// GET method to show which tables will be cleared (for safety)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "این endpoint برای پاک کردن داده‌های جداول پروژه EduHelper طراحی شده است",
    tables_to_be_cleared: [
      'otp_tokens - توکن‌های OTP',
      'password_reset_tokens - توکن‌های بازنشانی رمز عبور',
      'notifications - اعلان‌ها',
      'ai_logs - لاگ‌های هوش مصنوعی',
      'exam_grades - نمرات آزمون‌ها',
      'answers - پاسخ‌های دانش‌آموزان',
      'questions - سوالات آزمون‌ها',
      'exams - آزمون‌ها',
      'subjects - دروس',
      'parent_student_relations - روابط والدین-دانش‌آموز',
      'class_memberships - عضویت در کلاس‌ها',
      'classes - کلاس‌ها',
      'users - کاربران (شامل مدیران)',
      'schools - مدارس'
    ],
    warning: "⚠️ با استفاده از POST method تمام داده‌های این جداول پاک خواهد شد",
    note: "ساختار جداول دست نخورده باقی خواهد ماند"
  });
}