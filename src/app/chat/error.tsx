'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Chat page error:', error);
  }, [error]);

  return (
    <div className="grid grid-rows-[auto_1fr_auto] min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold">Something went wrong!</h1>
        <p className="text-gray-500">We encountered an error loading the chat interface.</p>
      </header>

      <main className="flex flex-col justify-center items-center w-full gap-6">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg max-w-2xl w-full">
          <h2 className="text-red-600 dark:text-red-400 font-semibold mb-2">Error Details</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {error.message || 'An unexpected error occurred'}
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={reset}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Try again
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Go back home
            </Link>
          </div>
        </div>
      </main>

      <footer className="flex gap-6 flex-wrap items-center justify-center">
        <p className="text-sm text-gray-500">
          Powered by OpenAI
        </p>
      </footer>
    </div>
  );
}
