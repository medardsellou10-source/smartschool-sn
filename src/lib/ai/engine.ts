// Moteur AI principal — Google Gemini
import { GoogleGenerativeAI, SchemaType, type Content, type Part, type FunctionDeclarationsTool } from '@google/generative-ai'
import { getSystemPrompt } from './system-prompts'
import { getToolsForRole } from './tools'
import { executeTool } from './tools-registry'
import { checkRateLimit } from './rate-limiter'

// Modèles Gemini par ordre de préférence
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite']
const MAX_TOKENS = 2048

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
  userRole: string
  userId: string
  conversationId?: string
}

interface ChatResponse {
  content: string
  tokensIn: number
  tokensOut: number
  toolsUsed: string[]
}

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY non configurée. Ajoutez-la dans .env.local')
  }
  return new GoogleGenerativeAI(apiKey)
}

// Convertir nos outils au format Gemini function calling
function getGeminiTools(role: string): FunctionDeclarationsTool[] | undefined {
  const tools = getToolsForRole(role)
  if (tools.length === 0) return undefined

  return [{
    functionDeclarations: tools.map(t => ({
      name: t.name,
      description: t.description,
      parameters: {
        type: SchemaType.OBJECT,
        properties: Object.fromEntries(
          Object.entries(t.input_schema.properties || {}).map(([key, val]) => {
            const v = val as Record<string, unknown>
            return [key, {
              type: v.type === 'number' ? SchemaType.NUMBER : SchemaType.STRING,
              description: (v.description as string) || key,
            }]
          })
        ),
        required: t.input_schema.required || [],
      },
    })) as FunctionDeclarationsTool['functionDeclarations'],
  }]
}

// Convertir les messages au format Gemini
function toGeminiHistory(messages: ChatMessage[]): Content[] {
  return messages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }] as Part[],
  }))
}

export async function chat(request: ChatRequest): Promise<ChatResponse> {
  // Rate limiting
  const rateCheck = checkRateLimit(request.userId, request.userRole)
  if (!rateCheck.allowed) {
    const minutes = Math.ceil(rateCheck.resetIn / 60000)
    return {
      content: `⏳ Limite de messages atteinte. Réessayez dans ${minutes} minute${minutes > 1 ? 's' : ''}.`,
      tokensIn: 0,
      tokensOut: 0,
      toolsUsed: [],
    }
  }

  const genAI = getClient()
  const systemPrompt = getSystemPrompt(request.userRole)
  const geminiTools = getGeminiTools(request.userRole)
  const toolsUsed: string[] = []

  // Préparer l'historique et le dernier message
  const history = toGeminiHistory(request.messages)
  const lastMessage = request.messages[request.messages.length - 1]?.content || ''

  let totalTokensIn = 0
  let totalTokensOut = 0
   
  let chatSession: any
  let response: any

  // Essayer chaque modèle jusqu'à ce qu'un fonctionne
  let lastError: Error | null = null
  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
        tools: geminiTools,
      })
      chatSession = model.startChat({ history })
      const result = await chatSession.sendMessage(lastMessage)
      response = result.response
      lastError = null
      console.log(`[AI] Modèle ${modelName} OK`)
      break
    } catch (err) {
      lastError = err as Error
      console.warn(`[AI] Modèle ${modelName} échoué, essai suivant...`)
      continue
    }
  }

  if (!response || lastError) {
    throw lastError || new Error('Tous les modèles Gemini ont échoué')
  }

  totalTokensIn += response.usageMetadata?.promptTokenCount || 0
  totalTokensOut += response.usageMetadata?.candidatesTokenCount || 0

  // Boucle de function calling (max 5 itérations)
  let iterations = 0
  while (iterations < 5) {
    const functionCalls = response.functionCalls()
    if (!functionCalls || functionCalls.length === 0) break

    iterations++

    // Exécuter chaque function call
    const functionResponses = await Promise.all(
      functionCalls.map(async (fc: { name: string; args?: Record<string, unknown> }) => {
        toolsUsed.push(fc.name)
        const toolResult = await executeTool(
          fc.name,
          (fc.args || {}) as Record<string, unknown>,
          request.userRole
        )
        return {
          functionResponse: {
            name: fc.name,
            response: JSON.parse(toolResult),
          },
        }
      })
    )

    // Renvoyer les résultats à Gemini
    const fcResult = await chatSession.sendMessage(functionResponses as Part[])
    response = fcResult.response

    totalTokensIn += response.usageMetadata?.promptTokenCount || 0
    totalTokensOut += response.usageMetadata?.candidatesTokenCount || 0
  }

  const finalContent = response.text() || "Désolé, je n'ai pas pu générer de réponse."

  return {
    content: finalContent,
    tokensIn: totalTokensIn,
    tokensOut: totalTokensOut,
    toolsUsed,
  }
}

// Version streaming pour le chat web
export async function chatStream(
  request: ChatRequest,
  onChunk: (text: string) => void,
  onDone: (response: ChatResponse) => void
) {
  const rateCheck = checkRateLimit(request.userId, request.userRole)
  if (!rateCheck.allowed) {
    const minutes = Math.ceil(rateCheck.resetIn / 60000)
    const msg = `⏳ Limite atteinte. Réessayez dans ${minutes} min.`
    onChunk(msg)
    onDone({ content: msg, tokensIn: 0, tokensOut: 0, toolsUsed: [] })
    return
  }

  const genAI = getClient()
  const systemPrompt = getSystemPrompt(request.userRole)
  const geminiTools = getGeminiTools(request.userRole)

  const history = toGeminiHistory(request.messages)
  const lastMessage = request.messages[request.messages.length - 1]?.content || ''

  // Essayer chaque modèle
  let chatSession
  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
        tools: geminiTools,
      })
      chatSession = model.startChat({ history })
      break
    } catch {
      continue
    }
  }
  if (!chatSession) throw new Error('Aucun modèle Gemini disponible')

  let fullContent = ''

  const result = await chatSession.sendMessageStream(lastMessage)

  for await (const chunk of result.stream) {
    const text = chunk.text()
    if (text) {
      onChunk(text)
      fullContent += text
    }
  }

  const response = await result.response
  const tokensIn = response.usageMetadata?.promptTokenCount || 0
  const tokensOut = response.usageMetadata?.candidatesTokenCount || 0

  onDone({
    content: fullContent,
    tokensIn,
    tokensOut,
    toolsUsed: [],
  })
}
