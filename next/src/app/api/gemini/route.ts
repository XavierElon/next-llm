import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai' // Import GenerationConfig if needed

if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  throw new Error('Missing Gemini API key')
}

// Initialize client once, outside the handler
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY)

// Define valid models outside
const VALID_MODELS = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'] // Add others as needed

export async function POST(req: Request) {
  try {
    // Use a different name for the model variable from the request body
    const { prompt, model: requestedModel } = await req.json()
    console.log('Received request:', { prompt, model: requestedModel })

    if (!prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Validate model name
    if (!VALID_MODELS.includes(requestedModel)) {
      return Response.json({ error: `Invalid model: ${requestedModel}` }, { status: 400 })
    }

    // Ensure prompt is a string
    const promptText = typeof prompt === 'string' ? prompt : JSON.stringify(prompt)
    console.log('Prompt text:', promptText)

    // Configuration object (keep separate for clarity)
    const generationConfig: GenerationConfig = {
      temperature: 0.7,
      maxOutputTokens: 8192
    }

    // Get model instance using the global genAI client
    const modelInstance = genAI.getGenerativeModel({
      model: requestedModel, // Use the variable from req.json()
      generationConfig
    })
    console.log('Model instance obtained for:', requestedModel)

    // Generate content
    console.log('Generating content with model:', requestedModel)
    const result = await modelInstance.generateContent(promptText)
    console.log('Raw result:', result)

    const response = await result.response
    console.log('Response:', response)

    const text = response.text()
    console.log('Generated text:', text)

    if (text === undefined || text === null) {
      // Stricter check
      throw new Error('No text generated from response')
    }

    return Response.json({ text })
  } catch (error) {
    console.error('Error generating content:', error)
    // Log the specific error type if helpful
    if (error instanceof Error) {
      console.error(`Error Type: ${error.name}, Message: ${error.message}`)
    }
    return Response.json({ error: error instanceof Error ? error.message : 'Failed to process the request' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent('List available models')
    const response = result.response
    const text = response.text()

    return Response.json({ text })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: error instanceof Error ? error.message : 'Failed to list models' }, { status: 500 })
  }
}
