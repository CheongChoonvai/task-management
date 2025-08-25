import { supabase } from '@/lib/supabase'
import { calculateProjectProgress } from '@/services/utils'

type TaskRow = {
  progress: number
  project_contribution: number
  status: string
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

    // Ensure we pass a typed array to the progress calculator
    const taskRows: TaskRow[] = (tasks ?? []) as TaskRow[]
    const newProgress = calculateProjectProgress(taskRows)

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
