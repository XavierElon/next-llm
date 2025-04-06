'use client'

import { useState, KeyboardEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

const AVAILABLE_MODELS = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
  { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro' },
  { id: 'gemini-pro-vision', name: 'Gemini 1.0 Pro Vision' },
  { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash' },
  { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro' }
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
      // First try to get existing users
      const usersRes = await fetch('/api/users')
      const users = await usersRes.json()

      if (users.length > 0) {
        setUserId(users[0].id)
        fetchChats(users[0].id)
      } else {
        // Create a new user if none exist
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
      setChats(data)
      if (data.length > 0 && !currentChat) {
        setCurrentChat(data[0])
      }
    } catch (error) {
      console.error('Error fetching chats:', error)
    }
  }

  const createNewChat = async () => {
    if (!userId) return

    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'New Chat',
          userId: userId
        })
      })
      const newChat = await res.json()
      setChats((prev) => [newChat, ...prev])
      setCurrentChat(newChat)
    } catch (error) {
      console.error('Error creating chat:', error)
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!prompt.trim() || isLoading) return

    setIsLoading(true)
    const userMessage = prompt.trim()
    setPrompt('')

    try {
      let chat: Chat | null = currentChat

      // Create a new chat if one doesn't exist
      if (!chat) {
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
        chat = await newChatRes.json()
        setCurrentChat(chat)
        setChats((prev) => [chat!, ...prev])
      }

      if (!chat) {
        throw new Error('Failed to create or get chat')
      }

      // Save user message
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

      // Update chat title if this is the first message
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
        const updatedChat = await titleRes.json()
        chat = updatedChat
        setChats((prev) => prev.map((c) => (c.id === chat!.id ? updatedChat : c)))
        setCurrentChat(updatedChat)
      }

      // Create a temporary assistant message for streaming
      const tempAssistantMessage: Message = {
        id: 'temp-' + Date.now(),
        role: 'assistant',
        content: ''
      }

      // Update current chat with both messages at once
      setCurrentChat((prev) => {
        if (!prev) return null
        return {
          ...prev,
          messages: [...prev.messages, userMessageData, tempAssistantMessage]
        }
      })

      // Get AI response with streaming
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

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No reader available')
      }

      let accumulatedContent = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Convert the chunk to text
        const chunk = new TextDecoder().decode(value)
        accumulatedContent += chunk

        // Update the temporary message with the accumulated content
        setCurrentChat((prev) => {
          if (!prev) return null
          const messages = [...prev.messages]
          const tempMessageIndex = messages.findIndex((msg) => msg.id === tempAssistantMessage.id)
          if (tempMessageIndex !== -1) {
            messages[tempMessageIndex] = {
              ...messages[tempMessageIndex],
              content: accumulatedContent
            }
          }
          return {
            ...prev,
            messages
          }
        })
      }

      // Save the final assistant message
      const assistantRes = await fetch(`/api/chats/${chat!.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: 'assistant',
          content: accumulatedContent
        })
      })
      const assistantMessageData = await assistantRes.json()

      // Update current chat with the final message
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

      // Refresh chats list
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

  const deleteChat = async (chatId: string) => {
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

  const updateChatTitle = async (chatId: string, newTitle: string) => {
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
    <div className="flex h-screen bg-[#1E1E1E] text-white">
      {/* Left Sidebar */}
      <div className="w-[280px] flex flex-col border-r border-gray-700">
        {/* New Chat Button */}
        <div className="p-4">
          <button onClick={createNewChat} className="w-full p-3 flex items-center gap-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors">
            <span>+</span>
            <span>New chat</span>
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-2 space-y-1">
            {chats.map((chat) => (
              <div key={`chat-${chat.id}-${chat.title.substring(0, 10)}`} className={`group flex items-center p-3 rounded-lg cursor-pointer ${currentChat?.id === chat.id ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>
                <button onClick={() => setCurrentChat(chat)} className="flex-1 text-left truncate text-sm">
                  {chat.title}
                </button>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      startEditingTitle(chat.id, chat.title)
                    }}
                    className="p-1 text-gray-400 hover:text-white">
                    ✏️
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteChat(chat.id)
                    }}
                    className="p-1 text-gray-400 hover:text-red-500">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Model Select */}
        <div className="p-4 border-t border-gray-700">
          <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-sm" disabled={isLoading}>
            {AVAILABLE_MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {currentChat?.messages?.map((message, index) => (
            <div key={`msg-${message.id}-${index}`} className={`flex max-w-3xl mx-auto ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-4 rounded-lg max-w-[90%] ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-white'}`}>
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div className="border-t border-gray-700 p-4">
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
      </div>
    </div>
  )
}
