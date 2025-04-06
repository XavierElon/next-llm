import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, userId, initialMessage } = body

    if (!userId || !initialMessage) {
      return NextResponse.json({ error: 'userId and initialMessage are required' }, { status: 400 })
    }

    // Create a new conversation with its first message
    const conversation = await prisma.conversation.create({
      data: {
        title: title || 'New Conversation',
        userId: parseInt(userId),
        messages: {
          create: {
            content: initialMessage,
            role: 'user'
          }
        }
      },
      include: {
        messages: true
      }
    })

    return NextResponse.json(conversation, { status: 201 })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      {
        error: 'Failed to create conversation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

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
    return NextResponse.json(
      {
        error: 'Failed to fetch conversations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
