import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getCurrentUser, requireAdmin } from '@/lib/auth'
import { generateText } from '@/lib/ai'

const instructions = {
  polish: '请对以下文章进行润色改写，保持原意和结构不变，提升语言表达质量、流畅度和可读性，直接返回改写后的完整 Markdown 内容，不要添加任何解释：',
  expand: '请对以下文章进行扩写，在保持原有结构的基础上，补充细节、例子和论述，使内容更加丰富翔实，字数扩充到原来的 1.5-2 倍，直接返回扩写后的完整 Markdown 内容，不要添加任何解释：',
  condense: '请对以下文章进行精简压缩，保留核心观点和关键信息，去除冗余表达，使内容简洁有力，字数压缩到原来的 60% 左右，直接返回精简后的完整 Markdown 内容，不要添加任何解释：',
}

export async function POST(request: Request) {
  const { env } = getCloudflareContext()
  const user = await getCurrentUser(request, env)
  const authError = requireAdmin(user)
  if (authError) return authError

  const { content, instruction } = await request.json() as { content: string; instruction: keyof typeof instructions }
  if (!content?.trim()) return Response.json({ error: '内容不能为空' }, { status: 400 })
  if (!instructions[instruction]) return Response.json({ error: '无效的改写指令' }, { status: 400 })

  const prompt = `${instructions[instruction]}\n\n${content}`
  const result = await generateText(env, prompt, '你是一位专业的中文内容编辑，擅长文章润色和改写。', 4096)

  return Response.json({ content: result })
}
