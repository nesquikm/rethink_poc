'use client';

import { useState, useEffect, useRef } from 'react';

type AIProvider = 'gpt-3.5-turbo' | 'gpt-4o-mini' | 'gemini';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  provider?: AIProvider;
};

export default function Chat() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // This ensures the component only renders fully on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll to bottom when chat history updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    const userMessage = message.trim();
    setMessage('');

    // Add user message to chat history
    const updatedHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: userMessage }];
    setChatHistory(updatedHistory);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (response.ok) {
        // Add all AI responses to chat history
        setChatHistory([
          ...updatedHistory,
          { role: 'assistant', content: data['gpt-3.5-turbo'], provider: 'gpt-3.5-turbo' },
          { role: 'assistant', content: data['gpt-4o-mini'], provider: 'gpt-4o-mini' },
          { role: 'assistant', content: data.gemini, provider: 'gemini' }
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

  // Helper function to get provider badge color
  const getProviderColor = (provider?: AIProvider) => {
    if (provider === 'gpt-3.5-turbo') return 'bg-green-500';
    if (provider === 'gpt-4o-mini') return 'bg-purple-500';
    if (provider === 'gemini') return 'bg-blue-500';
    return '';
  };

  // Helper function to get provider display name
  const getProviderDisplayName = (provider?: AIProvider) => {
    if (provider === 'gpt-3.5-turbo') return 'GPT-3.5';
    if (provider === 'gpt-4o-mini') return 'GPT-4o-mini';
    if (provider === 'gemini') return 'GEMINI';
    return provider || '';
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-white dark:bg-black rounded-lg shadow">
      <div
        ref={chatContainerRef}
        className="h-[600px] overflow-y-auto mb-4 p-4 border border-gray-200 dark:border-gray-800 rounded"
      >
        {chatHistory.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 h-full flex items-center justify-center">
            <p>Start a conversation by typing a message below.</p>
          </div>
        ) : (
          chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`mb-4 p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-100 dark:bg-blue-900 ml-auto'
                  : 'bg-gray-100 dark:bg-gray-900'
              } max-w-[80%] ${msg.role === 'user' ? 'ml-auto' : 'mr-auto'}`}
            >
              {msg.provider && (
                <div className={`text-xs text-white px-2 py-0.5 rounded mb-1 inline-block ${getProviderColor(msg.provider)}`}>
                  {getProviderDisplayName(msg.provider)}
                </div>
              )}
              <p className="text-sm">{msg.content}</p>
            </div>
          ))
        )}
        {isLoading && (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>Thinking...</p>
            <div className="flex justify-center gap-2 mt-2">
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">GPT-3.5</span>
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded">GPT-4o-mini</span>
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">Gemini</span>
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
