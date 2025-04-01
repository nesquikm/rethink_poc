// Shared type definitions for client-side code
// This file should match the relevant parts from the server-side models.ts

// Define model IDs that match the server configuration
export type ModelId = 'gpt-3.5-turbo' | 'gpt-4o-mini' | 'gemini' | 'claude';

// Models metadata for UI
export interface ModelUIData {
  id: ModelId;
  displayName: string;
  color: string;
  provider: string;
}

// Models data
export const models: ModelUIData[] = [
  {
    id: 'gpt-3.5-turbo',
    displayName: 'GPT-3.5',
    color: '#10B981', // Green
    provider: 'OpenAI'
  },
  {
    id: 'gpt-4o-mini',
    displayName: 'GPT-4o mini',
    color: '#8B5CF6', // Purple
    provider: 'OpenAI'
  },
  {
    id: 'gemini',
    displayName: 'Gemini',
    color: '#3B82F6', // Blue
    provider: 'Google'
  },
  {
    id: 'claude',
    displayName: 'Claude',
    color: '#EF4444', // Red
    provider: 'Anthropic'
  }
];

// Get model data by ID
export function getModelById(id: ModelId): ModelUIData | undefined {
  return models.find(model => model.id === id);
}

// Get all model IDs (useful for typing)
export const MODEL_IDS = models.map(model => model.id);
