export interface AgentResult {
  success: boolean
  summary: string
  data: unknown
}

export interface AgentRunOptions {
  db: D1Database
  env: CloudflareEnv
  taskId: string
}
