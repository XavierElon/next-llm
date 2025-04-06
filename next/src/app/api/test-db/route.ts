import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  console.log('Attempting to connect to database...')
  console.log('Database URL:', process.env.POSTGRES_URL)

  try {
    // Test the connection by querying the database
    console.log('Executing test query...')
    const result = await prisma.$queryRaw`SELECT 1+1 as result`
    console.log('Database connection successful! Result:', result)

    // Get database version
    const version = await prisma.$queryRaw`SELECT version()`
    console.log('Database version:', version)

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      result,
      version
    })
  } catch (error) {
    console.error('Database connection error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to connect to database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
