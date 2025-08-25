'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Plus, LogOut, Clock, CheckCircle, Circle, TrendingUp } from 'lucide-react'
import Link from 'next/link'

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
  // Joined data
  project?: {
    title: string
    status: string
  }
}

interface Project {
  id: string
  title: string
  status: string
  progress: number
  tasks_count: number
  completed_tasks: number
}

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMember, setCurrentMember] = useState<{ id: string; email: string; full_name?: string } | null>(null)

  const fetchCurrentMember = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('email', user?.email)
        .single()

      if (error) {
        // If member doesn't exist, create one
        if (error.code === 'PGRST116') {
          const { data: newMember, error: createError } = await supabase
            .from('members')
            .insert([{
              email: user?.email || '',
              full_name: user?.user_metadata?.full_name || null,
            }])
            .select()
            .single()

          if (createError) throw createError
          setCurrentMember(newMember)
        } else {
          throw error
        }
      } else {
        setCurrentMember(data)
      }
    } catch (error) {
      console.error('Error fetching/creating current member:', error)
    }
  }, [user])

  const fetchTasks = useCallback(async () => {
    if (!currentMember) return
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          project:projects(title, status)
        `)
        .eq('created_by', currentMember.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }, [currentMember])

  const fetchProjects = useCallback(async () => {
    if (!currentMember) return
    
    try {
      // Get projects where user is the lead
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('lead_id', currentMember.id)
        .order('created_at', { ascending: false })

      if (projectsError) throw projectsError

      // Get task counts for each project
      const projectsWithCounts = await Promise.all(
        projectsData.map(async (project) => {
          const { data: tasksData } = await supabase
            .from('tasks')
            .select('id, status')
            .eq('project_id', project.id)

          const tasks_count = tasksData?.length || 0
          const completed_tasks = tasksData?.filter(task => task.status === 'completed').length || 0

          return {
            ...project,
            tasks_count,
            completed_tasks
          }
        })
      )

      setProjects(projectsWithCounts)
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }, [currentMember])

  useEffect(() => {
    if (user) {
      fetchCurrentMember()
    }
  }, [user, fetchCurrentMember])

  useEffect(() => {
    if (currentMember) {
      fetchTasks()
      fetchProjects()
    }
  }, [currentMember, fetchTasks, fetchProjects])

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const updates: { status: string; updated_at: string; completed_at?: string; progress?: number } = { 
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
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error
      
      setTasks(tasks.filter(task => task.id !== taskId))
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />
  case 'in_progress': return <Clock className="w-5 h-5 text-primary-500" />
      default: return <Circle className="w-5 h-5 text-gray-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
  case 'in_progress': return 'bg-primary-100 text-primary-800'
      case 'todo': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const todoTasks = tasks.filter(t => t.status === 'todo')
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h1>
          <Link href="/login" className="text-primary-600 hover:text-primary-800">
            Go to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
  <div className="bg-gray-50 shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Task Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Welcome back, {currentMember?.full_name || user.email}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/projects"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Projects
              </Link>
              <Link
                href="/tasks/create"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Link>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Circle className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">To Do</dt>
                    <dd className="text-lg font-medium text-gray-900">{todoTasks.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-primary-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                    <dd className="text-lg font-medium text-gray-900">{inProgressTasks.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                    <dd className="text-lg font-medium text-gray-900">{completedTasks.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Projects</dt>
                    <dd className="text-lg font-medium text-gray-900">{projects.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Tasks */}
          <div className="bg-gray-50 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Tasks</h3>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8">
                  <Circle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new task.</p>
                  <div className="mt-6">
                    <Link
                      href="/tasks/create"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Task
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {tasks.slice(0, 10).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3 flex-1">
                        <button
                          onClick={() => updateTaskStatus(task.id, task.status === 'completed' ? 'todo' : 'completed')}
                        >
                          {getStatusIcon(task.status)}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {task.title}
                          </p>
                          {task.project && (
                            <p className="text-xs text-gray-500">
                              Project: {task.project.title}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                              {task.status.replace('_', ' ')}
                            </span>
                            {task.progress > 0 && (
                              <span className="text-xs text-gray-500">
                                {task.progress}% complete
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/tasks/${task.id}/edit`}
                          className="text-primary-600 hover:text-primary-800 text-sm"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Projects Overview */}
          <div className="bg-gray-50 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Your Projects</h3>
              <Link
                href="/projects/create"
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                New Project
              </Link>
            </div>
            <div className="p-6">
              {projects.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No projects yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Create your first project to get started.</p>
                  <div className="mt-6">
                    <Link
                      href="/projects/create"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Project
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {projects.map((project) => (
                    <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/projects/${project.id}`)}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium text-gray-900">{project.title}</h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span>{project.tasks_count} tasks</span>
                        <span>{project.completed_tasks} completed</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
