# System Patterns

## System Architecture

The Rethink AI POC follows a clean Next.js App Router architecture with a clear separation of concerns:

### Frontend
- **Next.js App Router**: Provides the routing framework for the application
- **React Components**: Client-side components for the chat interface
- **TailwindCSS**: Utility-first CSS framework for styling

### Backend
- **Next.js API Routes**: Server-side API endpoints for handling AI model requests
- **OpenAI/Gemini/Claude SDKs**: SDK integrations for each AI provider

### Data Flow
1. User inputs a message via the React-based Chat component
2. The message is sent to the Next.js API route
3. The API route makes parallel requests to all configured AI models
4. Each model generates a response
5. Each model evaluates all responses through a voting mechanism
6. All responses and voting results are returned to the frontend
7. The frontend displays the responses, highlighting the winner

## Key Technical Decisions

### 1. OpenAI-compatible API Interfaces
All AI providers are accessed through the OpenAI client, using compatible endpoints for non-OpenAI providers (Gemini and Claude). This approach:
- Simplifies the codebase by using a single client type
- Makes adding new compatible providers easier
- Reduces the need for provider-specific error handling

### 2. Parallel API Requests
API requests to all models are made concurrently using Promise.all to:
- Reduce overall response time
- Allow for independent failure of individual models
- Enable the voting mechanism to work with all available responses

### 3. Client-Side Rendering
The chat interface uses client-side rendering to:
- Allow for dynamic updates without full page refreshes
- Enable real-time feedback during loading states
- Maintain conversation state in the client

### 4. Two-Phase Response Process
The system uses a two-phase approach:
1. **Response Generation**: All models generate responses to the user query
2. **Response Evaluation**: All models evaluate and vote on the quality of all responses

This creates a meta-evaluation layer that leverages the "wisdom of the crowd" among AI models.

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

## Component Relationships

1. **Chat Component (Frontend)**:
   - Manages user input
   - Displays conversation history
   - Shows loading states
   - Renders model responses with appropriate styling

2. **Chat API Route (Backend)**:
   - Handles incoming user messages
   - Manages parallel API calls to AI providers
   - Implements the voting mechanism
   - Returns structured response data

3. **Model Clients (Backend)**:
   - Handle specific API calls to each provider
   - Map provider-specific responses to a common format
   - Manage provider-specific error handling
