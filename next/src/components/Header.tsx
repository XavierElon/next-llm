import React, { useState } from 'react'

interface HeaderProps {
  selectedModel: string
  onModelChange: (model: string) => void
  isSidebarOpen: boolean
}

const AVAILABLE_MODELS = [
  // { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
]

export default function Header({ selectedModel, onModelChange, isSidebarOpen }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId)
    setIsDropdownOpen(false)
  }

  const selectedModelName = AVAILABLE_MODELS.find((model) => model.id === selectedModel)?.name

  return (
    <header className={`fixed top-0 h-16 bg-[#1E1E1E] z-40 flex items-center px-4 transition-all duration-300 ${isSidebarOpen ? 'left-[280px]' : 'left-16'}`} style={{ width: `calc(100% - ${isSidebarOpen ? '280px' : '64px'})` }}>
      <div className="relative flex flex-col">
        {/* Gemini Advanced and Arrow */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={toggleDropdown}>
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">Gemini</span>
            <span className="gradient-text">Advanced</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`text-gray-400 transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>
            <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Selected Model Name */}
        <span className="text-gray-400 text-sm">{selectedModelName}</span>

        {/* Custom Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute top-12 left-0 mt-1 py-1 w-48 bg-[#1E1F20] border border-[#2D2F31] rounded-lg shadow-lg z-50">
            {AVAILABLE_MODELS.map((model) => (
              <button key={model.id} onClick={() => handleModelSelect(model.id)} className="w-full px-4 py-2 text-left text-white text-xs hover:bg-[#3A3C3E] transition-colors">
                {model.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}
