import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        userId: parseInt(userId)
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })
    return NextResponse.json(conversations)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { title, userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const conversation = await prisma.conversation.create({
      data: {
        title,
        userId: parseInt(userId)
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })
    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // First delete all messages associated with the conversation
    await prisma.message.deleteMany({
      where: {
        conversationId: parseInt(id)
      }
    })

    // Then delete the conversation
    await prisma.conversation.delete({
      where: {
        id: parseInt(id)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting conversation:', error)
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, title, isPinned } = await request.json()

    if (!id || !title) {
      return NextResponse.json({ error: 'id and title are required' }, { status: 400 })
    }

    const conversation = await prisma.conversation.update({
      where: {
        id: parseInt(id)
      },
      data: {
        title,
        ...(typeof isPinned === 'boolean' ? { isPinned } : {})
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Error updating conversation:', error)
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 })
  }
}

// Helper function to generate a title from a message
function generateTitleFromMessage(message: string): string {
  // Take first 50 characters or first sentence, whichever is shorter
  const firstSentence = message.split(/[.!?]/)[0]
  const maxLength = 50
  const title = firstSentence.length > maxLength ? firstSentence.substring(0, maxLength) + '...' : firstSentence
  return title.trim()
}

// Function to update conversation title based on first message
export async function updateConversationTitle(conversationId: number, message: string) {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: true }
    })

    // Only update title if this is the first message
    if (conversation && conversation.messages.length === 1) {
      const newTitle = generateTitleFromMessage(message)
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { title: newTitle }
      })
    }
  } catch (error) {
    console.error('Error updating conversation title:', error)
  }
}
