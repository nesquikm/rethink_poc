import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

// Initialize OpenAI client
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Gemini client using OpenAI compatibility layer
const geminiClient = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

// Define a type for potential errors
interface APIError extends Error {
  status?: number;
}

// Define message type
type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export async function POST(req: Request) {
  try {
    // Check if API keys are configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Create messages array with system prompt for better context
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful assistant providing clear and concise answers.'
      },
      {
        role: 'user',
        content: message
      }
    ];

    // Make requests to all APIs in parallel
    const [gpt35Response, gpt4oMiniResponse, geminiResponse] = await Promise.all([
      getOpenAIResponse(messages, "gpt-3.5-turbo"),
      getOpenAIResponse(messages, "gpt-4o-mini"),
      getGeminiResponse(messages)
    ]);

    return NextResponse.json({
      'gpt-3.5-turbo': gpt35Response,
      'gpt-4o-mini': gpt4oMiniResponse,
      gemini: geminiResponse
    });
  } catch (error: unknown) {
    console.error('Error in chat API:', error);

    // Cast error to our APIError type
    const apiError = error as APIError;

    // Return a more specific error message if available
    const errorMessage = apiError.message || 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: apiError.status || 500 }
    );
  }
}

async function getOpenAIResponse(messages: ChatMessage[], model: string): Promise<string> {
  try {
    const completion = await openaiClient.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content || `No response generated from ${model}`;
  } catch (error) {
    console.error(`${model} API error:`, error);
    return `Error getting response from ${model}`;
  }
}

async function getGeminiResponse(messages: ChatMessage[]): Promise<string> {
  try {
    const completion = await geminiClient.chat.completions.create({
      model: "gemini-2.0-flash", // Use the appropriate Gemini model
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content || 'No response generated from Gemini';
  } catch (error) {
    console.error('Gemini API error:', error);
    return 'Error getting response from Gemini';
  }
}
