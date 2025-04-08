'use client'

import React, { useState, useEffect, useRef } from 'react'

interface Chat {
  id: number
  title: string
  messages: { id: string; role: 'user' | 'assistant'; content: string }[]
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
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null)
  const [editingChatId, setEditingChatId] = useState<number | null>(null)
  const [newTitle, setNewTitle] = useState<string>('')
  const [menuTop, setMenuTop] = useState<string>('0px')
  const [showAllChats, setShowAllChats] = useState(false)
  const [visibleChats, setVisibleChats] = useState(5)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Update the CSS variable when menuTop changes
    document.documentElement.style.setProperty('--menu-top', menuTop)
  }, [menuTop])

  useEffect(() => {
    // Handle click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleEditClick = (chat: Chat) => {
    setEditingChatId(chat.id)
    setNewTitle(chat.title)
    setMenuOpenId(null)
  }

  const handleTitleChange = (chatId: number) => {
    if (newTitle.trim()) {
      onUpdateChatTitle(chatId, newTitle.trim())
    }
    setEditingChatId(null)
    setNewTitle('')
  }

  const handlePinClick = (chatId: number) => {
    // Placeholder for pinning functionality
    console.log(`Pinning chat with ID: ${chatId}`)
    setMenuOpenId(null)
  }

  const handleMenuClick = (e: React.MouseEvent, chatId: number) => {
    e.stopPropagation()
    const button = e.currentTarget as HTMLElement
    const rect = button.getBoundingClientRect()
    setMenuTop(`${rect.top}px`)
    setMenuOpenId(menuOpenId === chatId ? null : chatId)
  }

  return (
    <aside className={`fixed top-0 left-0 h-screen bg-[#282A2C] z-50 transition-all duration-300 ${isOpen ? 'w-[280px]' : 'w-16'}`}>
      <div className="flex flex-col h-full">
        {/* Header: Toggle Button */}
        <div className="flex items-center p-4 ml-2">
          <button onClick={onToggle} className="text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-4 pb-4">
          {isOpen ? (
            <button onClick={onCreateNewChat} className="flex items-center gap-2 text-white text-sm hover:bg-[#3A3C3E] rounded px-2 py-1 transition-colors w-full">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4v16m8-8H4" />
              </svg>
              New chat
            </button>
          ) : (
            <button onClick={onCreateNewChat} className="flex items-center justify-center text-white hover:bg-[#3A3C3E] rounded p-2 transition-colors w-full">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>

        {/* Chat List */}
        {isOpen && (
          <div className="flex-1 overflow-y-auto p-2">
            <h3 className="text-gray-400 text-xs font-medium px-2 mb-2">Recent</h3>
            <ul className="space-y-1">
              {chats.slice(0, showAllChats ? visibleChats : 5).map((chat) => (
                <li key={chat.id} className={`group flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors ${currentChat?.id === chat.id ? 'bg-[#3A3C3E]' : 'hover:bg-[#3A3C3E]'}`} onClick={() => onChatSelect(chat)}>
                  <div className="flex items-center gap-2 flex-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    {editingChatId === chat.id ? (
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onBlur={() => handleTitleChange(chat.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleTitleChange(chat.id)
                          } else if (e.key === 'Escape') {
                            setEditingChatId(null)
                            setNewTitle('')
                          }
                        }}
                        className="bg-[#3A3C3E] text-white text-sm rounded px-2 py-1 w-full focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <span className="text-white text-sm truncate">{chat.title}</span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <button onClick={(e) => handleMenuClick(e, chat.id)} className="text-gray-400 hover:text-white">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="5" r="1" />
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="12" cy="19" r="1" />
                      </svg>
                    </button>
                    {menuOpenId === chat.id && (
                      <div ref={menuRef} className="fixed left-[280px] top-[var(--menu-top)] ml-2 py-1 w-36 bg-[#1E2021] border border-[#2D2F31] rounded-lg shadow-lg z-[9999]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePinClick(chat.id)
                          }}
                          className="flex items-center gap-2 w-full px-3 py-1 text-left text-white hover:bg-[#3A3C3E] transition-colors">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          Pin
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditClick(chat)
                          }}
                          className="flex items-center gap-2 w-full px-3 py-1 text-left text-white hover:bg-[#3A3C3E] transition-colors">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Rename
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteChat(chat.id)
                            setMenuOpenId(null)
                          }}
                          className="flex items-center gap-2 w-full px-3 py-1 text-left text-white hover:bg-[#3A3C3E] transition-colors">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {/* More/Less Buttons */}
            {chats.length > 5 && (
              <div className="mt-2">
                {!showAllChats ? (
                  <button
                    onClick={() => {
                      setShowAllChats(true)
                      setVisibleChats(10)
                    }}
                    className="flex items-center gap-2 px-2 py-1 text-gray-400 text-sm hover:bg-[#3A3C3E] rounded transition-colors w-full">
                    <span>More</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                ) : (
                  <div className="space-y-1">
                    <button onClick={() => setShowAllChats(false)} className="flex items-center gap-2 px-2 py-1 text-gray-400 text-sm hover:bg-[#3A3C3E] rounded transition-colors w-full">
                      <span>Less</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 15l6-6 6 6" />
                      </svg>
                    </button>
                    {visibleChats < chats.length && (
                      <button onClick={() => setVisibleChats((prev) => Math.min(prev + 10, chats.length))} className="flex items-center gap-2 px-2 py-1 text-gray-400 text-sm hover:bg-[#3A3C3E] rounded transition-colors w-full">
                        <span>Load More</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
