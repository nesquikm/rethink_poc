export default function Loading() {
  return (
    <div className="grid grid-rows-[auto_1fr_auto] min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold">AI Chat Interface</h1>
        <p className="text-gray-500">Loading...</p>
      </header>

      <main className="flex justify-center items-start w-full">
        <div className="w-full max-w-2xl mx-auto p-4 bg-white dark:bg-black rounded-lg shadow">
          <div className="h-[400px] mb-4 p-4 border border-gray-200 dark:border-gray-800 rounded flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500">Loading chat interface...</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 p-2 border border-gray-300 dark:border-gray-700 rounded-lg"></div>
            <div className="px-4 py-2 bg-gray-400 text-white rounded-lg">Send</div>
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
