# AI CMS

> AI 时代的内容管理系统，基于 Cloudflare 全家桶，完全免费部署。

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/zhigen-net/CMS-Lite)

## 特性

- **AI 原生**：AI 对话建站、AI 写文章、AI 做 SEO、AI 自动运营
- **极致性能**：Next.js 15 边缘渲染，全球 CDN 加速
- **完全免费**：Cloudflare Pages + D1 + R2 + Workers AI 全免费
- **主题系统**：可视化定制 + AI 生成主题 + 代码编辑器
- **插件系统**：内置 9 个插件，支持社区插件一键安装
- **多内容类型**：文章/页面/产品/作品集 + 自定义类型
- **多实例**：一个账号可部署多个独立站点

## 一键部署

点击上方按钮，填入 GitHub Token 和 Cloudflare API Token，自动完成：
- 创建 GitHub 仓库
- 创建 Cloudflare D1 / R2 / Pages
- 初始化数据库
- 部署上线（约 2 分钟）

## 本地开发

```bash
# 安装依赖
npm install

# 复制环境变量
cp .env.example .env.local

# 初始化本地数据库
npm run migrate -- --local

# 启动开发服务器
npm run dev
```

## 技术栈

| 服务 | 用途 |
|------|------|
| Cloudflare Pages | 托管 + 边缘渲染 |
| Cloudflare D1 | SQLite 数据库 |
| Cloudflare R2 | 媒体文件存储 |
| Workers AI | AI 内容生成 |
| GitHub | 代码托管 + 自动部署 |

## 更新

```bash
git pull upstream main
npm run migrate
# Cloudflare Pages 自动重新部署
```

## 开源协议

MIT
