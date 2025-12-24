import { useState } from 'react'

function App() {
  const [input, setInput] = useState('')

  const handleSolve = () => {
    if (!input) return;
    const url = `https://derivativecalculatorai.com/?equation=${encodeURIComponent(input)}`;
    chrome.tabs.create({ url });
  };

  return (
    <div className="w-[300px] p-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
      <h1 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="text-blue-600 dark:text-blue-400">Derivative</span>
        <span>AI</span>
      </h1>

      <div className="mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter function (e.g. x^2)"
          className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          onKeyDown={(e) => e.key === 'Enter' && handleSolve()}
        />
      </div>

      <button
        onClick={handleSolve}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
      >
        Solve in New Tab
      </button>

      <div className="mt-4 text-xs text-center opacity-50">
        <p>Pro Tip: Right-click any math on a page to solve instantly.</p>
      </div>
    </div>
  )
}

export default App
