# Technical Context

## Technologies Used

### Core Framework
- **Next.js 15+**: React framework with the App Router for both frontend and API routes
- **React 19+**: UI library for building the user interface
- **TypeScript**: Type-safe JavaScript for improved developer experience and code quality

### Styling
- **TailwindCSS 4**: Utility-first CSS framework for styling components
- **CSS Modules**: For component-specific styling when needed

### AI Integrations
- **OpenAI SDK**: For GPT-3.5-turbo and GPT-4o-mini model access
- **Google Generative AI**: For Gemini model access (via OpenAI-compatible endpoint)
- **Anthropic**: For Claude model access (via OpenAI-compatible endpoint)

### Development Tools
- **ESLint**: For code linting and enforcing code style
- **TypeScript**: For static type checking
- **Next.js dev server**: For local development
- **Turbopack**: For faster development builds

## Development Setup

### Environment Configuration
Required environment variables in `.env.local`:
```
OPENAI_API_KEY=<your-openai-api-key>
GEMINI_API_KEY=<your-gemini-api-key>
ANTHROPIC_API_KEY=<your-anthropic-api-key>
```

### Local Development
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env.local`
4. Run the development server: `npm run dev`
5. Open http://localhost:3000 in your browser

### Project Structure
```
/
├── .next/               # Next.js build output
├── node_modules/        # Dependencies
├── public/              # Static assets
├── src/                 # Source code
│   ├── app/             # Next.js App Router
│   │   ├── api/         # API routes
│   │   │   └── chat/    # Chat API endpoint
│   │   ├── chat/        # Chat page route
│   │   ├── components/  # React components
│   │   ├── globals.css  # Global styles
│   │   ├── layout.tsx   # Root layout
│   │   └── page.tsx     # Home page
├── .env.local           # Environment variables (not checked in)
├── .gitignore           # Git ignore file
├── eslint.config.mjs    # ESLint configuration
├── next.config.ts       # Next.js configuration
├── package.json         # Project metadata and dependencies
└── tsconfig.json        # TypeScript configuration
```

## Technical Constraints

### API Rate Limits
- Each AI provider has different rate limits and pricing
- OpenAI: Varies by tier, typically 3-5 requests per minute for free tier
- Gemini: Limits based on quota system (QPS and daily quota)
- Claude: Requests per minute limits based on plan

### Response Times
- Average response time varies by model:
  - GPT-3.5-turbo: 1-3 seconds
  - GPT-4o-mini: 2-5 seconds
  - Gemini: 1-3 seconds
  - Claude: 2-5 seconds
- The application must wait for all model responses before showing results, so the slowest model determines the overall response time

### Client-Side Limitations
- Chat history is maintained in client-side state only (not persisted)
- No server-side message caching implemented
- Limited to 500 tokens per response to keep responses manageable

### API Compatibility
- The application uses OpenAI's client for all providers, which assumes compatible API endpoints
- Any provider-specific features not supported by the OpenAI-compatible interface are not available
- Error handling must account for different error formats across providers

### Browser Compatibility
- Targeted browsers: Modern versions of Chrome, Firefox, Safari, and Edge
- No specific IE or legacy browser support
- Progressive enhancement not fully implemented

## Dependencies and External Services

### Critical External Dependencies
- OpenAI API
- Google AI Studio API (Gemini)
- Anthropic API (Claude)

### NPM Dependencies
Critical packages:
- `next`: Next.js framework
- `react` & `react-dom`: React library
- `openai`: OpenAI SDK for API access

Dev dependencies:
- `typescript`: For type checking
- `eslint`: For code linting
- `tailwindcss`: For styling

## Performance Considerations

- **Parallel Requests**: All API calls to different models are made concurrently
- **Network Waterfall**: User experience is dependent on all models responding
- **Client-Side Rendering**: Used to provide immediate feedback during loading
- **Response Size**: Limited to keep page weight reasonable
- **Error Resilience**: Implementation includes handling for failed model responses
