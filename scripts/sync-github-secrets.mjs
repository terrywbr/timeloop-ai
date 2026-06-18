#!/usr/bin/env node
/**
 * Sync deployment secrets from .env.local to GitHub Actions (terrywbr/timeloop-ai).
 * Requires: gh auth login
 *
 * Usage: node scripts/sync-github-secrets.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const REPO = 'terrywbr/timeloop-ai'
const ENV_FILE = '.env.local'

const SECRET_KEYS = [
  'LEMON_SQUEEZY_API_KEY',
  'LEMON_SQUEEZY_STORE_ID',
  'LEMON_SQUEEZY_VIP_VARIANT_ID',
  'LEMON_SQUEEZY_STREAMER_VARIANT_ID',
  'LEMON_SQUEEZY_CREDIT_PACK_VARIANT_ID',
  'LEMON_SQUEEZY_CREDIT_PACK_CREDITS',
  'LEMON_SQUEEZY_WEBHOOK_SECRET',
  'DEEPSEEK_API_KEY',
  'TOGETHER_API_KEY',
  'REPLICATE_API_TOKEN',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ADMIN_API_SECRET',
  'OPENAI_API_KEY',
]

function parseEnvFile(path) {
  const env = {}
  const raw = readFileSync(path, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    const key = t.slice(0, i).trim()
    const value = t.slice(i + 1).trim().replace(/^"|"$/g, '')
    if (value) env[key] = value
  }
  return env
}

function gh(args, input) {
  const result = spawnSync('gh', args, {
    input,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  return result
}

function main() {
  if (!existsSync(ENV_FILE)) {
    console.error(`Missing ${ENV_FILE}`)
    process.exit(1)
  }

  const whoami = spawnSync('gh', ['auth', 'status'], { encoding: 'utf8' })
  if (whoami.status !== 0) {
    console.error('gh is not authenticated. Run: gh auth login')
    process.exit(1)
  }

  const env = parseEnvFile(ENV_FILE)
  if (!env.LEMON_SQUEEZY_CREDIT_PACK_CREDITS) {
    env.LEMON_SQUEEZY_CREDIT_PACK_CREDITS = '100'
  }

  const updated = []
  const skipped = []

  for (const key of SECRET_KEYS) {
    const value = env[key]
    if (!value) {
      skipped.push(key)
      continue
    }
    const result = gh(['secret', 'set', key, '--repo', REPO], value)
    if (result.status !== 0) {
      console.error(`Failed to set ${key}:`, result.stderr?.trim() || result.stdout?.trim())
      process.exit(1)
    }
    updated.push(key)
  }

  console.log('Updated GitHub secrets:', updated.join(', '))
  if (skipped.length) {
    console.log('Skipped (empty in .env.local):', skipped.join(', '))
  }
}

main()
