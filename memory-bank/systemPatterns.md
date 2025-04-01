# System Patterns

## System Architecture

The Rethink AI POC follows a clean Next.js App Router architecture with a clear separation of concerns:

### Frontend
- **Next.js App Router**: Provides the routing framework for the application
- **React Components**: Client-side components for the chat interface
- **TailwindCSS**: Utility-first CSS framework for styling
- **Tabbed Interface**: Component system for displaying multiple AI responses
- **Shared Model Definitions**: Client-side model configuration aligned with backend

### Backend
- **Next.js API Routes**: Server-side API endpoints for handling AI model requests
- **Centralized Model System**: Abstracted provider and model configuration
- **OpenAI-Compatible Clients**: Unified client interface for different AI providers

### Data Flow
1. User inputs a message via the React-based Chat component
2. The message is sent to the Next.js API route along with conversation history (filtered to include only selected responses)
3. The API route makes parallel requests to all configured models (dynamically based on model configuration)
4. Each model generates a response using the conversation context
5. Each model evaluates all responses through a voting mechanism
6. All responses and voting results are returned to the frontend
7. The frontend groups responses by conversation turn and displays them in a tabbed interface
8. The winning response tab is active by default, but users can switch between tabs (only for the latest turn)
9. Selected responses are tracked and locked for previous turns, maintaining conversation integrity

## Key Technical Decisions

### 1. Centralized Model Configuration
The application uses a centralized model and provider configuration system:
- Server-side definitions in `src/app/api/chat/models.ts` define providers and models with their parameters
- Client-side definitions in `src/app/api/models.ts` provide UI metadata for models
- Both share common model IDs and structure for consistency
- Adding a new model or provider requires changes to only one place
- Environment variables are validated in a single location

### 2. OpenAI-compatible API Interfaces
All AI providers are accessed through the OpenAI client, using compatible endpoints for non-OpenAI providers (Gemini and Claude). This approach:
- Simplifies the codebase by using a single client type
- Makes adding new compatible providers easier
- Reduces the need for provider-specific error handling

### 3. Parallel API Requests
API requests to all models are made concurrently using Promise.all to:
- Reduce overall response time
- Allow for independent failure of individual models
- Enable the voting mechanism to work with all available responses
- Dynamically handle any number of models defined in the configuration

### 4. Client-Side Rendering and State Management
The chat interface uses client-side rendering and state management to:
- Allow for dynamic updates without full page refreshes
- Enable real-time feedback during loading states
- Maintain conversation state and tab selections in the client
- Store conversation history in localStorage for persistence between sessions

### 5. Two-Phase Response Process
The system uses a two-phase approach:
1. **Response Generation**: All models generate responses to the user query using conversation context
2. **Response Evaluation**: All models evaluate and vote on the quality of all responses

This creates a meta-evaluation layer that leverages the "wisdom of the crowd" among AI models.

### 6. Turn-Based Conversation Structure with Selection Tracking
The conversation is organized into turns with a selection mechanism:
- Each turn consists of a user message and corresponding AI responses
- AI responses are grouped and displayed in a tabbed interface
- Default active tab is the "winning" response for the latest turn
- Users can switch between tabs for the most recent turn only
- Selected responses are tracked with an `isSelected` property
- Previous turn selections are locked and visually indicated
- Only selected responses are included in the conversation history sent to AI models

### 7. Fixed Width UI Design
The chat interface uses a fixed width layout (1024px) to:
- Provide a consistent user experience across different devices
- Optimize reading comfort for longer responses
- Maintain proper spacing for the tab interface
- Ensure predictable layout for complex UI elements

## Design Patterns

### 1. Provider Pattern
The application uses a provider-like pattern to abstract the differences between AI services:
- Common interface for all models
- Standardized error handling
- Unified response format

### 2. Factory Pattern
AI client initialization follows a factory-like approach:
- Each client is initialized with its specific configuration
- Clients share a common interface for chat completions
- Utility functions retrieve the appropriate client for each model

### 3. Command Pattern
User queries are treated as commands:
- Commands are dispatched to multiple handlers (AI models)
- Results are collected and aggregated
- Final results are returned to the user

### 4. Strategy Pattern
The voting mechanism implements a strategy pattern:
- Each model implements the same "voting" interface
- The voting algorithm is consistent across models
- The best response is selected based on accumulated votes

### 5. Composite Response Pattern
The final response to the user is a composite of:
- Individual model responses
- Vote tallies
- Winning response indicator
- Tab selection state

### 6. Observer Pattern
The tab interface implements an observer-like pattern:
- Tab selection state is observed by all tabs
- Only the active tab displays its content
- UI updates reactively when tab selection changes
- Selection status is tracked and persisted

### 7. State Machine Pattern
The conversation history represents a state machine:
- Each turn has specific states (user input, model responses, tab selection)
- State transitions are triggered by user actions
- History is persisted to survive page reloads
- Previous turn selections are locked to maintain conversation integrity

### 8. Selection History Pattern
The conversation maintains a history of selected responses:
- Each AI response has an `isSelected` flag to track user selection
- The conversation history passed to AI models is filtered to only include selected responses
- The API message conversion function organizes messages by turn and filters out non-selected responses
- This pattern ensures conversation coherence while allowing exploration of different AI responses

### 9. Model Registry Pattern
The model and provider system implements a registry pattern:
- Models and providers are registered in a central configuration
- Models reference their providers through IDs
- UI components retrieve model information from the registry
- API routes dynamically process all registered models

## Component Relationships

1. **Chat Component (Frontend)**:
   - Manages user input and form submission
   - Displays conversation history organized by turns
   - Shows loading states during API requests
   - Handles tab selection and display
   - Maintains state for active tabs and last turn ID
   - Persists conversation history via localStorage
   - Implements the selected response tracking mechanism
   - Manages locking of previous turn selections
   - Dynamically processes all model responses using shared model definitions

2. **Models Configuration (Shared)**:
   - Provides type definitions for models and providers
   - Contains UI metadata for models (colors, display names)
   - Ensures consistency between frontend and backend model handling
   - Offers utility functions for retrieving model information

3. **Models Configuration (Backend)**:
   - Initializes provider clients with appropriate configurations
   - Registers all available models with their parameters
   - Provides utility functions for accessing clients and model information
   - Validates required environment variables

4. **Conversation Turn Component**:
   - Groups user message with corresponding AI responses
   - Provides tab navigation interface (interactive only for latest turn)
   - Displays active tab content
   - Shows model information and voting results
   - Indicates selected responses with visual badges
   - Applies disabled state to tabs in previous turns

5. **Tab Interface**:
   - Provides UI for switching between different model responses
   - Highlights the winning response by default
   - Shows visual indicators for each AI model
   - Manages active tab state
   - Displays selection status for previous turns
   - Restricts interaction to the latest turn only

6. **Chat API Route (Backend)**:
   - Handles incoming user messages with filtered conversation history
   - Manages parallel API calls to AI providers using the model configuration
   - Implements the voting mechanism
   - Returns structured response data with all model responses and voting results
   - Dynamically processes all registered models
