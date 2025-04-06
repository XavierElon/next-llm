import React from 'react'

interface HeaderProps {
  selectedModel: string
  onModelChange: (model: string) => void
}

const AVAILABLE_MODELS = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' }
  // Add other models as needed
]

export default function Header({ selectedModel, onModelChange }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#1E1E1E] border-b border-gray-700 z-40 flex items-center px-4">
      <div className="flex items-center gap-4 ml-16">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">Gemini</span>
          <span className="text-blue-400">Advanced</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-400">
            <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="text-xs text-gray-400">2.5 Pro (experimental)</div>
      </div>
    </header>
  )
}
