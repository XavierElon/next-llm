'use client'

import { useState, KeyboardEvent, useEffect, useRef } from 'react'
import { DNA } from 'react-loader-spinner'
import Sidebar from './Sidebar'
import Header from './Header'

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

const AVAILABLE_MODELS = [
  // { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
]

export default function Chat() {
  const [prompt, setPrompt] = useState('')
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id)
  const [userId, setUserId] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    initializeUser()
  }, [])

  useEffect(() => {
    // Auto-scroll to the bottom when new messages are added
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [currentChat?.messages])

  const initializeUser = async () => {
    try {
      const usersRes = await fetch('/api/users')
      const users = await usersRes.json()

      if (users.length > 0) {
        setUserId(users[0].id)
        fetchChats(users[0].id)
      } else {
        const newUserRes = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: 'default_user',
            email: 'default@example.com'
          })
        })
        const newUser = await newUserRes.json()
        setUserId(newUser.id)
        fetchChats(newUser.id)
      }
    } catch (error) {
      console.error('Error initializing user:', error)
    }
  }

  const fetchChats = async (userId: number) => {
    try {
      const res = await fetch(`/api/chats?userId=${userId}`)
      const data = await res.json()
      if (data.length > 0) {
        setChats(data)
        setCurrentChat(data[0])
      } else {
        setChats([])
        setCurrentChat(null)
      }
    } catch (error) {
      console.error('Error fetching chats:', error)
      setChats([])
      setCurrentChat(null)
    }
  }

  const createNewChat = () => {
    const tempChat: Chat = {
      id: -1,
      title: 'New Chat',
      messages: []
    }
    setCurrentChat(tempChat)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!prompt.trim() || isLoading) return

    setIsLoading(true)
    const userMessage = prompt.trim()
    setPrompt('')

    try {
      let chat: Chat | null = currentChat

      if (!chat || chat.id < 0) {
        const newChatRes = await fetch('/api/chats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: 'New Chat',
            userId: userId
          })
        })
        const newChat: Chat = await newChatRes.json()
        chat = newChat
        setCurrentChat(newChat)
        setChats((prev) => [...prev, newChat])
      }

      if (!chat) {
        throw new Error('Failed to create or get chat')
      }

      const userRes = await fetch(`/api/chats/${chat.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: 'user',
          content: userMessage
        })
      })
      const userMessageData = await userRes.json()

      if (chat.messages.length === 0) {
        const titleRes = await fetch('/api/chats', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: chat.id,
            title: userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : '')
          })
        })
        const updatedChat: Chat = await titleRes.json()
        chat = updatedChat
        setChats((prev) => prev.map((c) => (c.id === chat!.id ? updatedChat : c)))
        setCurrentChat(updatedChat)
      } else {
        setCurrentChat((prev) => {
          if (!prev) return null
          return {
            ...prev,
            messages: [...prev.messages, userMessageData]
          }
        })
      }

      const tempAssistantMessage: Message = {
        id: 'temp-' + Date.now(),
        role: 'assistant',
        content: ''
      }

      setCurrentChat((prev) => {
        if (!prev) return null
        return {
          ...prev,
          messages: [...prev.messages, tempAssistantMessage]
        }
      })

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: userMessage,
          model: selectedModel
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const { text } = await response.json()

      setCurrentChat((prev) => {
        if (!prev) return null
        const messages = [...prev.messages]
        const tempMessageIndex = messages.findIndex((msg) => msg.id === tempAssistantMessage.id)
        if (tempMessageIndex !== -1) {
          messages[tempMessageIndex] = {
            ...messages[tempMessageIndex],
            content: text
          }
        }
        return {
          ...prev,
          messages
        }
      })

      const assistantRes = await fetch(`/api/chats/${chat!.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: 'assistant',
          content: text
        })
      })
      const assistantMessageData = await assistantRes.json()

      setCurrentChat((prev) => {
        if (!prev) return null
        const messages = [...prev.messages]
        const tempMessageIndex = messages.findIndex((msg) => msg.id === tempAssistantMessage.id)
        if (tempMessageIndex !== -1) {
          messages[tempMessageIndex] = assistantMessageData
        }
        return {
          ...prev,
          messages
        }
      })

      fetchChats(userId!)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const deleteChat = async (chatId: number) => {
    if (!userId) return

    try {
      await fetch(`/api/chats?id=${chatId}`, {
        method: 'DELETE'
      })
      setChats((prev) => prev.filter((chat) => chat.id !== chatId))
      if (currentChat?.id === chatId) {
        setCurrentChat(null)
        setPrompt('')
      }
      if (chats.length === 1) {
        setCurrentChat(null)
        setPrompt('')
      }
    } catch (error) {
      console.error('Error deleting chat:', error)
    }
  }

  const updateChatTitle = async (chatId: number, newTitle: string) => {
    if (!userId) return

    try {
      const res = await fetch('/api/chats', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: chatId,
          title: newTitle
        })
      })
      const updatedChat = await res.json()
      setChats((prev) => prev.map((chat) => (chat.id === chatId ? updatedChat : chat)))
      if (currentChat?.id === chatId) {
        setCurrentChat(updatedChat)
      }
      setEditingTitle(null)
    } catch (error) {
      console.error('Error updating chat title:', error)
    }
  }

  return (
    <div className="flex min-h-screen text-white bg-[#1E1E1E]">
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} chats={chats} currentChat={currentChat} onChatSelect={setCurrentChat} onCreateNewChat={createNewChat} onDeleteChat={deleteChat} onUpdateChatTitle={updateChatTitle} />
      <div className="flex-1 flex flex-col">
        <Header selectedModel={selectedModel} onModelChange={setSelectedModel} isSidebarOpen={isSidebarOpen} />

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col">
          {/* Chat Messages - Scrollable only when needed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 pt-16">
            {currentChat?.messages?.length ? (
              currentChat.messages.map((message, index) => (
                <div key={`msg-${message.id}-${index}`} className={`flex max-w-3xl mx-auto ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 rounded-lg max-w-[90%] ${message.role === 'user' ? 'bg-gray-800 text-white' : message.content === '' ? 'bg-transparent' : 'bg-transparent text-white'}`}>
                    {message.role === 'assistant' && message.content === '' ? (
                      <div className="flex justify-center items-center">
                        <DNA visible={true} height="80" width="80" ariaLabel="dna-loading" wrapperStyle={{ backgroundColor: 'transparent' }} wrapperClass="dna-wrapper" />
                      </div>
                    ) : (
                      <div className="prose prose-invert max-w-none">
                        <p className="whitespace-pre-wrap text-sm break-words overflow-hidden">{message.content}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center ml-16">
                  <p className="text-white text-4xl font-medium gradient-text">Hello, {userId ? 'Xavier' : 'Xavier'}</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input - Fixed at the Bottom */}
          <div className={`fixed bottom-0 p-4 bg-[#1E1E1E] transition-all duration-300 ${isSidebarOpen ? 'left-[280px]' : 'left-16'}`} style={{ width: `calc(100% - ${isSidebarOpen ? '280px' : '64px'})` }}>
            <div className="max-w-3xl mx-auto">
              <div className="relative flex items-center bg-[#1E1E1E] border border-[#2D2F31] rounded-lg">
                {/* Left Icons */}
                <div className="flex items-center gap-2 pl-3">
                  <button className="text-gray-400 hover:text-white">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  {/* <button className="text-gray-400 hover:text-white">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <path d="M9 3v18" />
                    </svg>
                  </button> */}
                </div>

                {/* Textarea */}
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={handleKeyDown} className="flex-1 p-4 bg-[#1E1E1E] border-none rounded-lg resize-none text-white placeholder-gray-400 focus:outline-none" placeholder="Ask Gemini..." rows={1} />

                {/* Right Icons */}
                <div className="flex items-center gap-2 pr-3">
                  <button onClick={handleSubmit} disabled={isLoading || !prompt.trim() || !currentChat} className="text-gray-400 hover:text-white disabled:text-gray-600">
                    {isLoading ? (
                      <span className="loading">...</span>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                  {/* <button className="text-gray-400 hover:text-white">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1v6M12 17v6M5 5l14 14M5 19L19 5" />
                    </svg>
                  </button> */}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
