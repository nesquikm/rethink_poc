// models-shared.ts
// Shared model definitions used by both client and server

// Define model IDs
export type ModelId = 'gpt-3.5-turbo' | 'gpt-4o-mini' | 'gemini' | 'claude';

// Provider IDs
export type ProviderId = 'openai' | 'gemini' | 'anthropic';

// Model definitions that are shared between client and server
export interface SharedModelDefinition {
  id: ModelId;
  displayName: string;
  provider: ProviderId;
  color: string;
}

// Core model data - shared between client and server
export const SHARED_MODELS: SharedModelDefinition[] = [
  {
    id: 'gpt-3.5-turbo',
    displayName: 'GPT-3.5',
    provider: 'openai',
    color: '#10B981', // Green
  },
  {
    id: 'gpt-4o-mini',
    displayName: 'GPT-4o mini',
    provider: 'openai',
    color: '#8B5CF6', // Purple
  },
  {
    id: 'gemini',
    displayName: 'Gemini',
    provider: 'gemini',
    color: '#3B82F6', // Blue
  },
  {
    id: 'claude',
    displayName: 'Claude',
    provider: 'anthropic',
    color: '#EF4444', // Red
  }
];

// Get all model IDs (useful for typing)
export const MODEL_IDS = SHARED_MODELS.map(model => model.id);

// Provider display names
export const PROVIDER_NAMES: Record<ProviderId, string> = {
  'openai': 'OpenAI',
  'gemini': 'Google',
  'anthropic': 'Anthropic'
};
