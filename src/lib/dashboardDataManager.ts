import { supabase } from './supabase'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // time to live in milliseconds
}

interface Member {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Task {
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
  project?: {
    title: string
    status: string
  }
  canComplete?: boolean
  completionReason?: string
  assignedMembers?: string[]
}

interface Project {
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
  tasks_count?: number
  completed_tasks?: number
}

interface DashboardData {
  currentMember: Member | null
  tasks: Task[]
  projects: Project[]
  taskAssignments: Record<string, string[]>
  projectMembers: Record<string, string[]>
}

class DashboardDataManager {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly CACHE_TTL = {
    member: 5 * 60 * 1000,      // 5 minutes
    tasks: 2 * 60 * 1000,       // 2 minutes
    projects: 3 * 60 * 1000,    // 3 minutes
    assignments: 2 * 60 * 1000, // 2 minutes
  }

  private getCacheKey(type: string, params?: Record<string, any>): string {
    if (!params) return type
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|')
    return `${type}:${paramString}`
  }

  private setCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
    
    // Also store in localStorage for persistence
    try {
      localStorage.setItem(`dashboard_cache_${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
        ttl
      }))
    } catch (error) {
      console.warn('Failed to store in localStorage:', error)
    }
  }

  private getCache<T>(key: string): T | null {
    // Check memory cache first
    let entry = this.cache.get(key)
    
    // If not in memory, try localStorage
    if (!entry) {
      try {
        const stored = localStorage.getItem(`dashboard_cache_${key}`)
        if (stored) {
          entry = JSON.parse(stored)
          // Restore to memory cache
          if (entry) this.cache.set(key, entry)
        }
      } catch (error) {
        console.warn('Failed to read from localStorage:', error)
      }
    }

    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      // Cache expired
      this.cache.delete(key)
      try {
        localStorage.removeItem(`dashboard_cache_${key}`)
      } catch (error) {
        console.warn('Failed to remove from localStorage:', error)
      }
      return null
    }

    return entry.data
  }

  private invalidateCache(pattern: string): void {
    // Clear memory cache
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }

    // Clear localStorage cache
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (key && key.startsWith('dashboard_cache_') && key.includes(pattern)) {
          localStorage.removeItem(key)
        }
      }
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error)
    }
  }

  async getCurrentMember(userEmail: string): Promise<Member> {
    const cacheKey = this.getCacheKey('member', { email: userEmail })
    const cached = this.getCache<Member>(cacheKey)
    if (cached) return cached

    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('email', userEmail)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Create new member
          const { data: newMember, error: createError } = await supabase
            .from('members')
            .insert([{
              email: userEmail,
              full_name: null,
              role: 'user',
              is_active: true
            }])
            .select()
            .single()

          if (createError) throw createError
          this.setCache(cacheKey, newMember, this.CACHE_TTL.member)
          return newMember
        }
        throw error
      }

      this.setCache(cacheKey, data, this.CACHE_TTL.member)
      return data
    } catch (error) {
      console.error('Error fetching current member:', error)
      throw new Error('Failed to load user profile')
    }
  }

  async getDashboardData(memberId: string): Promise<DashboardData> {
    const cacheKey = this.getCacheKey('dashboard', { memberId })
    const cached = this.getCache<DashboardData>(cacheKey)
    if (cached) return cached

    try {
      // Fetch all data in parallel for better performance
      const [
        currentMemberResult,
        projectsResult,
        tasksResult,
        projectMembersResult,
        taskAssignmentsResult
      ] = await Promise.all([
        supabase.from('members').select('*').eq('id', memberId).single(),
        this.getUserProjects(memberId),
        this.getUserTasks(memberId),
        this.getProjectMembers(),
        this.getTaskAssignments()
      ])

      if (currentMemberResult.error) throw currentMemberResult.error

      const currentMember = currentMemberResult.data
      const projects = projectsResult
      const { tasks, taskAssignments } = tasksResult
      const projectMembers = projectMembersResult

      // Filter tasks based on project membership
      const filteredTasks = tasks.filter((task: any) => {
        if (!task.project_id) return true
        return projectMembers[task.project_id]?.includes(memberId)
      })

      // Enhance tasks with completion logic
      const enhancedTasks = filteredTasks.map((task: any) => {
        const assignments = taskAssignments[task.id] || []
        const isAssigned = assignments.includes(memberId)
        const isCreator = task.created_by === memberId
        const hasNoAssignments = assignments.length === 0

        let canComplete = false
        let completionReason = ''

        if (task.status === 'completed') {
          canComplete = false
          completionReason = 'Task already completed'
        } else if (isAssigned) {
          canComplete = true
          completionReason = 'You are assigned to this task'
        } else if (hasNoAssignments && isCreator) {
          canComplete = true
          completionReason = 'You created this unassigned task'
        } else if (hasNoAssignments) {
          canComplete = false
          completionReason = 'Task has no assignments'
        } else {
          canComplete = false
          completionReason = 'Only assigned members can complete this task'
        }

        return {
          ...task,
          canComplete,
          completionReason,
          assignedMembers: assignments
        }
      })

      const dashboardData: DashboardData = {
        currentMember,
        tasks: enhancedTasks,
        projects,
        taskAssignments,
        projectMembers
      }

      this.setCache(cacheKey, dashboardData, Math.min(...Object.values(this.CACHE_TTL)))
      return dashboardData
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      throw new Error('Failed to load dashboard data')
    }
  }

  private async getUserProjects(memberId: string): Promise<Project[]> {
    const cacheKey = this.getCacheKey('projects', { memberId })
    const cached = this.getCache<Project[]>(cacheKey)
    if (cached) return cached

    try {
      // Get all projects where user is lead or member
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .or(`lead_id.eq.${memberId},id.in.(${await this.getUserProjectIds(memberId)})`)
        .order('created_at', { ascending: false })

      if (projectsError) throw projectsError

      // Get task counts for each project in parallel
      const projectsWithCounts = await Promise.all(
        (projectsData || []).map(async (project: any) => {
          const { data: tasksData } = await supabase
            .from('tasks')
            .select('id, status')
            .eq('project_id', project.id)

          const tasks_count = tasksData?.length || 0
          const completed_tasks = tasksData?.filter((task: any) => task.status === 'completed').length || 0

          return {
            ...project,
            tasks_count,
            completed_tasks
          }
        })
      )

      this.setCache(cacheKey, projectsWithCounts, this.CACHE_TTL.projects)
      return projectsWithCounts
    } catch (error) {
      console.error('Error fetching projects:', error)
      return []
    }
  }

  private async getUserProjectIds(memberId: string): Promise<string> {
    const { data } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('member_id', memberId)

    return (data || []).map(pm => pm.project_id).join(',') || 'none'
  }

  private async getUserTasks(memberId: string): Promise<{ tasks: Task[], taskAssignments: Record<string, string[]> }> {
    const cacheKey = this.getCacheKey('tasks', { memberId })
    const cached = this.getCache<{ tasks: Task[], taskAssignments: Record<string, string[]> }>(cacheKey)
    if (cached) return cached

    try {
      // Fetch tasks with project info
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`*, project:projects(title, status)`)
        .order('created_at', { ascending: false })

      if (tasksError) throw tasksError

      // Fetch task assignments
      const taskIds = (tasksData || []).map((t: any) => t.id)
      let taskAssignments: Record<string, string[]> = {}

      if (taskIds.length > 0) {
        const { data: assignData } = await supabase
          .from('task_assign')
          .select('task_id, member_id')
          .in('task_id', taskIds)

        assignData?.forEach((row: any) => {
          if (!taskAssignments[row.task_id]) taskAssignments[row.task_id] = []
          taskAssignments[row.task_id].push(row.member_id)
        })
      }

      const result = { tasks: tasksData || [], taskAssignments }
      this.setCache(cacheKey, result, this.CACHE_TTL.tasks)
      return result
    } catch (error) {
      console.error('Error fetching tasks:', error)
      return { tasks: [], taskAssignments: {} }
    }
  }

  private async getProjectMembers(): Promise<Record<string, string[]>> {
    const cacheKey = 'project_members'
    const cached = this.getCache<Record<string, string[]>>(cacheKey)
    if (cached) return cached

    try {
      const { data } = await supabase
        .from('project_members')
        .select('project_id, member_id')

      const projectMembers: Record<string, string[]> = {}
      data?.forEach(pm => {
        if (!projectMembers[pm.project_id]) projectMembers[pm.project_id] = []
        projectMembers[pm.project_id].push(pm.member_id)
      })

      this.setCache(cacheKey, projectMembers, this.CACHE_TTL.assignments)
      return projectMembers
    } catch (error) {
      console.error('Error fetching project members:', error)
      return {}
    }
  }

  private async getTaskAssignments(): Promise<Record<string, string[]>> {
    const cacheKey = 'task_assignments'
    const cached = this.getCache<Record<string, string[]>>(cacheKey)
    if (cached) return cached

    try {
      const { data } = await supabase
        .from('task_assign')
        .select('task_id, member_id')

      const assignments: Record<string, string[]> = {}
      data?.forEach((row: any) => {
        if (!assignments[row.task_id]) assignments[row.task_id] = []
        assignments[row.task_id].push(row.member_id)
      })

      this.setCache(cacheKey, assignments, this.CACHE_TTL.assignments)
      return assignments
    } catch (error) {
      console.error('Error fetching task assignments:', error)
      return {}
    }
  }

  // Methods to invalidate cache when data changes
  invalidateTaskCache(): void {
    this.invalidateCache('tasks')
    this.invalidateCache('dashboard')
  }

  invalidateProjectCache(): void {
    this.invalidateCache('projects')
    this.invalidateCache('dashboard')
  }

  invalidateMemberCache(): void {
    this.invalidateCache('member')
    this.invalidateCache('dashboard')
  }

  clearAllCache(): void {
    this.cache.clear()
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (key && key.startsWith('dashboard_cache_')) {
          localStorage.removeItem(key)
        }
      }
    } catch (error) {
      console.warn('Failed to clear localStorage:', error)
    }
  }
}

// Export singleton instance
export const dashboardDataManager = new DashboardDataManager()
export type { DashboardData, Task, Project, Member }
