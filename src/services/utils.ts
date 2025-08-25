// Utility functions for the app (moved from src/functions/utils.ts)

/**
 * Get display name for a user/member
 * Priority: full_name > email username > email > 'User'
 */
export function getDisplayName(member?: { full_name?: string | null; email?: string } | null, fallbackEmail?: string): string {
  if (member?.full_name) {
    return member.full_name
  }
  
  const email = member?.email || fallbackEmail
  if (email) {
    // Extract username from email (part before @)
    const username = email.split('@')[0]
    // Make it more readable (capitalize first letter, replace dots/underscores with spaces)
    return username
      .replace(/[._-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
  
  return 'User'
}

/**
 * Format date for display
 */
export function formatDate(dateString: string | null, options?: Intl.DateTimeFormatOptions): string {
  if (!dateString) return ''
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(options || {})
  }
  
  return new Date(dateString).toLocaleDateString(undefined, defaultOptions)
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
  
  return `${Math.floor(diffInDays / 365)} years ago`
}

/**
 * Get status styling classes
 */
export function getStatusStyles(status: string): string {
  switch (status.toLowerCase()) {
  case 'completed': return 'bg-primary-100 text-primary-800'
  case 'in_progress': return 'bg-primary-100 text-primary-800'
  case 'todo': return 'bg-gray-100 text-gray-800'
  case 'planning': return 'bg-primary-100 text-primary-800'
  case 'active': return 'bg-primary-100 text-primary-800'
  case 'on-hold': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Get priority styling classes
 */
export function getPriorityStyles(priority: string): string {
  switch (priority.toLowerCase()) {
  case 'high': return 'bg-red-100 text-red-800'
  case 'medium': return 'bg-yellow-100 text-yellow-800'
  case 'low': return 'bg-primary-100 text-primary-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Calculate completion percentage
 */
export function calculateCompletionRate(completed: number, total: number): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

/**
 * Calculate project progress based on tasks
 */
export function calculateProjectProgress(tasks: Array<{ 
  progress: number; 
  project_contribution: number; 
  status: string 
}>): number {
  if (!tasks || tasks.length === 0) return 0
  
  // Filter out tasks with contribution set
  const contributingTasks = tasks.filter(task => task.project_contribution > 0)
  
  if (contributingTasks.length === 0) {
    // If no tasks have contribution set, use simple completion rate
    const completedTasks = tasks.filter(task => task.status === 'completed').length
    return calculateCompletionRate(completedTasks, tasks.length)
  }
  
  // Calculate project progress based on each task's contribution
  // Each task contributes a percentage directly to the project
  const totalProgress = contributingTasks.reduce((sum, task) => {
    const taskProgress = task.status === 'completed' ? 100 : task.progress
    // Multiply task progress by its contribution percentage
    return sum + (taskProgress * task.project_contribution / 100)
  }, 0)
  
  return Math.round(Math.min(totalProgress, 100))
}
