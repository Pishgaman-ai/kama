// AI Service for communicating with OpenAI GPT-4
// This service handles AI communication using OpenAI API with role-based system prompts

import OpenAI from "openai";
import { getRolePromptConfig } from "./aiPrompts";
import pool from "./database";

type LanguageModelSource = "cloud" | "local";

const LOCAL_AI_BASE_URL =
  process.env.LOCAL_AI_BASE_URL || "http://127.0.0.1:8080/v1";
const LOCAL_AI_MODEL =
  process.env.LOCAL_AI_MODEL || "openai/gpt-oss-20b";

function getOpenAIClient(modelSource: LanguageModelSource) {
  if (modelSource === "local") {
    return new OpenAI({
      apiKey: process.env.LOCAL_AI_API_KEY || "local-ai",
      baseURL: LOCAL_AI_BASE_URL,
    });
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
  });
}

function resolveModel(modelSource: LanguageModelSource, fallbackModel: string) {
  return modelSource === "local" ? LOCAL_AI_MODEL : fallbackModel;
}

async function getUserLanguageModelSourceByNationalId(
  nationalId: string
): Promise<LanguageModelSource> {
  try {
    const result = await pool.query(
      "SELECT profile FROM users WHERE national_id = $1",
      [nationalId]
    );
    const profile = result.rows[0]?.profile || {};
    return profile.language_model === "local" ? "local" : "cloud";
  } catch (error) {
    console.error("Failed to load language model preference:", error);
    return "cloud";
  }
}

// Type definitions for chat requests
interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface AIRequest {
  activity_id?: string;
  activity_title?: string;
  question_file_url?: string;
  answer_file_url?: string;
  teacher_instruction?: string;
  teacher_national_id?: string;
}

interface GradingAIRequest {
  activity_id: string;
  activity_title: string;
  question_file_url?: string;
  answer_file_url?: string;
  teacher_instruction: string;
}

// Role mapping - all valid roles
const VALID_ROLES = ["principal", "manager", "teacher", "parent", "student", "grading"] as const;
type UserRole = (typeof VALID_ROLES)[number];

const ROLE_MAPPING: Record<string, UserRole> = {
  principal: "principal",
  manager: "principal",
  teacher: "teacher",
  parent: "parent",
  student: "student",
  grading: "grading",
};

/**
 * Sends a chat message to OpenAI with role-based system prompt (streaming)
 * @param messages Array of chat messages
 * @param role User role for determining system prompt
 * @returns Readable stream for AI response
 */
export async function sendChatToOpenAIStream(
  messages: ChatMessage[],
  role: UserRole,
  modelSource: LanguageModelSource = "cloud"
): Promise<ReadableStream> {
  // Validate OpenAI API key only for cloud mode
  if (modelSource === "cloud" && !process.env.OPENAI_API_KEY) {
    throw new Error("???? API OpenAI ????? ???? ???. ????? ?? ???? ????? ???? ??????.");
  }

  // Get role-specific configuration
  const roleConfig = getRolePromptConfig(role);

  // Prepare messages with system prompt
  const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: roleConfig.systemPrompt,
    },
    ...messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
  ];

  // Call OpenAI API with stream
  const client = getOpenAIClient(modelSource);
  const stream = await client.chat.completions.create({
    model: resolveModel(modelSource, roleConfig.model),
    messages: chatMessages,
    temperature: roleConfig.temperature,
    max_tokens: roleConfig.maxTokens,
    stream: true,
  });

  // Create a ReadableStream for Next.js
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      } catch (error: any) {
        console.error("OpenAI Stream error:", error);
        controller.error(error);
      }
    },
  });
}

/**
 * Sends a chat message to OpenAI with role-based system prompt (non-streaming)
 * @param messages Array of chat messages
 * @param role User role for determining system prompt
 * @returns AI response
 */
