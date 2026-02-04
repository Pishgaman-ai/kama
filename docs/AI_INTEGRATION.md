# AI Service Integration

This document explains how to use the AI service integration for the EduHelper application.

## Overview

The AI service integration allows users to communicate with role-specific AI assistants through webhook endpoints. Each user role (principal, teacher, parent, student) has a dedicated AI assistant endpoint.

## Endpoints

The AI service uses the following endpoints:

- **Principal/Manager**: `https://n8n-new40407.chbk.app/webhook/kama_manager_v1`
- **Teacher**: `https://n8n-new40407.chbk.app/webhook/kama_teacher_v1`
- **Parent**: `https://n8n-new40407.chbk.app/webhook/kama_parent_v1`
- **Student**: `https://n8n-new40407.chbk.app/webhook/kama_student_v1`

## Implementation

The AI service is implemented in `src/lib/aiService.ts` and provides the following functions:

1. `sendQueryToAI(query, nationalCode, role)` - Generic function to send queries to any role-specific AI
2. `sendQueryToPrincipalAI(query, nationalCode)` - Send queries to the principal AI
3. `sendQueryToTeacherAI(query, nationalCode)` - Send queries to the teacher AI
4. `sendQueryToParentAI(query, nationalCode)` - Send queries to the parent AI
5. `sendQueryToStudentAI(query, nationalCode)` - Send queries to the student AI

## Usage

### In API Routes

```typescript
import { sendQueryToAI } from "@/lib/aiService";

// Send a query to the appropriate AI based on user role
const result = await sendQueryToAI(query, nationalCode, userRole);

if (result.success) {
  console.log("AI Response:", result.response);
} else {
  console.error("AI Error:", result.error);
}
```

### Required User Properties

For the AI service to work correctly, users must have the following properties:

- `national_code`: The user's national identification code
- `role`: The user's role (principal, teacher, parent, student)

## Testing

You can test the AI service integration using the following methods:

1. **API Test Endpoint**: Visit `/api/test-ai-service` to test the AI service
2. **Test Page**: Visit `/test-ai-chat` to test the AI chat interface
3. **Direct Testing**: Use the functions in `src/lib/aiService.ts` directly in your code

## Error Handling

The AI service provides comprehensive error handling:

- Network errors
- Invalid responses
- Role mapping errors
- Missing required parameters

All functions return an object with a `success` boolean and either a `response` or `error` property.
