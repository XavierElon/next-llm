import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(req: Request, { params }: { params: { chatId: string } }) {
  try {
    const { role, content } = await req.json()
    const message = await prisma.message.create({
      data: {
        role,
        content,
        chatId: params.chatId
      }
    })
    return NextResponse.json(message)
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
  }
}
