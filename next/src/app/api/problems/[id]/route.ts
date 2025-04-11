import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params // Await the params Promise
    const { id: idStr } = params
    const id = parseInt(idStr)

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid problem ID' }, { status: 400 })
    }

    const problem = await prisma.problem.findUnique({
      where: { id },
      include: {
        testCases: true
      }
    })

    console.log('Database Problem:', problem)

    if (!problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 })
    }

    // Ensure functionName is included in the response
    const response = {
      ...problem,
      functionName: problem.functionName || 'solution'
    }
    console.log('API Response:', response)
    return NextResponse.json(response)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching problem:', error)
    return NextResponse.json({ error: 'Failed to fetch problem' }, { status: 500 })
  }
}
