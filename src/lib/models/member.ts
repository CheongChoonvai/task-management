import type { Database } from '@/lib/supabase'

type MemberRow = Database['public']['Tables']['members']['Row']
type MemberInsert = Database['public']['Tables']['members']['Insert']
type MemberUpdate = Database['public']['Tables']['members']['Update']

export class Member implements MemberRow {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'admin' | 'user' | 'manager'
  is_active: boolean
  created_at: string
  updated_at: string

  constructor(data: MemberRow) {
    this.id = data.id
    this.email = data.email
    this.full_name = data.full_name
    this.avatar_url = data.avatar_url
    this.role = data.role
    this.is_active = data.is_active
    this.created_at = data.created_at
    this.updated_at = data.updated_at
  }

  static fromRow(row: MemberRow) {
    return new Member(row)
  }

  toInsert(): MemberInsert {
    return {
      id: this.id,
      email: this.email,
      full_name: this.full_name,
      avatar_url: this.avatar_url,
      role: this.role,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at,
    }
  }

  toUpdate(): MemberUpdate {
    return this.toInsert()
  }

  validate(): boolean {
    return typeof this.email === 'string' && this.email.length > 0
  }
}
