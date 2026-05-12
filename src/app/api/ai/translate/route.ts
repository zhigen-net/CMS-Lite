import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getCurrentUser, requireAdmin } from '@/lib/auth'
import { generateText } from '@/lib/ai'

const langNames: Record<string, string> = {
  en: '英文', ja: '日文', ko: '韩文', fr: '法文', de: '德文', es: '西班牙文',
}

export async function POST(request: Request) {
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const authError = requireAdmin(user)
  if (authError) return authError

  const { title, content, targetLang } = await request.json() as { title: string; content: string; targetLang: string }
  if (!content?.trim()) return Response.json({ error: '内容不能为空' }, { status: 400 })
  if (!langNames[targetLang]) return Response.json({ error: '不支持的目标语言' }, { status: 400 })

  const langName = langNames[targetLang]
  const prompt = `请将以下文章（标题和正文）翻译成${langName}，保持 Markdown 格式，直接输出翻译结果，不要添加任何解释。

严格按以下格式输出：
===TITLE===
（翻译后的标题）
===CONTENT===
（翻译后的正文 Markdown）
===END===

原文标题：${title}

原文正文：
${content}`

  const raw = await generateText(env, prompt, `你是专业的${langName}翻译，擅长将中文内容准确翻译成${langName}，保持原文语义和格式。`, 4096)

  const extract = (tag: string, next: string) => {
    const re = new RegExp(`===\\s*${tag}\\s*===([\\s\\S]*?)===\\s*${next}\\s*===`, 'i')
    return raw.match(re)?.[1]?.trim() ?? ''
  }

  return Response.json({
    title: extract('TITLE', 'CONTENT') || title,
    content: extract('CONTENT', 'END') || raw,
  })
}
