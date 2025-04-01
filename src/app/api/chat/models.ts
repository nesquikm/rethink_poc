import { OpenAI } from 'openai';
import {
  ModelId,
  SHARED_MODELS,
  ProviderId,
  SharedModelDefinition
} from '../models-shared';

// Define a common interface for all providers
export interface Provider {
  id: ProviderId;
  name: string;
  client: OpenAI;
  color: string; // For UI color coding
}

// Define a common interface for all models that extends the shared definition
export interface Model extends SharedModelDefinition {
  apiModelName: string;
  defaultParams?: {
    temperature?: number;
    max_tokens?: number;
    [key: string]: unknown;
  };
}

// Initialize providers with their clients
export const providers: Provider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    client: new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    }),
    color: '#10B981' // Green
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    client: new OpenAI({
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
    }),
    color: '#3B82F6' // Blue
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    client: new OpenAI({
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseURL: "https://api.anthropic.com/v1/"
    }),
    color: '#EF4444' // Red
  }
];

// Define available models - extends the shared models with API-specific details
export const models: Model[] = SHARED_MODELS.map((sharedModel: SharedModelDefinition) => {
  // Add API-specific details based on the model ID
  switch(sharedModel.id) {
    case 'gpt-3.5-turbo':
      return {
        ...sharedModel,
        apiModelName: 'gpt-3.5-turbo',
        defaultParams: {
          temperature: 0.7,
          max_tokens: 500
        }
      };
    case 'gpt-4o-mini':
      return {
        ...sharedModel,
        apiModelName: 'gpt-4o-mini',
        defaultParams: {
          temperature: 0.7,
          max_tokens: 500
        }
      };
    case 'gemini':
      return {
        ...sharedModel,
        apiModelName: 'gemini-2.0-flash',
        defaultParams: {
          temperature: 0.7,
          max_tokens: 500
        }
      };
    case 'claude':
      return {
        ...sharedModel,
        apiModelName: 'claude-3-opus-20240229',
        defaultParams: {
          temperature: 0.7,
          max_tokens: 500
        }
      };
    default:
      throw new Error(`Unknown model ID: ${sharedModel.id}`);
  }
});

// Utility functions
export function getModelById(id: string): Model | undefined {
  return models.find(model => model.id === id);
}

export function getProviderById(id: ProviderId): Provider | undefined {
  return providers.find(provider => provider.id === id);
}

export function getClientForModel(modelId: string): OpenAI | undefined {
  const model = getModelById(modelId);
  if (!model) return undefined;

  const provider = getProviderById(model.provider);
  return provider?.client;
}

// Re-export model IDs for consistency
export type { ModelId };

// Validate required environment variables
export function validateEnvVariables(): string[] {
  const missingVars: string[] = [];

  if (!process.env.OPENAI_API_KEY) {
    missingVars.push('OPENAI_API_KEY');
  }

  if (!process.env.GEMINI_API_KEY) {
    missingVars.push('GEMINI_API_KEY');
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    missingVars.push('ANTHROPIC_API_KEY');
  }

  return missingVars;
}
