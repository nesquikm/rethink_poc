'use client';

import { useState, useEffect, useRef } from 'react';

type AIProvider = 'gpt-3.5-turbo' | 'gpt-4o-mini' | 'gemini' | 'claude';

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  provider?: AIProvider;
  isWinner?: boolean;
  votes?: Record<AIProvider, number>;
  turnId?: number; // To group messages by conversation turn
  isSelected?: boolean; // Flag to indicate if this response was selected by the user
};

// Type for tracking active tabs for each conversation turn
type ActiveTabsState = Record<number, AIProvider>;

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
        const votes = data.votes as Record<AIProvider, number>;
        const winner = data.winner as AIProvider;

        // Set the winner as the active tab for this turn
        setActiveTabs(prev => ({
          ...prev,
          [currentTurnId]: winner
        }));

        // Add all AI responses to chat history with voting information
        setChatHistory([
          ...updatedHistory,
          {
            role: 'assistant',
            content: data['gpt-3.5-turbo'],
            provider: 'gpt-3.5-turbo',
            isWinner: winner === 'gpt-3.5-turbo',
            isSelected: winner === 'gpt-3.5-turbo',
            votes,
            turnId: currentTurnId
          },
          {
            role: 'assistant',
            content: data['gpt-4o-mini'],
            provider: 'gpt-4o-mini',
            isWinner: winner === 'gpt-4o-mini',
            isSelected: winner === 'gpt-4o-mini',
            votes,
            turnId: currentTurnId
          },
          {
            role: 'assistant',
            content: data.gemini,
            provider: 'gemini',
            isWinner: winner === 'gemini',
            isSelected: winner === 'gemini',
            votes,
            turnId: currentTurnId
          },
          {
            role: 'assistant',
            content: data.claude,
            provider: 'claude',
            isWinner: winner === 'claude',
            isSelected: winner === 'claude',
            votes,
            turnId: currentTurnId
          }
        ]);
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

  // Function to change active tab for a specific turn
  const handleTabChange = (turnId: number, provider: AIProvider) => {
    // Only allow tab changes for the most recent turn
    if (turnId === lastTurnId) {
      setActiveTabs(prev => ({
        ...prev,
        [turnId]: provider
      }));
    }
  };

  // Function to group messages by conversation turns
  const getConversationTurns = () => {
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

    return Object.entries(turns).map(([id, data]) => ({
      id: parseInt(id),
      ...data
    })).sort((a, b) => a.id - b.id);
  };

  // Function to get the active tab for a turn, defaulting to the winner if no active tab is selected
  const getActiveTab = (turnId: number, responses: ChatMessage[]): AIProvider => {
    if (activeTabs[turnId]) {
      return activeTabs[turnId];
    }

    // If no active tab is selected, find the winning response
    const winner = responses.find(r => r.isWinner);
    if (winner?.provider) {
      return winner.provider as AIProvider;
    }

    // If no winner, return the first provider
    return responses[0]?.provider as AIProvider || 'gpt-4o-mini';
  };

  // Helper function to get provider badge color
  const getProviderColor = (provider?: AIProvider) => {
    if (provider === 'gpt-3.5-turbo') return 'bg-green-500';
    if (provider === 'gpt-4o-mini') return 'bg-purple-500';
    if (provider === 'gemini') return 'bg-blue-500';
    if (provider === 'claude') return 'bg-red-500';
    return '';
  };

  // Helper function to get provider display name
  const getProviderDisplayName = (provider?: AIProvider) => {
    if (provider === 'gpt-3.5-turbo') return 'GPT-3.5';
    if (provider === 'gpt-4o-mini') return 'GPT-4o-mini';
    if (provider === 'gemini') return 'GEMINI';
    if (provider === 'claude') return 'CLAUDE';
    return provider || '';
  };

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

  const conversationTurns = getConversationTurns();

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-white dark:bg-black rounded-lg shadow">
      {/* Header with clear button */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">AI Chat</h2>
        {chatHistory.length > 0 && (
          <button
            onClick={clearConversation}
            className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800"
          >
            Clear Conversation
          </button>
        )}
      </div>

      <div
        ref={chatContainerRef}
        className="h-[700px] overflow-y-auto mb-4 p-4 border border-gray-200 dark:border-gray-800 rounded"
      >
        {conversationTurns.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 h-full flex items-center justify-center">
            <p>Start a conversation by typing a message below.</p>
          </div>
        ) : (
          conversationTurns.map(turn => {
            const activeTab = getActiveTab(turn.id, turn.responses);
            const isLatestTurn = turn.id === lastTurnId;

            return (
              <div key={turn.id} className="mb-6">
                {/* User message */}
                {turn.user && (
                  <div
                    className="mb-4 p-3 rounded-lg bg-blue-100 dark:bg-blue-900 ml-auto max-w-[80%]"
                  >
                    <p className="text-sm">{turn.user.content}</p>
                  </div>
                )}

                {/* AI responses with tabs */}
                {turn.responses.length > 0 && (
                  <div className="mr-auto max-w-[90%]">
                    {/* Tabs header - only interactive for latest turn */}
                    <div className="flex overflow-x-auto mb-2 border-b border-gray-200 dark:border-gray-700">
                      {turn.responses.map(response => (
                        <button
                          key={response.provider}
                          onClick={() => handleTabChange(turn.id, response.provider as AIProvider)}
                          className={`px-3 py-2 text-xs font-medium whitespace-nowrap ${
                            activeTab === response.provider
                              ? `text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400`
                              : `text-gray-500 dark:text-gray-400 ${isLatestTurn ? 'hover:text-gray-700 dark:hover:text-gray-300' : ''}`
                          } ${!isLatestTurn ? 'cursor-default opacity-80' : ''}`}
                          aria-selected={activeTab === response.provider}
                          disabled={!isLatestTurn}
                        >
                          <div className="flex items-center">
                            <span className={`h-2 w-2 rounded-full mr-2 ${getProviderColor(response.provider as AIProvider)}`}></span>
                            {getProviderDisplayName(response.provider as AIProvider)}
                            {response.isWinner && (
                              <span className="ml-1 text-[10px] text-yellow-600 dark:text-yellow-400">★</span>
                            )}
                            {response.isSelected && !isLatestTurn && (
                              <span className="ml-1 text-[10px] text-blue-600 dark:text-blue-400">✓</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Tab content */}
                    {turn.responses.map(response => (
                      <div
                        key={response.provider}
                        className={`p-3 rounded-lg bg-gray-100 dark:bg-gray-900 ${
                          activeTab === response.provider ? 'block' : 'hidden'
                        }`}
                        role="tabpanel"
                        aria-hidden={activeTab !== response.provider}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className={`text-xs text-white px-2 py-0.5 rounded inline-block ${getProviderColor(response.provider as AIProvider)}`}>
                            {getProviderDisplayName(response.provider as AIProvider)}
                          </div>

                          <div className="flex items-center">
                            {response.votes && (
                              <>
                                <span className="text-xs text-gray-500 mr-1">Votes:</span>
                                <span className="text-xs font-bold">{response.votes[response.provider as AIProvider]}</span>
                              </>
                            )}

                            {response.isWinner && (
                              <span className="ml-2 text-xs bg-yellow-400 dark:bg-yellow-600 text-white px-2 py-0.5 rounded">
                                BEST ANSWER
                              </span>
                            )}

                            {response.isSelected && !isLatestTurn && (
                              <span className="ml-2 text-xs bg-blue-400 dark:bg-blue-600 text-white px-2 py-0.5 rounded">
                                SELECTED
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm">{response.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
        {isLoading && (
          <div className="text-center text-gray-500 dark:text-gray-400 my-4">
            <p>Thinking and evaluating responses...</p>
            <div className="flex justify-center gap-2 mt-2 flex-wrap">
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">GPT-3.5</span>
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded">GPT-4o-mini</span>
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">Gemini</span>
              <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs rounded">Claude</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 border border-gray-300 dark:border-gray-700 rounded-lg
                   bg-white dark:bg-gray-800 text-black dark:text-white"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600
                   disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}
