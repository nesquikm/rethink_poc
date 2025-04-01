import { OpenAI } from 'openai';

// Define a common interface for all providers
export interface Provider {
  id: string;
  name: string;
  client: OpenAI;
  color: string; // For UI color coding
}

// Define a common interface for all models
export interface Model {
  id: string;
  displayName: string;
  provider: string;
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

// Define available models
export const models: Model[] = [
  {
    id: 'gpt-3.5-turbo',
    displayName: 'GPT-3.5',
    provider: 'openai',
    apiModelName: 'gpt-3.5-turbo',
    defaultParams: {
      temperature: 0.7,
      max_tokens: 500
    }
  },
  {
    id: 'gpt-4o-mini',
    displayName: 'GPT-4o mini',
    provider: 'openai',
    apiModelName: 'gpt-4o-mini',
    defaultParams: {
      temperature: 0.7,
      max_tokens: 500
    }
  },
  {
    id: 'gemini',
    displayName: 'Gemini',
    provider: 'gemini',
    apiModelName: 'gemini-2.0-flash',
    defaultParams: {
      temperature: 0.7,
      max_tokens: 500
    }
  },
  {
    id: 'claude',
    displayName: 'Claude',
    provider: 'anthropic',
    apiModelName: 'claude-3-opus-20240229',
    defaultParams: {
      temperature: 0.7,
      max_tokens: 500
    }
  }
];

// Utility functions
export function getModelById(id: string): Model | undefined {
  return models.find(model => model.id === id);
}

export function getProviderById(id: string): Provider | undefined {
  return providers.find(provider => provider.id === id);
}

export function getClientForModel(modelId: string): OpenAI | undefined {
  const model = getModelById(modelId);
  if (!model) return undefined;

  const provider = getProviderById(model.provider);
  return provider?.client;
}

// Get all model IDs (for typing)
export const MODEL_IDS = models.map(model => model.id);
export type ModelId = 'gpt-3.5-turbo' | 'gpt-4o-mini' | 'gemini' | 'claude';

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