async function sendChatToOpenAI(
  messages: ChatMessage[],
  role: UserRole,
  modelSource: LanguageModelSource
): Promise<{ success: boolean; response?: string; error?: string }> {
  try {
    // Validate OpenAI API key only for cloud mode
    if (modelSource === "cloud" && !process.env.OPENAI_API_KEY) {
      return {
        success: false,
        error: "???? API OpenAI ????? ???? ???. ????? ?? ???? ????? ???? ??????.",
      };
    }

    // Get role-specific configuration
    const roleConfig = getRolePromptConfig(role);

    // Prepare messages with system prompt
    const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: roleConfig.systemPrompt,
      },
      ...messages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ];

    // Call OpenAI API
    const client = getOpenAIClient(modelSource);
    const completion = await client.chat.completions.create({
      model: resolveModel(modelSource, roleConfig.model),
      messages: chatMessages,
      temperature: roleConfig.temperature,
      max_tokens: roleConfig.maxTokens,
    });

    // Extract response
    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      return {
        success: false,
        error: "????? ?? ??? ?????? ?????? ???. ????? ?????? ???? ????.",
      };
    }

    return {
      success: true,
      response: responseContent,
    };
  } catch (error: any) {
    console.error("OpenAI API error:", error);

    // Handle specific OpenAI errors
    let errorMessage = "??? ?? ?????? ?? ????? ??? ??????";

    if (error?.error?.type === "invalid_request_error") {
      errorMessage = "??????? ??????? ?? ????? ??? ??????";
    } else if (error?.error?.type === "authentication_error") {
      errorMessage = "??? ?? ????? ???? ?? ????? ??? ??????";
    } else if (error?.error?.type === "rate_limit_error") {
      errorMessage = "??????? ????? ???????. ????? ??? ???? ???? ???? ????.";
    } else if (error?.error?.type === "insufficient_quota") {
      errorMessage = "?????? ????? ??? ?????? ?? ????? ????? ???.";
    } else if (error?.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Sends a query to the AI assistant based on user role
 * @param query User query or activity data
 * @param nationalId The user's national ID
 * @param role The user's role (principal, teacher, parent, student, grading)
 * @returns The AI assistant's response
 */
export async function sendQueryToAI(
  query: string | AIRequest | GradingAIRequest,
  nationalId: string,
  role: string
): Promise<{ success: boolean; response?: string; error?: string }> {
  try {
    // Validate inputs
    if (!query || !nationalId || !role) {
      return {
        success: false,
        error: "??????? ????? ???? ???",
      };
    }

    // Map the role to the AI role
    const aiRole = ROLE_MAPPING[role];
    if (!aiRole) {
      return {
        success: false,
        error: `??? ?????? ???????: ${role}`,
      };
    }

    // Prepare the message content
    let messageContent: string;

    if (typeof query === "string") {
      // Simple text query for chat
      messageContent = query;
    } else {
      // Structured data for grading or other tasks
      messageContent = formatStructuredQuery(query, role);
    }

    // Send to OpenAI
    const messages: ChatMessage[] = [
      {
        role: "user",
        content: messageContent,
      },
    ];

    const modelSource = await getUserLanguageModelSourceByNationalId(nationalId);
    return await sendChatToOpenAI(messages, aiRole, modelSource);
  } catch (error) {
    console.error("AI Service error:", error);
    return {
      success: false,
      error: "??? ?? ?????? ??????? ??? ??????",
    };
  }
}

/**
 * Format structured query (for grading, activities, etc.)
 * @param data Structured data
 * @param role User role
 * @returns Formatted message
 */
function formatStructuredQuery(data: AIRequest | GradingAIRequest, role: string): string {
  if (role === "grading") {
    const gradingData = data as GradingAIRequest;
    let message = `????? ????? ??? ?? ????? ? ????? ????:

`;
    message += `????? ??????: ${gradingData.activity_title}
`;
    message += `????? ??????: ${gradingData.activity_id}

`;

    if (gradingData.teacher_instruction) {
      message += `?????????? ????:
${gradingData.teacher_instruction}

`;
    }

    if (gradingData.question_file_url) {
      message += `???? ????: ${gradingData.question_file_url}
`;
    }

    if (gradingData.answer_file_url) {
      message += `???? ????: ${gradingData.answer_file_url}
`;
    }

    return message;
  }

  // For other structured queries
  const activityData = data as AIRequest;
  let message = "";

  if (activityData.activity_title) {
    message += `?????: ${activityData.activity_title}

`;
  }

  if (activityData.teacher_instruction) {
    message += activityData.teacher_instruction;
  }

  return message || JSON.stringify(data);
}

/**
 * Sends a query to the AI grading service
 * @param activityData The activity data including file URLs and teacher instructions
 * @param nationalId The teacher's national ID
 * @returns The AI grading service's response
 */
export async function sendQueryToAIGrading(
  activityData: GradingAIRequest,
  nationalId: string
): Promise<{ success: boolean; response?: string; error?: string }> {
  return sendQueryToAI(activityData, nationalId, "grading");
}

/**
 * Sends a query to the principal AI assistant
 * @param query The query text or activity data
 * @param nationalId The principal's national ID
 * @returns The AI assistant's response
 */
export async function sendQueryToPrincipalAI(
  query: string | AIRequest,
  nationalId: string
): Promise<{ success: boolean; response?: string; error?: string }> {
  return sendQueryToAI(query, nationalId, "principal");
}

/**
 * Sends a query to the teacher AI assistant
 * @param query The query text or activity data
 * @param nationalId The teacher's national ID
 * @returns The AI assistant's response
 */
export async function sendQueryToTeacherAI(
  query: string | AIRequest,
  nationalId: string
): Promise<{ success: boolean; response?: string; error?: string }> {
  return sendQueryToAI(query, nationalId, "teacher");
}

/**
 * Sends a query to the parent AI assistant
 * @param query The query text or activity data
 * @param nationalId The parent's national ID
 * @returns The AI assistant's response
 */
export async function sendQueryToParentAI(
  query: string | AIRequest,
  nationalId: string
): Promise<{ success: boolean; response?: string; error?: string }> {
  return sendQueryToAI(query, nationalId, "parent");
}

/**
 * Sends a query to the student AI assistant
 * @param query The query text or activity data
 * @param nationalId The student's national ID
 * @returns The AI assistant's response
 */
export async function sendQueryToStudentAI(
  query: string | AIRequest,
  nationalId: string
): Promise<{ success: boolean; response?: string; error?: string }> {
  return sendQueryToAI(query, nationalId, "student");
}
