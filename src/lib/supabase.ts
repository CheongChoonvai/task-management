import { createClient } from '@supabase/supabase-js'
import { calculateProjectProgress } from './utils'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      members: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'user' | 'manager'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'user' | 'manager'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'user' | 'manager'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
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
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: string
          priority?: string
          progress?: number
          deadline?: string | null
          todostatus?: string | null
          lead_id?: string | null
          budget?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: string
          priority?: string
          progress?: number
          deadline?: string | null
          todostatus?: string | null
          lead_id?: string | null
          budget?: number
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
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
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          project_id?: string | null
          status?: string
          priority?: string
          progress?: number
          project_contribution?: number
          created_by?: string | null
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          project_id?: string | null
          status?: string
          priority?: string
          progress?: number
          project_contribution?: number
          created_by?: string | null
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

/**
 * Update project progress based on its tasks
 */
export async function updateProjectProgress(projectId: string) {
  try {
    // Fetch all tasks for the project
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('progress, project_contribution, status')
      .eq('project_id', projectId)

    if (tasksError) throw tasksError

    // Calculate new progress
    const newProgress = calculateProjectProgress(tasks || [])

    // Update project progress
    const { error: updateError } = await supabase
      .from('projects')
      .update({ progress: newProgress })
      .eq('id', projectId)

    if (updateError) throw updateError

    return { success: true, progress: newProgress }
  } catch (error) {
    console.error('Error updating project progress:', error)
    return { success: false, error }
  }
}
