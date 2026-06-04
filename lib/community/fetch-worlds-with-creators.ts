import type { SupabaseClient } from '@supabase/supabase-js'
import type { WorldRowWithCreator } from '@/lib/community/serialize-world'
import type { GeneratedWorldRow } from '@/lib/supabase-types'

export async function attachCreatorsToWorldRows(
  supabase: SupabaseClient,
  rows: GeneratedWorldRow[],
): Promise<WorldRowWithCreator[]> {
  if (rows.length === 0) return []

  const userIds = [...new Set(rows.map((r) => r.user_id))]
  const { data: users, error } = await supabase
    .from('users')
    .select('id, display_name, avatar_url')
    .in('id', userIds)

  if (error) throw error

  const userMap = Object.fromEntries(
    (users ?? []).map((u) => [
      u.id,
      { display_name: u.display_name as string | null, avatar_url: u.avatar_url as string | null },
    ]),
  )

  return rows.map((row) => ({
    ...row,
    users: userMap[row.user_id] ?? null,
  }))
}
