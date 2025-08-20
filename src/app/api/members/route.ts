import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// support either SUPABASE_SERVICE_ROLE_KEY (common) or SERVICE_ROLE_SECRET (older/alternate .env)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_SECRET || null

const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
  : null

export async function GET(req: Request) {
  if (!supabaseServiceKey || !supabaseAdmin) {
    return NextResponse.json({ error: 'Server misconfiguration: service role key not set (SUPABASE_SERVICE_ROLE_KEY or SERVICE_ROLE_SECRET)' }, { status: 500 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('members')
      .select('id, full_name, email')
      .eq('is_active', true)
      .order('full_name')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
