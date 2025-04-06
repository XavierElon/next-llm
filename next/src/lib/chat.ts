import { prisma } from './prisma'

export type Message = {
  id: number
  content: string
  role: 'user' | 'assistant'
  createdAt: Date
}

export type Conversation = {
  id: number
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export async function createConversation(userId: number, initialMessage: string, title?: string) {
  try {
    const response = await fetch('/api/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        initialMessage,
        title
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create conversation')
    }

    return response.json()
  } catch (error) {
    console.error('Error creating conversation:', error)
    throw error
  }
}

export async function addMessage(conversationId: number, content: string, role: 'user' | 'assistant') {
  try {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        conversationId,
        content,
        role
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to add message')
    }

    return response.json()
  } catch (error) {
    console.error('Error adding message:', error)
    throw error
  }
}

export async function getConversations(userId: number) {
  try {
    const response = await fetch(`/api/conversations?userId=${userId}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch conversations')
    }

    return response.json()
  } catch (error) {
    console.error('Error fetching conversations:', error)
    throw error
  }
}

export async function getMessages(conversationId: number) {
  try {
    const response = await fetch(`/api/messages?conversationId=${conversationId}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch messages')
    }

    return response.json()
  } catch (error) {
    console.error('Error fetching messages:', error)
    throw error
  }
}
