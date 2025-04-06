import React from 'react'

interface HeaderProps {
  selectedModel: string
  onModelChange: (model: string) => void
}

const AVAILABLE_MODELS = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
]

export default function Header({ selectedModel, onModelChange }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#1E1E1E] border-b border-gray-700 z-40 flex items-center px-4">
      <div className="flex items-center gap-4 ml-16">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">Gemini</span>
          <span className="text-blue-400">Advanced</span>
        </div>
        <div className="relative">
          <select value={selectedModel} onChange={(e) => onModelChange(e.target.value)} className="appearance-none bg-gray-800 text-white border border-gray-700 rounded-lg py-1 px-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-700 transition-colors">
            {AVAILABLE_MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
          {/* Custom dropdown arrow */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </header>
  )
}
