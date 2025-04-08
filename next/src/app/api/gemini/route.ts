import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai'

if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  throw new Error('Missing Gemini API key')
}

// Initialize client once, outside the handler
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY)

// Define valid models outside
const VALID_MODELS = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash']

export async function POST(req: Request) {
  try {
    const { prompt, model: requestedModel } = await req.json()
    console.log('Received request:', { prompt, model: requestedModel })

    if (!prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Validate model name
    if (!VALID_MODELS.includes(requestedModel)) {
      return Response.json({ error: `Invalid model: ${requestedModel}` }, { status: 400 })
    }

    // Ensure prompt is a string and properly formatted
    const promptText = typeof prompt === 'string' ? prompt : JSON.stringify(prompt)
    console.log('Prompt text:', promptText)

    // Format the prompt for Gemini API
    const formattedPrompt = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: promptText
            }
          ]
        }
      ]
    }

    // Configuration object
    const generationConfig: GenerationConfig = {
      temperature: 0.7,
      maxOutputTokens: 2048, // Reduced from 8192 to be more conservative
      topP: 0.8,
      topK: 40
    }

    // Get model instance
    const modelInstance = genAI.getGenerativeModel({
      model: requestedModel,
      generationConfig
    })

    // Generate content with retry logic
    let retries = 3
    let lastError = null

    while (retries > 0) {
      try {
        const result = await modelInstance.generateContent(formattedPrompt)

        const response = result.response
        const text = response.text()

        if (!text) {
          throw new Error('No text generated from response')
        }

        return Response.json({ text })
      } catch (error) {
        lastError = error
        retries--
        if (retries > 0) {
          // Wait before retrying (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, 3 - retries) * 1000))
        }
      }
    }

    throw lastError || new Error('Failed to generate content after retries')
  } catch (error) {
    console.error('Error generating content:', error)
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Failed to process the request',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
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
