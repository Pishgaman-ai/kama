# AI Service Integration Guide

This document provides guidelines for the AI backend service to integrate with the EduHelper platform, specifically for processing educational activities.

## Overview

The AI service needs to:

1. Fetch educational activities with uploaded question/answer files
2. Process these files for grading
3. Store detailed results in the database
4. Update activity status upon completion

## Database Structure

### Educational Activities Table

The main table containing activity information:

```sql
educational_activities (
  id UUID PRIMARY KEY,
  class_id UUID,
  subject_id UUID,
  student_id UUID,
  teacher_id UUID,
  activity_type VARCHAR(50),
  activity_title VARCHAR(255),
  activity_date DATE,
  question_file_url TEXT,  -- URL to question file in cloud storage
  answer_file_url TEXT,     -- URL to answer file in cloud storage
  status VARCHAR(50),       -- Current processing status
  ai_score NUMERIC,         -- Overall score assigned by AI
  ai_results JSONB          -- Summary results from AI processing
)
```

### AI Question Results Table

Detailed results for individual questions:

```sql
ai_question_results (
  id UUID PRIMARY KEY,
  educational_activity_id UUID REFERENCES educational_activities(id),
  question_number INTEGER,
  question_text TEXT,
  student_answer TEXT,
  score NUMERIC,
  max_score NUMERIC,
  analysis JSONB           -- Detailed analysis including positives, negatives, mistakes, corrected version
)
```

## Processing Workflow

### 1. Fetch Activities for Processing

The AI service should periodically query for activities that are ready for processing:

```sql
SELECT id, question_file_url, answer_file_url, teacher_note
FROM educational_activities
WHERE status = 'files_uploaded'
ORDER BY created_at ASC
LIMIT 10
```

### 2. Download Files

Download the question and answer files from the provided URLs:

- `question_file_url`: Contains the questions
- `answer_file_url`: Contains the student's answers

### 3. Process Files

Analyze the files to:

- Extract individual questions
- Match student answers to questions
- Grade each answer
- Provide detailed analysis

### 4. Store Results

For each educational activity, store the results in two tables:

#### a. Update Educational Activities Table

```sql
UPDATE educational_activities
SET
  status = 'Completed',
  ai_score = 15.5,
  ai_results = '{"status": "completed", "overall_score": 15.5, "total_questions": 5}'
WHERE id = 'activity-uuid'
```

#### b. Insert Detailed Question Results

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
) VALUES (
  'activity-uuid',
  1,
  'Solve the equation 2x + 3 = 11',
  'x = 4',
  2,
  3,
  '{"positives": ["Correct method", "Right final answer"], "negatives": [], "mistakes": [], "corrected_version": "2x + 3 = 11\n2x = 11 - 3\n2x = 8\nx = 4"}'
)
```

## Data Format Requirements

### Analysis JSON Structure

The `analysis` field in `ai_question_results` should follow this structure:

```json
{
  "positives": ["Array of positive points"],
  "negatives": ["Array of negative points"],
  "mistakes": ["Array of identified mistakes"],
  "corrected_version": "Corrected version of the answer"
}
```

### Status Values

The `status` field in `educational_activities` should use these values:

- `files_uploaded`: Files have been uploaded, ready for AI processing
- `Pending` or `Processing`: AI is currently processing
- `Completed`: AI processing is finished

## API Endpoints for Reference

### File Upload Endpoint

```
POST /api/teacher/educational-activities/{id}/upload-files
```

Teachers use this to upload question and answer files.

### AI Results Endpoint

```
GET /api/teacher/educational-activities/{id}/ai-results
```

Teachers use this to fetch AI grading results.

## Error Handling

The AI service should:

1. Handle file download errors gracefully
2. Log processing errors for debugging
3. Update activity status to indicate failures when appropriate
4. Retry failed operations with exponential backoff

## Security Considerations

1. All file URLs are pre-signed and time-limited
2. The AI service should not store files locally longer than necessary
3. All database connections should use proper authentication
4. Results should only be stored for the specific activity being processed

## Example Implementation Flow

1. Query for activities with `status = 'files_uploaded'`
2. For each activity:
   a. Download question and answer files
   b. Process files and generate scores/analysis
   c. Update `educational_activities` with overall results
   d. Insert detailed results into `ai_question_results`
   e. Set activity status to `Completed`

This approach ensures that all AI processing results are properly stored and can be retrieved by teachers through the EduHelper platform.
