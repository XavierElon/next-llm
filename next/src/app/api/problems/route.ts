import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const difficulty = searchParams.get('difficulty')
    const category = searchParams.get('category')

    const where = {
      ...(difficulty && difficulty !== 'all' ? { difficulty } : {}),
      ...(category && category !== 'all' ? { category } : {})
    }

    const problems = await prisma.problem.findMany({
      where,
      include: {
        testCases: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(problems)
  } catch (error) {
    console.error('Error fetching problems:', error)
    return NextResponse.json({ error: 'Failed to fetch problems' }, { status: 500 })
  }
}
