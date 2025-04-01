// Import shared model types and IDs
import { ModelId, MODEL_IDS, SHARED_MODELS, PROVIDER_NAMES, SharedModelDefinition } from './models-shared';

// Models metadata for UI
export interface ModelUIData {
  id: ModelId;
  displayName: string;
  color: string;
  provider: string;
}

// Models data - derived from shared models but with UI-specific formatting
export const models: ModelUIData[] = SHARED_MODELS.map((model: SharedModelDefinition) => ({
  id: model.id,
  displayName: model.displayName,
  color: model.color,
  provider: PROVIDER_NAMES[model.provider]
}));

// Get model data by ID
export function getModelById(id: ModelId): ModelUIData | undefined {
  return models.find(model => model.id === id);
}

// Re-export model IDs for convenience
export { ModelId, MODEL_IDS };
