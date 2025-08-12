import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-8 mb-8">
        <a href="https://vite.dev" target="_blank" rel="noopener noreferrer" className="transition-all duration-300 hover:scale-110">
          <img src={viteLogo} className="h-16 w-16" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noopener noreferrer" className="transition-all duration-300 hover:scale-110">
          <img src={reactLogo} className="h-16 w-16" alt="React logo" />
        </a>
      </div>
      <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
        Vite + React + TypeScript + Tailwind CSS
      </h1>
      <div className="bg-gray-800 rounded-xl p-6 shadow-xl w-full max-w-md mb-8">
        <button 
          onClick={() => setCount((count) => count + 1)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 w-full"
        >
          count is {count}
        </button>
        <p className="mt-4 text-gray-300 text-center">
          Edit <code className="bg-gray-700 px-2 py-1 rounded text-sm">src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="text-gray-400 text-center">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  )
}

export default App
