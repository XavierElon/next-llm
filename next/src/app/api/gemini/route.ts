import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  throw new Error('Missing Gemini API key')
}

// Initialize the model
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY)

export async function POST(req: Request) {
  try {
    const { prompt, model } = await req.json()

    if (!prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const modelInstance = genAI.getGenerativeModel({ model })
    const result = await modelInstance.generateContentStream(prompt)

    // Create a ReadableStream to stream the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text()
            controller.enqueue(text)
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      }
    })

    // Return the stream with appropriate headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain',
        'Transfer-Encoding': 'chunked'
      }
    })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: 'Failed to process the request' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent('List available models')
    const response = result.response
    const text = response.text()

    return Response.json({ text })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Failed to list models' }, { status: 500 })
  }
}
