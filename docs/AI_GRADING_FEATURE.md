# AI Grading Feature Implementation

## Overview

This document describes the implementation of the AI grading feature for educational activities, allowing teachers to upload question and answer files for AI-based assessment.

## Components Implemented

### 1. Database Migration

- Added new columns to the `educational_activities` table:
  - `question_file_url` (TEXT) - URL to question files stored in cloud storage
  - `answer_file_url` (TEXT) - URL to answer files stored in cloud storage
  - `teacher_note` (TEXT) - Teacher notes for the activity
  - `status` (VARCHAR(50)) - Status of the activity (e.g., pending, graded, reviewed)
  - `ai_results` (JSONB) - JSON results from AI grading
  - `ai_score` (NUMERIC) - Score assigned by AI grading

### 2. API Endpoints

- `/api/teacher/educational-activities` (GET) - Fetch all educational activities for a teacher
- `/api/teacher/educational-activities/[id]/upload-files` (POST) - Upload question and answer files for an activity

### 3. Frontend Components

- New page: `/dashboard/teacher/educational-activities` - UI for managing educational activities and uploading files
- Added navigation item to teacher dashboard sidebar

## How It Works

1. Teachers navigate to the "فعالیت‌های آموزشی" section in their dashboard
2. They can see a list of all their educational activities
3. For each activity, they can upload question and/or answer files
4. Files are stored in cloud storage (Chabokan) and URLs are saved in the database
5. The activity status is updated to "files_uploaded"

## File Storage

Files are stored in Chabokan cloud storage with the following folder structure:

- Questions: `educational-activities/questions/`
- Answers: `educational-activities/answers/`

## Security

- Only authenticated teachers can access their own activities
- File uploads are validated and stored securely
- Access to files is controlled through the application

## Future Enhancements

- AI grading processing pipeline
- Teacher review interface for AI results
- Notification system for grading completion
