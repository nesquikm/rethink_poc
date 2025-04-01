# Rethink AI

A proof-of-concept application that demonstrates a multi-model AI chat interface leveraging multiple AI providers concurrently and selecting the best response through a voting mechanism.

## Project Overview

Rethink AI addresses the growing complexity of choosing the right AI model for specific queries. With multiple strong AI models available (OpenAI, Google, Anthropic), each with different strengths and weaknesses, users often face the challenge of selecting the most appropriate model for their needs.

### Key Features

- **Multi-Model Integration**: Connect to multiple AI models including OpenAI's GPT models, Google's Gemini, and Anthropic's Claude
- **Response Evaluation System**: AI models vote on the best response from all providers
- **Unified Chat Interface**: Clean, tabbed interface showing responses from all models
- **Markdown Rendering**: Properly renders formatted text, code blocks, tables, and other markdown elements
- **Winner Highlighting**: Visual indicators for the "best" response based on voting

## Demo

![Rethink AI in action](/public/images/demo.gif)

## Documentation

The project is documented using a Memory Bank structure:

- [Project Brief](./memory-bank/projectbrief.md) - Core requirements and goals
- [Product Context](./memory-bank/productContext.md) - Why this project exists and problems it solves
- [Technical Context](./memory-bank/techContext.md) - Technologies used and technical constraints
- [System Patterns](./memory-bank/systemPatterns.md) - System architecture and design patterns
- [Active Context](./memory-bank/activeContext.md) - Current work focus and decisions
- [Progress](./memory-bank/progress.md) - Current status, what works, and what's left to build

## Technical Stack

- Next.js 15+ with App Router
- React 19+
- TypeScript
- TailwindCSS
- OpenAI API
- Google Gemini API
- Anthropic Claude API

## Getting Started

First, set up your environment variables:

```bash
# Create a .env.local file with your API keys
OPENAI_API_KEY=your_openai_key
GOOGLE_API_KEY=your_google_key
ANTHROPIC_API_KEY=your_anthropic_key
```

Then, run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## How It Works

1. User submits a question through the chat interface
2. All configured AI models receive the question in parallel
3. Each model generates a response to the question
4. Each model evaluates all responses to vote on the best one
5. All responses are displayed to the user, with the "winner" highlighted
6. Users can see which model provided each response and the vote distribution
7. Users can continue the conversation with follow-up questions

## Architecture

The system is built with a clean separation between:

- UI components (React/Next.js)
- API interfaces (Next.js API routes)
- Shared model definitions (TypeScript)

This modular design makes it easy to add new AI models or modify the voting mechanism without major refactoring.

## Future Enhancements

- User authentication
- Persistent conversation history
- Fine-tuning of models
- Advanced prompt engineering features
- Streaming responses
- Model context length management

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
