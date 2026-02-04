# AI Grading Service Integration Guide

This document provides detailed instructions for the AI backend service on how to process grading requests and store results in the EduHelper database.

## Request Format

The AI grading service receives HTTP POST requests with the following JSON payload:

```json
{
  "activity_id": "string (UUID)",
  "activity_title": "string",
  "question_file_url": "string (optional)",
  "answer_file_url": "string (optional)",
  "teacher_instruction": "string",
  "teacher_national_id": "string"
}
```

### Field Descriptions

| Field                 | Type              | Description                                                    |
| --------------------- | ----------------- | -------------------------------------------------------------- |
| `activity_id`         | UUID              | Unique identifier for the educational activity in the database |
| `activity_title`      | String            | Title of the educational activity                              |
| `question_file_url`   | String (Optional) | URL to access the question file in cloud storage               |
| `answer_file_url`     | String (Optional) | URL to access the answer file in cloud storage                 |
| `teacher_instruction` | String            | Specific instructions from the teacher for grading             |
| `teacher_national_id` | String            | National ID of the teacher (for authentication)                |

## Database Schema

The EduHelper database contains the following relevant tables for AI grading:

### `educational_activities` Table

This table stores information about educational activities:

```sql
CREATE TABLE educational_activities (
  id UUID PRIMARY KEY,
  class_id UUID,
  subject_id UUID,
  student_id UUID,
  teacher_id UUID,
  activity_type VARCHAR(50),
  activity_title VARCHAR(255),
  activity_date DATE,
  quantitative_score NUMERIC,
  qualitative_evaluation TEXT,
  question_file_url TEXT,
  answer_file_url TEXT,
  teacher_note TEXT,
  status VARCHAR(50),
  ai_results JSONB,
  ai_score NUMERIC,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### `ai_question_results` Table

This table stores detailed results for each question:

```sql
CREATE TABLE ai_question_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  educational_activity_id UUID REFERENCES educational_activities(id),
  question_number INTEGER,
  question_text TEXT,
  student_answer TEXT,
  score NUMERIC,
  max_score NUMERIC,
  analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Processing Workflow

### 1. Initial Request Processing

When the AI service receives the first request for an activity:

1. **Validate the request**:

   - Verify the `teacher_national_id` exists in the system
   - Confirm the `activity_id` exists and belongs to the teacher
   - Check that files are accessible via the provided URLs

2. **Update activity status**:
   ```sql
   UPDATE educational_activities
   SET status = 'ai_processing'
   WHERE id = $1 AND teacher_id = (
     SELECT id FROM users WHERE national_id = $2
   );
   ```

### 2. Grading Process

The AI should analyze the files and generate results in the following format:

#### For Each Question:

- Question number
- Question text
- Student's answer
- Score and maximum score
- Detailed analysis including:
  - Positives
  - Negatives
  - Mistakes
  - Corrected version

### 3. Storing Results

#### Update Educational Activity:

```sql
UPDATE educational_activities
SET
  status = 'ai_graded',
  ai_score = $1,
  ai_results = $2,
  updated_at = NOW()
WHERE id = $3;
```

#### Insert Question Results:

For each question, insert a record into `ai_question_results`:

```sql
INSERT INTO ai_question_results (
  educational_activity_id,
  question_number,
  question_text,
  student_answer,
  score,
  max_score,
  analysis
) VALUES ($1, $2, $3, $4, $5, $6, $7);
```

The `analysis` field should be a JSON object with this structure:

```json
{
  "positives": ["string array of positive points"],
  "negatives": ["string array of negative points"],
  "mistakes": ["string array of identified mistakes"],
  "corrected_version": "string with corrected answer"
}
```

## Response Format

The AI service should respond with the following JSON format:

```json
{
  "output": "string (Markdown formatted response for the teacher)"
}
```

The response should include:

- Summary of the grading process
- Overall score
- Key insights
- Recommendations for the teacher

## Status Transitions

The educational activity status should transition as follows:

1. `files_uploaded` → `ai_processing` (when AI starts processing)
2. `ai_processing` → `ai_graded` (when AI completes grading)
3. `ai_graded` → `teacher_reviewed` (when teacher reviews AI results)
4. `teacher_reviewed` → `finalized` (when teacher confirms final grades)

## Error Handling

If any errors occur during processing:

1. Update the activity status to `ai_error`
2. Store error details in the `ai_results` field
3. Return an appropriate error message to the teacher

```sql
UPDATE educational_activities
SET
  status = 'ai_error',
  ai_results = '{"error": "description of the error"}',
  updated_at = NOW()
WHERE id = $1;
```

## Example Workflow

### Request:

```json
{
  "activity_id": "32be880d-0211-4fb3-8f1e-23e8bbc4b2b3",
  "activity_title": "آزمون فصل اول ریاضی",
  "question_file_url": "/api/image?key=educational-activities%2Fquestions%2Fbce6c37f-5835-443a-a74b-1d558b2bbb5e.pdf",
  "answer_file_url": "/api/image?key=educational-activities%2Fanswers%2F6f3080de-45a6-498c-b1ad-3b074731ef90.pdf",
  "teacher_instruction": "لطفاً پاسخ‌های دانش‌آموز را با دقت بررسی کن و نکات مثبت و منفی را تحلیل کن",
  "teacher_national_id": "0035566778"
}
```

### Database Updates:

1. **Initial status update**:

   ```sql
   UPDATE educational_activities
   SET status = 'ai_processing'
   WHERE id = '32be880d-0211-4fb3-8f1e-23e8bbc4b2b3';
   ```

2. **After processing**:

   ```sql
   UPDATE educational_activities
   SET
     status = 'ai_graded',
     ai_score = 18.5,
     ai_results = '{"total_questions": 5, "average_score": 3.7}',
     updated_at = NOW()
   WHERE id = '32be880d-0211-4fb3-8f1e-23e8bbc4b2b3';
   ```

3. **Insert question results**:
   ```sql
   INSERT INTO ai_question_results (
     educational_activity_id,
     question_number,
     question_text,
     student_answer,
     score,
     max_score,
     analysis
   ) VALUES (
     '32be880d-0211-4fb3-8f1e-23e8bbc4b2b3',
     1,
     'Solve the equation: 2x + 5 = 15',
     '2x = 15 - 5 = 10, so x = 5',
     2,
     2,
     '{"positives": ["Correct method", "Clear steps"], "negatives": [], "mistakes": [], "corrected_version": "2x + 5 = 15 → 2x = 15 - 5 → 2x = 10 → x = 5"}'
   );
   ```

### Response:

```json
{
  "output": "# تحلیل آزمون فصل اول ریاضی\n\n## نمره کل: ۱۸.۵ از ۲۰\n\n## تحلیل تک‌سوالی:\n\n### سؤال ۱:\n- **نمره:** ۲ از ۲\n- **نکات مثبت:** روش صحیح، مراحل واضح\n- **پیشنهادات:** بدون نیاز به بهبود\n\n---\n\n*برای مشاهده تحلیل کامل همه سؤالات، لطفاً به صفحه تصحیح هوش مصنوعی مراجعه کنید.*"
}
```

## Security Considerations

1. Always validate the `teacher_national_id` against the system
2. Ensure file URLs are accessible only through the application
3. Implement rate limiting to prevent abuse
4. Log all AI processing activities for audit purposes
