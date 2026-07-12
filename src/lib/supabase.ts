// Env-gated Supabase — no keys → client is null → app runs pure-local (v0.1
// default). Reuses the same "Life OS 🧬" project so a Strong workout lands in
// the SAME event ledger LifeOS derives XP from. Set VITE_SUPABASE_URL +
// VITE_SUPABASE_ANON_KEY to enable; VITE_SUPABASE_DISABLE=1 forces off for dev.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const disabled = import.meta.env.VITE_SUPABASE_DISABLE === '1'

export const supabase: SupabaseClient | null =
  !disabled && url && anon ? createClient(url, anon, { auth: { persistSession: false } }) : null

export const cloudOn = supabase !== null
