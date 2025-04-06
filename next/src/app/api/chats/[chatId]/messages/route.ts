import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const { role, content } = await req.json()
    const { chatId } = await params

    const message = await prisma.message.create({
      data: {
        role,
        content,
        conversationId: parseInt(chatId)
      }
    })
    return NextResponse.json(message)
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
  }
}
