# AI Chat Feature Documentation

## Overview

This document explains how to use the AI chat feature that has been implemented for administrators, principals, teachers, and parents in the kama system.

## Features

- Chat interface similar to ChatGPT
- Role-based context awareness
- Integration with OpenAI API
- Clean and responsive UI
- Accessible from each user's dashboard

## Implementation Details

### 1. API Endpoint

The AI chat functionality is powered by a Next.js API route:

- Path: `/api/ai-chat`
- Method: POST
- Authentication: Requires valid user session

### 2. Frontend Component

A reusable React component `AIChat` has been created:

- File: `src/app/components/AIChat.tsx`
- Features:
  - Message history display
  - Real-time typing indicators
  - Responsive design
  - Error handling

### 3. Dashboard Integration

The AI chat feature has been integrated into all relevant dashboards:

- Admin dashboard: `/admin/ai-chat`
- Principal dashboard: `/dashboard/principal/ai-chat`
- Teacher dashboard: `/dashboard/teacher/ai-chat`
- Parent dashboard: `/dashboard/parent/ai-chat`

## How It Works

### User Context

When a user interacts with the AI chat, the system automatically provides context about:

- User role (admin, principal, teacher, parent)
- School information
- User ID and name

This context helps the AI provide more relevant responses.

### API Communication

1. User sends a message through the chat interface
2. The frontend sends the message to `/api/ai-chat`
3. The API validates user authentication
4. The API adds user context to the conversation
5. The API calls OpenAI's GPT model
6. The response is returned to the frontend
7. The frontend displays the AI response

## Configuration

### Environment Variables

To use the AI chat feature, you need to configure the following environment variable in `.env.local`:

```
OPENAI_API_KEY=your-openai-api-key-here
```

### Customization

The system is designed to be easily customizable:

- To switch from OpenAI to your own AI model, modify the API route in `src/app/api/ai-chat/route.ts`
- To customize the AI's behavior, modify the system message in the API route
- To change the UI, modify the `AIChat` component

## Access Points

### For Administrators

- Navigate to Admin Dashboard
- Click on "کمک‌کننده هوشمند" in the sidebar
- URL: `/admin/ai-chat`

### For Principals

- Navigate to Principal Dashboard
- Click on "کمک‌کننده هوشمند" in the sidebar
- URL: `/dashboard/principal/ai-chat`

### For Teachers

- Navigate to Teacher Dashboard
- Click on "کمک‌کننده هوشمند" in the sidebar
- URL: `/dashboard/teacher/ai-chat`

### For Parents

- Navigate to Parent Dashboard
- Click on "کمک‌کننده هوشمند" in the sidebar
- URL: `/dashboard/parent/ai-chat`

## Future Enhancements

- Conversation history persistence
- Multi-language support
- Voice input/output
- Integration with school data for more personalized responses
