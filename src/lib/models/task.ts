import type { Database } from '@/lib/supabase'

type TaskRow = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

export class Task implements TaskRow {
  id: string
  title: string
  description: string | null
  project_id: string | null
  status: string
  priority: string
  progress: number
  project_contribution: number
  created_by: string | null
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string

  constructor(data: TaskRow) {
    this.id = data.id
    this.title = data.title
    this.description = data.description
    this.project_id = data.project_id
    this.status = data.status
    this.priority = data.priority
    this.progress = data.progress
    this.project_contribution = data.project_contribution
    this.created_by = data.created_by
    this.due_date = data.due_date
    this.completed_at = data.completed_at
    this.created_at = data.created_at
    this.updated_at = data.updated_at
  }

  static fromRow(row: TaskRow) {
    return new Task(row)
  }

  toInsert(): TaskInsert {
    return { ...this }
  }

  toUpdate(): TaskUpdate {
    return { ...this }
  }
}
