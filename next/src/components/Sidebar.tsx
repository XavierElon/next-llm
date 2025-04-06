import { useState, useEffect } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface Chat {
  id: number
  title: string
  messages: Message[]
}

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  chats: Chat[]
  currentChat: Chat | null
  onChatSelect: (chat: Chat) => void
  onCreateNewChat: () => void
  onDeleteChat: (chatId: number) => void
  onUpdateChatTitle: (chatId: number, newTitle: string) => void
}

export default function Sidebar({ isOpen, onToggle, chats, currentChat, onChatSelect, onCreateNewChat, onDeleteChat, onUpdateChatTitle }: SidebarProps) {
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [menuOpenForChat, setMenuOpenForChat] = useState<string | null>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('.menu-container') || target.closest('.menu-button')) {
        return
      }
      setMenuOpenForChat(null)
      setEditingTitle(null)
    }

    if (menuOpenForChat || editingTitle) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [menuOpenForChat, editingTitle])

  const startEditingTitle = (chatId: number, currentTitle: string) => {
    setEditingTitle(chatId.toString())
    setNewTitle(currentTitle)
  }

  const handleUpdateTitle = (chatId: number) => {
    if (newTitle.trim()) {
      onUpdateChatTitle(chatId, newTitle)
    }
    setEditingTitle(null)
    setNewTitle('')
    setMenuOpenForChat(null)
  }

  const handleDeleteChat = (chatId: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDeleteChat(chatId)
    setMenuOpenForChat(null)
  }

  const toggleMenu = (chatId: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setMenuOpenForChat(menuOpenForChat === chatId.toString() ? null : chatId.toString())
  }

  return (
    <>
      {/* Sidebar */}
      <div className={`fixed top-16 left-0 h-[calc(100%-4rem)] flex flex-col bg-[#1E1E1E] transition-all duration-300 ${isOpen ? 'w-[280px]' : 'w-16'} border-r border-gray-700`}>
        {/* Top Icons Section */}
        <div className="flex flex-col gap-4 p-4">
          {/* Hamburger Menu */}
          <button onClick={onToggle} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* New Chat Button */}
          {isOpen ? (
            <button onClick={onCreateNewChat} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-sm">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>New chat</span>
            </button>
          ) : (
            <button onClick={onCreateNewChat} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Chat List - Only show when sidebar is open */}
        {isOpen && (
          <div className="flex-1 overflow-y-auto px-3 py-2">
            <div className="text-xs text-gray-400 px-3 py-2">Recent</div>
            <div className="space-y-1">
              {chats.map((chat) => (
                <div key={chat.id} onClick={() => onChatSelect(chat)} className={`group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm cursor-pointer ${currentChat?.id === chat.id ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                    <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  {editingTitle === chat.id.toString() ? (
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateTitle(chat.id)
                        } else if (e.key === 'Escape') {
                          setEditingTitle(null)
                          setNewTitle('')
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-gray-700 text-white px-2 py-1 rounded"
                      autoFocus
                    />
                  ) : (
                    <span className="truncate flex-1">{chat.title}</span>
                  )}
                  <div className="relative">
                    <button onClick={(e) => toggleMenu(chat.id, e)} className="menu-button p-1 hover:bg-gray-700 rounded transition-opacity">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                        <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" fill="currentColor" />
                        <path d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z" fill="currentColor" />
                        <path d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z" fill="currentColor" />
                      </svg>
                    </button>
                    {menuOpenForChat === chat.id.toString() && (
                      <div className="menu-container absolute right-0 mt-1 py-1 w-48 bg-gray-800 rounded-lg shadow-lg z-50">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            startEditingTitle(chat.id, chat.title)
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Edit Title
                        </button>
                        <button onClick={(e) => handleDeleteChat(chat.id, e)} className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center gap-2 text-red-400">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-red-400">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
