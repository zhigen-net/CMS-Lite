import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getCurrentUser, requireAdmin } from '@/lib/auth'
import { generateText } from '@/lib/ai'
import { getSiteSettings } from '@/lib/config'


export async function POST(request: Request) {
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const authError = requireAdmin(user)
  if (authError) return authError

  const { messages, context } = await request.json() as {
    messages: { role: string; content: string }[]
    context?: string
  }

  const settings = await getSiteSettings(env.DB)
  const siteName = settings['site.name'] as string
  const style = settings['ai.writingStyle'] as string

  const systemPrompt = `你是 ${siteName} 网站的 AI 助手，负责帮助管理员管理网站内容、主题和运营。
写作风格：${style || '专业友好'}。
你可以帮助：写文章、优化SEO、修改主题、分析数据、制定内容计划。
${context ? `当前上下文：${context}` : ''}`

  const lastMessage = messages[messages.length - 1]?.content ?? ''
  const response = await generateText(env, lastMessage, systemPrompt, 2048)

  return Response.json({ response })
}
