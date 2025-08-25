import type { Database } from '@/lib/supabase'

type ProjectRow = Database['public']['Tables']['projects']['Row']
type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export class Project implements ProjectRow {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  progress: number
  deadline: string | null
  todostatus: string | null
  lead_id: string | null
  budget: number
  created_at: string
  updated_at: string

  constructor(data: ProjectRow) {
    this.id = data.id
    this.title = data.title
    this.description = data.description
    this.status = data.status
    this.priority = data.priority
    this.progress = data.progress
    this.deadline = data.deadline
    this.todostatus = data.todostatus
    this.lead_id = data.lead_id
    this.budget = data.budget
    this.created_at = data.created_at
    this.updated_at = data.updated_at
  }

  static fromRow(row: ProjectRow) {
    return new Project(row)
  }

  toInsert(): ProjectInsert {
    return { ...this }
  }

  toUpdate(): ProjectUpdate {
    return { ...this }
  }
}
