'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, updateProjectProgress } from '@/lib/supabase'
import { ArrowLeft, Calendar, User, TrendingUp, DollarSign, Plus, CheckCircle, Circle, Clock, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { getDisplayName, formatDate, getStatusStyles, getPriorityStyles } from '@/lib/utils'

interface Project {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  progress: number
  deadline: string | null
  lead_id: string | null
  budget: number
  created_at: string
  updated_at: string
  // Joined data
  lead?: {
    full_name: string | null
    email: string
  }
}

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  progress: number
  project_contribution: number
  due_date: string | null
  created_by: string | null
  created_at: string
  // Joined data
  creator?: {
    full_name: string | null
    email: string
  }
}

export default function ProjectDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentMember, setCurrentMember] = useState<any>(null)
  const [taskAssignments, setTaskAssignments] = useState<Record<string, string[]>>({})

  useEffect(() => {
    if (user && projectId) {
      fetchCurrentMember()
    }
  }, [user, projectId])

  useEffect(() => {
    if (currentMember && projectId) {
      fetchProject()
      fetchTasks()
      fetchTaskAssignments()
      setTimeout(() => {
        updateProjectProgress(projectId).then(() => {
          fetchProject()
        })
      }, 500)
    }
  }, [currentMember, projectId])

  const fetchCurrentMember = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('email', user?.email)
        .single()
      if (error) throw error
      setCurrentMember(data)
    } catch (error) {
      console.error('Error fetching current member:', error)
      router.push('/dashboard')
    }
  }

  // Fetch assigned member IDs for each task
  const fetchTaskAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('task_assign')
        .select('task_id, member_id')
        .in('task_id', tasks.map(t => t.id))
      if (error) throw error
      const assignments: Record<string, string[]> = {};
      (data || []).forEach((row: any) => {
        if (!assignments[row.task_id]) assignments[row.task_id] = [];
        assignments[row.task_id].push(row.member_id);
      });
      setTaskAssignments(assignments);
    } catch (error) {
      setTaskAssignments({})
    }
  }
  // End fetchTaskAssignments
  // End useEffect for fetchCurrentMember

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          lead:members!projects_lead_id_fkey(full_name, email)
        `)
        .eq('id', projectId)
        .single()

      if (error) throw error
      setProject(data)
    } catch (error) {
      console.error('Error fetching project:', error)
      router.push('/projects')
    }
  }

  const refreshProgress = async () => {
    setRefreshing(true)
    try {
      // Update project progress
      await updateProjectProgress(projectId)
      // Refetch project data to get updated progress
      await fetchProject()
    } catch (error) {
      console.error('Error refreshing progress:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          creator:members!tasks_created_by_fkey(full_name, email)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const updates: any = { 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      }

      if (newStatus === 'completed') {
        updates.completed_at = new Date().toISOString()
        updates.progress = 100
      }

      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)

      if (error) throw error
      
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      ))

      // Update project progress using the utility function
      await updateProjectProgress(projectId)
      // Refetch project to get updated progress
      await fetchProject()
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      // Remove from local state
      setTasks(tasks.filter(task => task.id !== taskId))

      // Update project progress
      await updateProjectProgress(projectId)
      await fetchProject()
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>Please sign in</h1>
          <Link href="/login" className="text-primary-600 hover:text-primary-800 font-jura" style={{ color: 'var(--primary-600, #007f6d)', fontFamily: 'Jura, sans-serif' }}>
            Go to login
          </Link>
        </div>
      </div>
    )
  }

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    )
  }

  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const totalTasks = tasks.length

  return (
  <div className="min-h-screen bg-gray-50 font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>
      {/* Header */}
  <div className="bg-surface shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-6 gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Link
                href="/projects"
                className="flex items-center text-primary-600 hover:text-primary-800 font-jura mr-0 sm:mr-4"
                style={{ color: 'var(--primary-600, #007f6d)', fontFamily: 'Jura, sans-serif' }}
              >
                <ArrowLeft className="w-5 h-5 mr-1 text-primary-600" style={{ color: 'var(--primary-600, #007f6d)' }} />
                Back to Projects
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-primary-600 font-jura" style={{ color: 'var(--primary-600, #007f6d)', fontFamily: 'Jura, sans-serif' }}>{project.title}</h1>
                <p className="mt-1 text-sm text-primary-500 font-jura" style={{ color: 'var(--primary-500, #008774)', fontFamily: 'Jura, sans-serif' }}>
                  Project Details and Tasks
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full md:w-auto">
              <Link
                href={`/tasks/create?project=${projectId}`}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-jura rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                style={{ backgroundColor: 'var(--primary-600, #007f6d)', fontFamily: 'Jura, sans-serif' }}
              >
                <Plus className="w-4 h-4 mr-2 text-white" />
                Add Task
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Overview */}
  <div className="bg-surface shadow rounded-lg mb-8">
          <div className="p-6 font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Project Info */}
              <div className="md:col-span-1 lg:col-span-2">
                <div className="flex items-center space-x-3 mb-4">
                  <span className={`px-3 py-1 text-sm font-jura font-medium rounded-full ${getStatusStyles(project.status)}`}>{project.status}</span>
                  <span className={`px-3 py-1 text-sm font-jura font-medium rounded-full ${getPriorityStyles(project.priority)}`}>{project.priority} priority</span>
                </div>

                {project.description && (
                  <p className="text-primary-500 mb-4 font-jura" style={{ color: 'var(--primary-500, #008774)', fontFamily: 'Jura, sans-serif' }}>{project.description}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>
                  <div className="flex items-center text-primary-500 font-jura" style={{ color: 'var(--primary-500, #008774)', fontFamily: 'Jura, sans-serif' }}>
                    <User className="w-4 h-4 mr-2 text-primary-600" style={{ color: 'var(--primary-600, #007f6d)' }} />
                    <span>Lead: {getDisplayName(project.lead, project.lead?.email)}</span>
                  </div>
                  {project.deadline && (
                    <div className="flex items-center text-primary-500 font-jura" style={{ color: 'var(--primary-500, #008774)', fontFamily: 'Jura, sans-serif' }}>
                      <Calendar className="w-4 h-4 mr-2 text-primary-600" style={{ color: 'var(--primary-600, #007f6d)' }} />
                      <span>Due: {new Date(project.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                  {project.budget > 0 && (
                    <div className="flex items-center text-primary-500 font-jura" style={{ color: 'var(--primary-500, #008774)', fontFamily: 'Jura, sans-serif' }}>
                      <DollarSign className="w-4 h-4 mr-2 text-primary-600" style={{ color: 'var(--primary-600, #007f6d)' }} />
                      <span>Budget: ${project.budget.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center text-primary-500 font-jura" style={{ color: 'var(--primary-500, #008774)', fontFamily: 'Jura, sans-serif' }}>
                    <TrendingUp className="w-4 h-4 mr-2 text-primary-600" style={{ color: 'var(--primary-600, #007f6d)' }} />
                    <span>{totalTasks} tasks ({completedTasks} completed)</span>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-primary-600 font-jura" style={{ color: 'var(--primary-600, #007f6d)', fontFamily: 'Jura, sans-serif' }}>Progress</h3>
                  <button
                    onClick={refreshProgress}
                    disabled={refreshing}
                    className="inline-flex items-center px-2 py-1 text-xs font-jura font-medium rounded text-primary-500 hover:text-primary-700 hover:bg-primary-50 disabled:opacity-50"
                    style={{ color: 'var(--primary-500, #008774)', fontFamily: 'Jura, sans-serif' }}
                    title="Refresh progress calculation"
                  >
                    <RefreshCw className={`w-3 h-3 mr-1 text-primary-600 ${refreshing ? 'animate-spin' : ''}`} style={{ color: 'var(--primary-600, #007f6d)' }} />
                    Refresh
                  </button>
                </div>
                <div className="text-center font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>
                  <div className="text-4xl font-bold text-primary-600 mb-2 font-jura" style={{ color: 'var(--primary-600, #007f6d)', fontFamily: 'Jura, sans-serif' }}>{project.progress}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div
                      className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%`, backgroundColor: 'var(--primary-600, #007f6d)' }}
                    ></div>
                  </div>
                  <p className="text-sm text-primary-500 font-jura" style={{ color: 'var(--primary-500, #008774)', fontFamily: 'Jura, sans-serif' }}>Overall completion</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks */}
  <div className="bg-surface shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>
            <h3 className="text-lg leading-6 font-medium text-primary-600 font-jura" style={{ color: 'var(--primary-600, #007f6d)', fontFamily: 'Jura, sans-serif' }}>Project Tasks</h3>
          </div>
          <div className="p-6 font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>
            {tasks.length === 0 ? (
              <div className="text-center py-8 font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>
                <Circle className="mx-auto h-12 w-12 text-primary-400" style={{ color: 'var(--primary-400, #009883)' }} />
                <h3 className="mt-2 text-sm font-medium text-primary-600 font-jura" style={{ color: 'var(--primary-600, #007f6d)', fontFamily: 'Jura, sans-serif' }}>No tasks yet</h3>
                <p className="mt-1 text-sm text-primary-500 font-jura" style={{ color: 'var(--primary-500, #008774)', fontFamily: 'Jura, sans-serif' }}>Get started by creating a task for this project.</p>
                <div className="mt-6">
                  <Link
                    href={`/tasks/create?project=${projectId}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-jura rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    style={{ backgroundColor: 'var(--primary-600, #007f6d)', fontFamily: 'Jura, sans-serif' }}
                  >
                    <Plus className="w-4 h-4 mr-2 text-white" />
                    Add Task
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-primary-50">
                    <div className="flex items-center space-x-3 flex-1">
                {task.status === 'completed' ? (
                  <span className="text-sm font-jura font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">Completed</span>
                ) : (
                  (taskAssignments[task.id]?.includes(currentMember?.id)) ? (
                    <button
                      onClick={() => updateTaskStatus(task.id, 'completed')}
                      className="text-sm font-jura font-medium text-primary-600 bg-primary-100 hover:bg-primary-200 px-3 py-1 rounded-full transition-colors"
                      style={{ color: 'var(--primary-600, #007f6d)', fontFamily: 'Jura, sans-serif' }}
                    >
                      Complete
                    </button>
                  ) : (
                    <span className="text-xs font-jura text-gray-400 bg-gray-100 px-3 py-1 rounded-full cursor-not-allowed">Only assigned member can complete</span>
                  )
                )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-jura font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-primary-600'}`} style={{ color: task.status === 'completed' ? undefined : 'var(--primary-600, #007f6d)', fontFamily: 'Jura, sans-serif' }}>
                          {task.title}
                        </p>
                        <p className="text-xs font-jura text-primary-500" style={{ color: 'var(--primary-500, #008774)', fontFamily: 'Jura, sans-serif' }}>
                          Created by: {getDisplayName(task.creator, task.creator?.email)}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-jura font-medium ${getPriorityStyles(task.priority)}`}>{task.priority}</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-jura font-medium ${getStatusStyles(task.status)}`}>{task.status.replace('_', ' ')}</span>
                          {task.progress > 0 && (
                            <span className="text-xs font-jura text-primary-500" style={{ color: 'var(--primary-500, #008774)', fontFamily: 'Jura, sans-serif' }}>{task.progress}% complete</span>
                          )}
                          {task.project_contribution > 0 && (
                            <span className="text-xs font-jura text-primary-500" style={{ color: 'var(--primary-500, #008774)', fontFamily: 'Jura, sans-serif' }}>{task.project_contribution}% contribution</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {task.status !== 'completed' ? (
                        <>
                          <Link
                            href={`/tasks/${task.id}/edit`}
                            className="text-primary-600 hover:text-primary-800 text-sm font-jura"
                            style={{ color: 'var(--primary-600, #007f6d)', fontFamily: 'Jura, sans-serif' }}
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this task?')) {
                                deleteTask(task.id)
                              }
                            }}
                            className="text-red-600 hover:text-red-800 text-sm font-jura"
                            style={{ fontFamily: 'Jura, sans-serif' }}
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-400 text-sm font-jura">Task completed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
