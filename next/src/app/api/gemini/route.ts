import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  throw new Error('Missing Gemini API key')
}

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY)

export async function POST(req: Request) {
  try {
    const { prompt, model } = await req.json()
    console.log('Received request:', { prompt, model })

    if (!prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Validate model name (optional: add more validation if needed)
    const validModels = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'] // Update this list based on API docs
    if (!validModels.includes(model)) {
      return Response.json({ error: `Invalid model: ${model}` }, { status: 400 })
    }

    const modelInstance = genAI.getGenerativeModel({
      model,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192
      }
    })

    // Ensure prompt is a string
    const promptText = typeof prompt === 'string' ? prompt : JSON.stringify(prompt)
    console.log('Prompt text:', promptText)

    // Try a simpler input format first
    console.log('Generating content with model:', model)
    const result = await modelInstance.generateContent(promptText) // Simplified input
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
    return Response.json({ error: error instanceof Error ? error.message : 'Failed to process the request' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) // Use a known valid model
    const result = await model.generateContent('List available models')
    const response = await result.response
    const text = response.text()

    return Response.json({ text })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Failed to list models' }, { status: 500 })
  }
}
