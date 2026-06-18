#!/usr/bin/env node
/**
 * Set one GitHub Actions secret via API (no gh CLI required).
 * Usage:
 *   set GITHUB_TOKEN=ghp_xxx
 *   node scripts/set-github-secret.mjs DEEPSEEK_API_KEY "sk-..."
 */
import sodium from 'libsodium-wrappers'

const REPO = 'terrywbr/timeloop-ai'
const [name, value] = process.argv.slice(2)

if (!name || !value) {
  console.error('Usage: node scripts/set-github-secret.mjs <SECRET_NAME> <SECRET_VALUE>')
  process.exit(1)
}

const token = process.env.GITHUB_TOKEN?.trim() || process.env.GH_TOKEN?.trim()
if (!token) {
  console.error('Missing GITHUB_TOKEN or GH_TOKEN environment variable.')
  process.exit(1)
}

async function github(path, init = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${path} -> ${res.status} ${body}`)
  }
  if (res.status === 204) return null
  return res.json()
}

async function main() {
  await sodium.ready
  const [owner, repo] = REPO.split('/')
  const key = await github(`/repos/${owner}/${repo}/actions/secrets/public-key`)
  const binkey = sodium.from_base64(key.key, sodium.base64_variants.ORIGINAL)
  const binsec = sodium.from_string(value)
  const encBytes = sodium.crypto_box_seal(binsec, binkey)
  const encrypted = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL)

  await github(`/repos/${owner}/${repo}/actions/secrets/${name}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      encrypted_value: encrypted,
      key_id: key.key_id,
    }),
  })

  console.log(`Set GitHub secret: ${name}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
