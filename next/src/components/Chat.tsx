'use client'

import { useState, KeyboardEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
]

export default function Chat() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id)
  const [userId, setUserId] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  useEffect(() => {
    initializeUser()
  }, [])

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

  const startEditingTitle = (chatId: string, currentTitle: string) => {
    setEditingTitle(chatId)
    setNewTitle(currentTitle)
  }

  return (
    <div className="flex h-screen text-white">
      <Header selectedModel={selectedModel} onModelChange={setSelectedModel} />
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} chats={chats} currentChat={currentChat} onChatSelect={setCurrentChat} onCreateNewChat={createNewChat} onDeleteChat={deleteChat} onUpdateChatTitle={updateChatTitle} />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-h-screen">
        <div className="flex-1 flex flex-col pt-16">
          {/* Chat Input at Top */}
          <div className="border-b border-gray-700 p-4 sticky top-16 z-10">
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={handleKeyDown} className="w-full p-4 pr-24 bg-gray-800 border border-gray-700 rounded-lg resize-none text-white placeholder-gray-400" placeholder="Ask Gemini..." rows={1} />
                <button onClick={handleSubmit} disabled={isLoading || !prompt.trim() || !currentChat} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white disabled:text-gray-600">
                  {isLoading ? <span className="loading">...</span> : <span>↵</span>}
                </button>
              </div>
              <p className="mt-2 text-xs text-center text-gray-400">Gemini can make mistakes, so double-check its responses</p>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {currentChat?.messages?.map((message, index) => (
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
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
