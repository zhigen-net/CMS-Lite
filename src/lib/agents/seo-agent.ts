import { generateSEOMeta, DEFAULT_MODELS } from '@/lib/ai'
import { getContents, updateContent } from '@/lib/db'
import { getSiteSettings } from '@/lib/config'
import type { AgentResult, AgentRunOptions } from './base'

export async function runSEOAgent({ db, env, taskId }: AgentRunOptions): Promise<AgentResult> {
  void taskId

  const settings = await getSiteSettings(db)
  const batchSize  = Number(settings['ai.seo.batchSize']) || 8
  const priorityAI = Boolean(settings['ai.seo.priorityAI'])
  const seoModel   = (settings['ai.seo.model'] as string) || DEFAULT_MODELS.seo

  // 拉取缺少 SEO meta 的文章（直接过滤，避免只看前50篇）
  const { items: posts } = await getContents(db, {
    type: 'post',
    status: 'published',
    pageSize: batchSize * 4, // 多拉一些，过滤后取 batchSize 篇
  })

  const missing = posts
    .filter(p => (!p.meta_title || !p.meta_description) && (!priorityAI || p.ai_generated))
    .slice(0, batchSize)

  if (missing.length === 0) {
    return { success: true, summary: '所有文章 SEO meta 已完整', data: { optimized: 0 } }
  }

  let optimized = 0
  const results: { id: string; title: string }[] = []
  const errors: { id: string; title: string; error: string }[] = []

  for (const post of missing) {
    try {
      const seo = await generateSEOMeta(env, {
        title: post.title,
        content: post.content ?? '',
      }, seoModel)
      await updateContent(db, post.id, {
        meta_title: seo.metaTitle || post.title,
        meta_description: seo.metaDescription,
      })
      optimized++
      results.push({ id: post.id, title: post.title })
    } catch (err) {
      errors.push({ id: post.id, title: post.title, error: err instanceof Error ? err.message : String(err) })
    }
  }

  return {
    success: true,
    summary: `优化了 ${optimized} 篇文章的 SEO${errors.length ? `，${errors.length} 篇失败` : ''}`,
    data: { optimized, errors, articles: results, config: { batchSize, priorityAI, seoModel } },
  }
}
