import { getBearerToken, createSupabaseUserClient } from '@/lib/supabase-server'

export async function resolveOptionalViewerId(req: Request): Promise<string | null> {
  const token = getBearerToken(req)
  if (!token) return null
  try {
    const supabase = createSupabaseUserClient(token)
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) return null
    return data.user.id
  } catch {
    return null
  }
}
