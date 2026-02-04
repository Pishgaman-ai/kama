import pg from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Database configuration
const pool = new pg.Pool({
  host: process.env.DATABASE_HOST || "services.irn13.chabokan.net",
  port: parseInt(process.env.DATABASE_PORT || "14102"),
  database: process.env.DATABASE_NAME || "tina",
  user: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "IArkz382QprMfqTO",
  ssl: false,
});

async function populateMockAiResults() {
  const client = await pool.connect();

  try {
    // The specific activity ID you mentioned
    const activityId = "32be880d-0211-4fb3-8f1e-23e8bbc4b2b3";

    // Mock AI results for individual questions
    const mockQuestions = [
      {
        educational_activity_id: activityId,
        question_number: 1,
        question_text: "معادله‌ی ۲x + ۳ = ۱۱ را حل کنید.",
        student_answer: "x = ۴",
        score: 2,
        max_score: 3,
        analysis: {
          positives: ["روش حل صحیح", "پاسخ نهایی درست"],
          negatives: [],
          mistakes: [],
          corrected_version: "۲x + ۳ = ۱۱\n۲x = ۱۱ - ۳\n۲x = ۸\nx = ۴",
        },
      },
      {
        educational_activity_id: activityId,
        question_number: 2,
        question_text:
          "مساحت مثلثی با قاعده‌ی ۶ سانتی‌متر و ارتفاع ۴ سانتی‌متر چقدر است؟",
        student_answer: "۱۲ سانتی‌متر مربع",
        score: 3,
        max_score: 3,
        analysis: {
          positives: ["فرمول صحیح استفاده شده", "واحد اندازه‌گیری صحیح"],
          negatives: [],
          mistakes: [],
          corrected_version:
            "مساحت = (۱/۲) × قاعده × ارتفاع = (۱/۲) × ۶ × ۴ = ۱۲ سانتی‌متر مربع",
        },
      },
      {
        educational_activity_id: activityId,
        question_number: 3,
        question_text: "عدد ۲۴ را به عوامل اول تجزیه کنید.",
        student_answer: "۲ × ۲ × ۲ × ۳",
        score: 2,
        max_score: 3,
        analysis: {
          positives: ["تجزیه صحیح انجام شده"],
          negatives: ["نمایش نادرست - باید به صورت توان نوشته شود"],
          mistakes: ["نمایش بهتر: ۲³ × ۳"],
          corrected_version: "۲⁴ = ۲ × ۲ × ۲ × ۳ = ۲³ × ۳",
        },
      },
      {
        educational_activity_id: activityId,
        question_number: 4,
        question_text: "محیط دایره‌ای با قطر ۱۰ سانتی‌متر چقدر است؟ (π = ۳.۱۴)",
        student_answer: "۳۱.۴ سانتی‌متر",
        score: 3,
        max_score: 3,
        analysis: {
          positives: ["فرمول صحیح", "محاسبه صحیح", "واحد صحیح"],
          negatives: [],
          mistakes: [],
          corrected_version: "محیط = π × قطر = ۳.۱۴ × ۱۰ = ۳۱.۴ سانتی‌متر",
        },
      },
      {
        educational_activity_id: activityId,
        question_number: 5,
        question_text:
          "اگر نمرات دانش‌آموز در ۵ درس به ترتیب ۱۶، ۱۴، ۱۸، ۱۵، ۱۷ باشد، میانگین نمرات او چقدر است؟",
        student_answer: "۱۶",
        score: 2,
        max_score: 3,
        analysis: {
          positives: ["محاسبه صحیح", "پاسخ نهایی درست"],
          negatives: ["روش نوشته نشده"],
          mistakes: [],
          corrected_version: "(۱۶ + ۱۴ + ۱۸ + ۱۵ + ۱۷) ÷ ۵ = ۸۰ ÷ ۵ = ۱۶",
        },
      },
    ];

    // Insert mock data
    for (const question of mockQuestions) {
      await client.query(
        `INSERT INTO ai_question_results (
          educational_activity_id, 
          question_number, 
          question_text, 
          student_answer, 
          score, 
          max_score, 
          analysis
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          question.educational_activity_id,
          question.question_number,
          question.question_text,
          question.student_answer,
          question.score,
          parseInt(question.max_score), // Ensure max_score is stored as integer
          JSON.stringify(question.analysis),
        ]
      );
    }

    // Also update the educational_activities table to mark the AI processing as completed
    await client.query(
      `UPDATE educational_activities 
       SET status = 'Completed', 
           ai_score = $1,
           ai_results = $2
       WHERE id = $3`,
      [
        12, // Total score (sum of individual question scores)
        JSON.stringify({
          status: "completed",
          overall_score: 12,
          total_questions: 5,
          max_possible_score: 15,
        }),
        activityId,
      ]
    );

    console.log(
      `Mock AI results populated successfully for activity: ${activityId}`
    );
    console.log("Individual question results:");
    mockQuestions.forEach((q) => {
      console.log(
        `  Question ${q.question_number}: ${q.score}/${
          q.max_score
        } - ${q.question_text.substring(0, 30)}...`
      );
    });
  } catch (error) {
    console.error("Error populating mock AI results:", error);
  } finally {
    client.release();
  }
}

// Run the function
populateMockAiResults()
  .then(() => {
    console.log("Mock data population completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during mock data population:", error);
    process.exit(1);
  });
