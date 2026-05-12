#!/usr/bin/env node
// 数据库迁移脚本：npm run migrate

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const migrationsDir = path.join(__dirname, '../migrations')
const isLocal = process.argv.includes('--local')
const flag = isLocal ? '--local' : '--remote'

const files = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort()

console.log(`Running ${files.length} migration(s) [${isLocal ? 'local' : 'remote'}]...`)

for (const file of files) {
  const filePath = path.join(migrationsDir, file)
  console.log(`  → ${file}`)
  try {
    execSync(`wrangler d1 execute cms-db ${flag} --file="${filePath}"`, { stdio: 'inherit' })
  } catch (e) {
    console.error(`Failed: ${file}`)
    process.exit(1)
  }
}

console.log('✓ Migrations complete')
