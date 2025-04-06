import { useState } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface Chat {
  id: string
  title: string
  messages: Message[]
}

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  chats: Chat[]
  currentChat: Chat | null
  selectedModel: string
  onModelChange: (model: string) => void
  onChatSelect: (chat: Chat) => void
  onCreateNewChat: () => void
  onDeleteChat: (chatId: string) => void
  onUpdateChatTitle: (chatId: string, newTitle: string) => void
}

const AVAILABLE_MODELS = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
  { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro' },
  { id: 'gemini-pro-vision', name: 'Gemini 1.0 Pro Vision' },
  { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash' },
  { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro' }
]

export default function Sidebar({ isOpen, onToggle, chats, currentChat, selectedModel, onModelChange, onChatSelect, onCreateNewChat, onDeleteChat, onUpdateChatTitle }: SidebarProps) {
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')

  const startEditingTitle = (chatId: string, currentTitle: string) => {
    setEditingTitle(chatId)
    setNewTitle(currentTitle)
  }

  return (
    <>
      {/* Collapse Button */}
      <button onClick={onToggle} className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors" aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-transform ${isOpen ? 'rotate-0' : 'rotate-180'}`}>
          <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-[280px] flex flex-col bg-[#1E1E1E] border-r border-gray-700 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Model Select */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2 text-sm">
            <span>Gemini</span>
            <select value={selectedModel} onChange={(e) => onModelChange(e.target.value)} className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded-lg text-sm">
              {AVAILABLE_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sections */}
        <div className="flex-1 overflow-y-auto">
          {/* New Chat Button */}
          <div className="p-4">
            <button onClick={onCreateNewChat} className="w-full flex items-center gap-3 px-4 py-3 rounded-full hover:bg-gray-800 transition-colors text-sm">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>New chat</span>
            </button>
          </div>

          {/* Recent Section */}
          <div className="px-3 py-2">
            <div className="text-xs text-gray-400 px-3 py-2">Recent</div>
            <div className="space-y-1">
              {chats.map((chat) => (
                <div key={chat.id} onClick={() => onChatSelect(chat)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm cursor-pointer ${currentChat?.id === chat.id ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                    <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  <span className="truncate flex-1">{chat.title}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditingTitle(chat.id, chat.title)
                      }}
                      className="p-1 text-gray-400 hover:text-white cursor-pointer">
                      ✏️
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteChat(chat.id)
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 cursor-pointer">
                      🗑️
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-auto border-t border-gray-700 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 7H13V13H11V7ZM11 15H13V17H11V15Z" fill="currentColor" />
            </svg>
            <span>Help</span>
          </div>
        </div>
      </div>
    </>
  )
}
