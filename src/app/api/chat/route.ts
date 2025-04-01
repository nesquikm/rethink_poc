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

// Initialize Anthropic Claude client using OpenAI compatibility layer
const claudeClient = new OpenAI({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: "https://api.anthropic.com/v1/"
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

// Define model names
const MODELS = ['gpt-3.5-turbo', 'gpt-4o-mini', 'gemini', 'claude'] as const;
type ModelName = typeof MODELS[number];

// Define response type
interface ModelResponse {
  model: ModelName;
  response: string;
}

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

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key is not configured' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { message, history } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Create messages array with conversation history or a default system prompt
    let messages: ChatMessage[];

    if (history && Array.isArray(history) && history.length > 0) {
      // Use the provided history
      messages = history as ChatMessage[];
    } else {
      // If no history, create a default context
      messages = [
        {
          role: 'system',
          content: 'You are a helpful assistant providing clear and concise answers.'
        },
        {
          role: 'user',
          content: message
        }
      ];
    }

    // Step 1: Get responses from all models in parallel
    const [gpt35Response, gpt4oMiniResponse, geminiResponse, claudeResponse] = await Promise.all([
      getModelResponse(messages, "gpt-3.5-turbo", openaiClient, 'gpt-3.5-turbo'),
      getModelResponse(messages, "gpt-4o-mini", openaiClient, 'gpt-4o-mini'),
      getModelResponse(messages, "gemini-2.0-flash", geminiClient, 'gemini'),
      getModelResponse(messages, "claude-3-opus-20240229", claudeClient, 'claude')
    ]);

    // Create an array of all responses
    const modelResponses: ModelResponse[] = [
      { model: 'gpt-3.5-turbo', response: gpt35Response },
      { model: 'gpt-4o-mini', response: gpt4oMiniResponse },
      { model: 'gemini', response: geminiResponse },
      { model: 'claude', response: claudeResponse }
    ];

    // Step 2: Have each model vote on the best response
    const votingPrompt = createVotingPrompt(message, modelResponses);

    // Get votes from all models in parallel
    const [gpt35Vote, gpt4oMiniVote, geminiVote, claudeVote] = await Promise.all([
      getVote(votingPrompt, "gpt-3.5-turbo", openaiClient),
      getVote(votingPrompt, "gpt-4o-mini", openaiClient),
      getVote(votingPrompt, "gemini-2.0-flash", geminiClient),
      getVote(votingPrompt, "claude-3-opus-20240229", claudeClient)
    ]);

    // Count votes
    const votes: Record<ModelName, number> = {
      'gpt-3.5-turbo': 0,
      'gpt-4o-mini': 0,
      'gemini': 0,
      'claude': 0
    };

    // Process votes
    processVote(gpt35Vote, votes);
    processVote(gpt4oMiniVote, votes);
    processVote(geminiVote, votes);
    processVote(claudeVote, votes);

    // Determine winner
    let winner: ModelName = 'gpt-4o-mini'; // Default winner
    let maxVotes = 0;

    for (const model of MODELS) {
      if (votes[model] > maxVotes) {
        maxVotes = votes[model];
        winner = model;
      }
    }

    return NextResponse.json({
      'gpt-3.5-turbo': gpt35Response,
      'gpt-4o-mini': gpt4oMiniResponse,
      'gemini': geminiResponse,
      'claude': claudeResponse,
      votes,
      winner
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

// Create a prompt for voting
function createVotingPrompt(userQuestion: string, responses: ModelResponse[]): string {
  let prompt = `User Question: "${userQuestion}"\n\n`;

  // Add each model's response
  responses.forEach(({ model, response }) => {
    prompt += `${model}'s Answer: "${response}"\n\n`;
  });

  prompt += "Based on accuracy, helpfulness, and clarity, which answer is the best? Respond with ONLY the model name (gpt-3.5-turbo, gpt-4o-mini, gemini, or claude) that provided the best answer. Do not include any explanation or additional text.";

  return prompt;
}

// Process a vote response
function processVote(voteResponse: string, votes: Record<ModelName, number>) {
  const lowerVote = voteResponse.toLowerCase().trim();

  if (lowerVote.includes('gpt-3.5') || lowerVote.includes('gpt3.5') || lowerVote.includes('gpt-3')) {
    votes['gpt-3.5-turbo']++;
  } else if (lowerVote.includes('gpt-4o') || lowerVote.includes('gpt4o') || lowerVote.includes('4o-mini')) {
    votes['gpt-4o-mini']++;
  } else if (lowerVote.includes('gemini')) {
    votes['gemini']++;
  } else if (lowerVote.includes('claude') || lowerVote.includes('anthropic')) {
    votes['claude']++;
  }
}

// Get a vote from any model
async function getVote(
  votingPrompt: string,
  model: string,
  client: OpenAI
): Promise<string> {
  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: votingPrompt }],
      temperature: 0.3, // Lower temperature for more deterministic responses
      max_tokens: 50,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error(`${model} voting error:`, error);
    return '';
  }
}

// Generic function to get a response from any model
async function getModelResponse(
  messages: ChatMessage[],
  model: string,
  client: OpenAI,
  displayName: string
): Promise<string> {
  try {
    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content || `No response generated from ${displayName}`;
  } catch (error) {
    console.error(`${displayName} API error:`, error);
    return `Error getting response from ${displayName}`;
  }
}
