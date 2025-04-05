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

  useEffect(() => {
    fetchChats()
  }, [])

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/chats')
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
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: 'New Chat' })
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
    if (!prompt.trim() || isLoading || !currentChat) return

    setIsLoading(true)
    const userMessage = prompt.trim()
    setPrompt('')

    try {
      // Save user message
      const userRes = await fetch(`/api/chats/${currentChat.id}/messages`, {
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

      // Get AI response
      const aiRes = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: userMessage,
          model: selectedModel
        })
      })
      const aiData = await aiRes.json()

      // Save AI message
      const assistantRes = await fetch(`/api/chats/${currentChat.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: 'assistant',
          content: aiData.text
        })
      })
      const assistantMessageData = await assistantRes.json()

      // Update current chat
      setCurrentChat((prev) => ({
        ...prev!,
        messages: [...prev!.messages, userMessageData, assistantMessageData]
      }))

      // Refresh chats list
      fetchChats()
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

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 p-4">
        <button onClick={createNewChat} className="w-full mb-4 p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
          New Chat
        </button>
        <div className="space-y-2">
          {chats.map((chat) => (
            <button key={chat.id} onClick={() => setCurrentChat(chat)} className={`w-full p-2 text-left rounded-md ${currentChat?.id === chat.id ? 'bg-blue-200' : 'hover:bg-gray-200'}`}>
              {chat.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b">
          <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="p-2 border border-gray-300 rounded-md" disabled={isLoading}>
            {AVAILABLE_MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentChat?.messages.map((message) => (
            <div key={message.id} className={`p-4 rounded-lg ${message.role === 'user' ? 'bg-blue-100 ml-auto max-w-[80%]' : 'bg-gray-100 mr-auto max-w-[80%]'}`}>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t">
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={handleKeyDown} className="w-full p-2 border border-gray-300 rounded-md" placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)" rows={3} />
          <button type="submit" disabled={isLoading || !prompt.trim() || !currentChat} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400">
            {isLoading ? 'Generating...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
}
