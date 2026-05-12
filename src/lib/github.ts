// GitHub API 封装（用于主题/插件动态安装）

interface GitHubFile {
  path: string
  content: string  // base64 编码
  sha?: string
}

export async function getGitHubFile(
  token: string,
  repo: string,
  path: string
): Promise<{ content: string; sha: string } | null> {
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'AI-CMS/1.0',
    },
  })
  if (!res.ok) return null
  const data = await res.json() as { content: string; sha: string }
  return { content: atob(data.content.replace(/\n/g, '')), sha: data.sha }
}

export async function commitFile(
  token: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<boolean> {
  const body: Record<string, string> = {
    message,
    content: btoa(unescape(encodeURIComponent(content))),
  }
  if (sha) body.sha = sha

  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'AI-CMS/1.0',
    },
    body: JSON.stringify(body),
  })
  return res.ok
}

export async function commitFiles(
  token: string,
  repo: string,
  files: GitHubFile[],
  message: string
): Promise<boolean> {
  // 获取当前分支的最新 commit sha
  const refRes = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/main`, {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'AI-CMS/1.0' },
  })
  if (!refRes.ok) return false
  const ref = await refRes.json() as { object: { sha: string } }
  const latestCommitSha = ref.object.sha

  // 获取 tree sha
  const commitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits/${latestCommitSha}`, {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'AI-CMS/1.0' },
  })
  const commit = await commitRes.json() as { tree: { sha: string } }

  // 创建新 tree
  const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'AI-CMS/1.0',
    },
    body: JSON.stringify({
      base_tree: commit.tree.sha,
      tree: files.map(f => ({
        path: f.path,
        mode: '100644',
        type: 'blob',
        content: f.content,
      })),
    }),
  })
  const tree = await treeRes.json() as { sha: string }

  // 创建新 commit
  const newCommitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'AI-CMS/1.0',
    },
    body: JSON.stringify({
      message,
      tree: tree.sha,
      parents: [latestCommitSha],
    }),
  })
  const newCommit = await newCommitRes.json() as { sha: string }

  // 更新 ref
  const updateRes = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/main`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'AI-CMS/1.0',
    },
    body: JSON.stringify({ sha: newCommit.sha }),
  })
  return updateRes.ok
}
