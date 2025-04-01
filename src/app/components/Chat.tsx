'use client';

import { useState, useEffect, useRef } from 'react';
import { ModelId } from '../api/models';
import { getModelById, models } from '../api/models';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  provider?: ModelId;
  isWinner?: boolean;
  votes?: Record<ModelId, number>;
  turnId?: number; // To group messages by conversation turn
  isSelected?: boolean; // Flag to indicate if this response was selected by the user
};

// Type for tracking active tabs for each conversation turn
type ActiveTabsState = Record<number, ModelId>;

// Helper to convert UI chat history to API format - only include selected responses
const convertToAPIMessages = (chatHistory: ChatMessage[]): {role: string; content: string}[] => {
  const systemMessage = {
    role: 'system',
    content: 'You are a helpful assistant providing clear and concise answers.'
  };

  // Convert UI history to API format, only including user messages and selected assistant responses
  const uniqueMessages: {role: string; content: string}[] = [systemMessage];

  // Group messages by turn ID
  const turns: Record<number, {
    user: ChatMessage | null,
    responses: ChatMessage[]
  }> = {};

  chatHistory.forEach(msg => {
    if (!msg.turnId && msg.turnId !== 0) return;

    if (!turns[msg.turnId]) {
      turns[msg.turnId] = {
        user: null,
        responses: []
      };
    }

    if (msg.role === 'user') {
      turns[msg.turnId].user = msg;
    } else {
      turns[msg.turnId].responses.push(msg);
    }
  });

  // Convert grouped turns to flat API messages
  Object.entries(turns)
    .map(([id, data]) => ({ id: parseInt(id), ...data }))
    .sort((a, b) => a.id - b.id)
    .forEach(turn => {
      // Add user message
      if (turn.user) {
        uniqueMessages.push({
          role: 'user',
          content: turn.user.content
        });
      }

      // Add only the selected response for this turn
      if (turn.responses.length > 0) {
        const selectedResponse = turn.responses.find(r => r.isSelected);
        if (selectedResponse) {
          uniqueMessages.push({
            role: 'assistant',
            content: selectedResponse.content
          });
        }
      }
    });

  return uniqueMessages;
};

