import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import {
  models,
  getClientForModel,
  validateEnvVariables,
  ModelId
} from './models';

// Define a type for potential errors
interface APIError extends Error {
  status?: number;
}

// Define message type
type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

// Define response type
interface ModelResponse {
  model: ModelId;
  response: string;
}

export async function POST(req: Request) {
  try {
    // Check if API keys are configured
    const missingVars = validateEnvVariables();
    if (missingVars.length > 0) {
      return NextResponse.json(
        { error: `Missing required API keys: ${missingVars.join(', ')}` },
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
    const modelResponses = await Promise.all(
      models.map(model =>
        getModelResponse(
          messages,
          model.apiModelName,
          getClientForModel(model.id),
          model.id
        )
      )
    );

    // Create an array of all responses for voting
    const modelResponsesForVoting: ModelResponse[] = models.map((model, index) => ({
      model: model.id as ModelId,
      response: modelResponses[index]
    }));

    // Step 2: Have each model vote on the best response
    const votingPrompt = createVotingPrompt(message, modelResponsesForVoting);

    // Get votes from all models in parallel
    const votes = await Promise.all(
      models.map(model =>
        getVote(
          votingPrompt,
          model.apiModelName,
          getClientForModel(model.id)
        )
      )
    );

    // Count votes
    const voteResults: Record<ModelId, number> = Object.fromEntries(
      models.map(model => [model.id, 0])
    ) as Record<ModelId, number>;

    // Process votes
    votes.forEach(voteResponse => {
      processVote(voteResponse, voteResults);
    });

    // Determine winner
    let winner: ModelId = 'gpt-4o-mini'; // Default winner
    let maxVotes = 0;

    Object.entries(voteResults).forEach(([modelId, voteCount]) => {
      if (voteCount > maxVotes) {
        maxVotes = voteCount;
        winner = modelId as ModelId;
      }
    });

    // Build response object with all model responses
    const responseData: Record<string, unknown> = {
      votes: voteResults,
      winner
    };

    // Add each model's response to the response object
    models.forEach((model, index) => {
      responseData[model.id] = modelResponses[index];
    });

    return NextResponse.json(responseData);
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

  // Create a list of model IDs for the prompt
  const modelIdsList = models.map(m => m.id).join(', ');
  prompt += `Based on accuracy, helpfulness, and clarity, which answer is the best? Respond with ONLY the model name (${modelIdsList}) that provided the best answer. Do not include any explanation or additional text.`;

  return prompt;
}

// Process a vote response
function processVote(voteResponse: string, votes: Record<ModelId, number>) {
  const lowerVote = voteResponse.toLowerCase().trim();

  models.forEach(model => {
    // Look for exact model ID match or substring with dashes/numbers removed
    const simplifiedId = model.id.replace(/[-\d\.]/g, '');
    if (lowerVote.includes(model.id) || lowerVote.includes(simplifiedId)) {
      votes[model.id as ModelId]++;
    }
  });
}

// Get a vote from any model
async function getVote(
  votingPrompt: string,
  modelName: string,
  client: OpenAI | undefined
): Promise<string> {
  if (!client) return '';

  try {
    const completion = await client.chat.completions.create({
      model: modelName,
      messages: [{ role: 'user', content: votingPrompt }],
      temperature: 0.3, // Lower temperature for more deterministic responses
      max_tokens: 50,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error(`${modelName} voting error:`, error);
    return '';
  }
}

// Generic function to get a response from any model
async function getModelResponse(
  messages: ChatMessage[],
  modelName: string,
  client: OpenAI | undefined,
  modelId: string
): Promise<string> {
  if (!client) return `No client available for model ${modelId}`;

  try {
    const model = models.find(m => m.id === modelId);
    const defaultParams = model?.defaultParams || {};

    const completion = await client.chat.completions.create({
      model: modelName,
      messages,
      ...defaultParams
    });

    return completion.choices[0]?.message?.content || `No response generated from ${modelId}`;
  } catch (error) {
    console.error(`${modelId} API error:`, error);
    return `Error getting response from ${modelId}`;
  }
}
