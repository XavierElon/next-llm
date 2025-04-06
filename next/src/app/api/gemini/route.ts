import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  throw new Error('Missing Gemini API key')
}

// Initialize the model
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY)

export async function POST(req: Request) {
  try {
    const { prompt, model } = await req.json()
    console.log('Received request:', { prompt, model })

    if (!prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Get the appropriate model
    const modelInstance = genAI.getGenerativeModel({
      model,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192
      }
    })

    try {
      console.log('Generating content with model:', model)
      // Convert prompt to string if it's not already
      const promptText = typeof prompt === 'string' ? prompt : JSON.stringify(prompt)

      const result = await modelInstance.generateContent([{ text: promptText }])
      console.log('Raw result:', result)

      const response = await result.response
      console.log('Response:', response)

      const text = response.text()
      console.log('Generated text:', text)

      if (!text) {
        throw new Error('No text generated from response')
      }

      return Response.json({ text })
    } catch (error) {
      console.error('Error generating content:', error)
      throw error
    }
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