export default function Chat() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTabs, setActiveTabs] = useState<ActiveTabsState>({});
  const [turnCounter, setTurnCounter] = useState(0);
  const [lastTurnId, setLastTurnId] = useState<number | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage when component mounts
  useEffect(() => {
    setMounted(true);
    const savedChatHistory = localStorage.getItem('chatHistory');
    if (savedChatHistory) {
      try {
        const parsed = JSON.parse(savedChatHistory);
        setChatHistory(parsed);

        // Find the highest turnId to set the turnCounter correctly
        if (Array.isArray(parsed) && parsed.length > 0) {
          const maxTurnId = Math.max(...parsed.map(msg => msg.turnId || 0));
          setTurnCounter(maxTurnId + 1);
          setLastTurnId(maxTurnId);
        }
      } catch (e) {
        console.error('Failed to parse saved chat history:', e);
        localStorage.removeItem('chatHistory');
      }
    }
  }, []);

  // Save chat history to localStorage when it changes
  useEffect(() => {
    if (mounted && chatHistory.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    }
  }, [chatHistory, mounted]);

  // Scroll to bottom when chat history updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Apply selected status based on active tabs
  useEffect(() => {
    if (Object.keys(activeTabs).length === 0) return;

    setChatHistory(prevHistory => {
      return prevHistory.map(msg => {
        if (msg.role === 'assistant' && msg.turnId !== undefined && msg.provider) {
          return {
            ...msg,
            isSelected: activeTabs[msg.turnId] === msg.provider
          };
        }
        return msg;
      });
    });
  }, [activeTabs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    const userMessage = message.trim();
    setMessage('');

    // Create a new turn ID for this conversation exchange
    const currentTurnId = turnCounter;
    setTurnCounter(prev => prev + 1);
    setLastTurnId(currentTurnId);

    // Add user message to chat history
    const updatedHistory: ChatMessage[] = [
      ...chatHistory,
      {
        role: 'user',
        content: userMessage,
        turnId: currentTurnId
      }
    ];
    setChatHistory(updatedHistory);

    try {
      // Convert chat history to the format expected by the API
      const apiMessages = convertToAPIMessages(updatedHistory);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          history: apiMessages
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Extract votes and winner
        const votes = data.votes as Record<ModelId, number>;
        const winner = data.winner as ModelId;

        // Set the winner as the active tab for this turn
        setActiveTabs(prev => ({
          ...prev,
          [currentTurnId]: winner
        }));

        // Add all AI responses to chat history with voting information
        const newResponses: ChatMessage[] = [];

        // Dynamically add all model responses
        models.forEach(model => {
          if (data[model.id]) {
            newResponses.push({
              role: 'assistant',
              content: data[model.id],
              provider: model.id,
              isWinner: winner === model.id,
              isSelected: winner === model.id,
              votes,
              turnId: currentTurnId
            });
          }
        });

        setChatHistory([...updatedHistory, ...newResponses]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to clear conversation history
  const clearConversation = () => {
    setChatHistory([]);
    setActiveTabs({});
    setTurnCounter(0);
    setLastTurnId(null);
    localStorage.removeItem('chatHistory');
  };

  // Function to handle tab changes
  const handleTabChange = (turnId: number, provider: ModelId) => {
    // Only allow changing tabs for the most recent turn
    if (turnId !== lastTurnId) return;

    setActiveTabs(prev => ({
      ...prev,
      [turnId]: provider
    }));
  };

  // Group messages by conversation turn
  const messagesByTurn: Record<number, {
    user: ChatMessage | null,
    responses: ChatMessage[]
  }> = {};

  chatHistory.forEach(msg => {
    if (!msg.turnId && msg.turnId !== 0) return;

    if (!messagesByTurn[msg.turnId]) {
      messagesByTurn[msg.turnId] = {
        user: null,
        responses: []
      };
    }

    if (msg.role === 'user') {
      messagesByTurn[msg.turnId].user = msg;
    } else {
      messagesByTurn[msg.turnId].responses.push(msg);
    }
  });

  // Return a simple placeholder during server-side rendering
  if (!mounted) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 bg-white dark:bg-black rounded-lg shadow">
        <div className="h-[400px] mb-4 p-4 border border-gray-200 dark:border-gray-800 rounded"></div>
        <div className="flex gap-2">
          <div className="flex-1 p-2 border border-gray-300 dark:border-gray-700 rounded-lg"></div>
          <div className="px-4 py-2 bg-blue-500 text-white rounded-lg">Send</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-[1024px] mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Rethink AI Chat</h1>

      {/* Chat messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto mb-4 space-y-4 border border-gray-200 rounded-lg p-4"
      >
        {Object.entries(messagesByTurn)
          .map(([turnIdStr, turn]) => {
            const turnId = parseInt(turnIdStr);
            const isLatestTurn = turnId === lastTurnId;

            return (
              <div key={`turn-${turnId}`} className="space-y-2">
                {/* User message */}
                {turn.user && (
                  <div className="flex justify-end">
                    <div className="bg-blue-500 text-white p-3 rounded-lg max-w-[80%]">
                      <div className="prose prose-invert prose-p:my-0 prose-ul:my-1 prose-ol:my-1 prose-li:my-0">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {turn.user.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Responses in tabs */}
                {turn.responses.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Tab headers */}
                    <div className="flex border-b">
                      {turn.responses.map(response => {
                        const isActive = activeTabs[turnId] === response.provider;
                        const modelData = response.provider ? getModelById(response.provider) : undefined;

                        return (
                          <button
                            key={`${turnId}-${response.provider}`}
                            className={`px-4 py-2 text-sm flex items-center space-x-1 ${
                              isActive ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'
                            } ${!isLatestTurn ? 'opacity-70 cursor-not-allowed' : ''}`}
                            disabled={!isLatestTurn}
                            onClick={() => handleTabChange(turnId, response.provider as ModelId)}
                          >
                            {/* Color dot for model */}
                            <span
                              className="w-2 h-2 rounded-full inline-block mr-1"
                              style={{ backgroundColor: modelData?.color || '#888' }}
                            ></span>

                            <span>{modelData?.displayName || response.provider}</span>

                            {/* Winner star */}
                            {response.isWinner && (
                              <span className="text-yellow-400 ml-1" title="Best Answer">★</span>
                            )}

                            {/* Selected indicator */}
                            {response.isSelected && !isLatestTurn && (
                              <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 rounded">SELECTED</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Tab content */}
                    {turn.responses.map(response => {
                      const isActive = activeTabs[turnId] === response.provider;
                      if (!isActive) return null;

                      return (
                        <div
                          key={`content-${turnId}-${response.provider}`}
                          className="p-4"
                        >
                          <div className="mb-2 flex justify-between items-center">
                            {response.isWinner && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                BEST ANSWER
                              </span>
                            )}

                            {response.votes && (
                              <div className="text-xs text-gray-500">
                                Votes: {Object.entries(response.votes).map(([model, count]) => (
                                  count > 0 ? <span key={model} className="mr-2">{model}: {count}</span> : null
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {response.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

        {isLoading && (
          <div className="flex justify-center py-4">
            <div className="animate-pulse text-gray-500">Getting responses...</div>
          </div>
        )}
      </div>

      {/* Chat input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 border border-gray-300 rounded-lg"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:bg-blue-300"
          disabled={isLoading || !message.trim()}
        >
          Send
        </button>
        <button
          type="button"
          onClick={clearConversation}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg"
          disabled={isLoading || chatHistory.length === 0}
        >
          Clear
        </button>
      </form>
    </div>
  );
}
