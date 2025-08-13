'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, updateProjectProgress } from '@/lib/supabase'
import { Plus, LogOut, Clock, CheckCircle, Circle, AlertCircle, TrendingUp, User, Calendar, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { getDisplayName, getStatusStyles, getPriorityStyles } from '@/lib/utils'

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
  const [currentMember, setCurrentMember] = useState<any>(null)

  useEffect(() => {
    if (user) {
      fetchCurrentMember()
    }
  }, [user])

  useEffect(() => {
    if (currentMember) {
      fetchTasks()
      fetchProjects()
    }
  }, [currentMember])

  const fetchCurrentMember = async () => {
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
  }

  const fetchTasks = async () => {
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
  }

  const fetchProjects = async () => {
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

      // Find the task to get its project_id
      const task = tasks.find(t => t.id === taskId)

      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)

      if (error) throw error
      
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      ))

      // Update project progress if task belongs to a project
      if (task?.project_id) {
        await updateProjectProgress(task.project_id)
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      // Find the task to get its project_id before deletion
      const task = tasks.find(t => t.id === taskId)

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error
      
      setTasks(tasks.filter(task => task.id !== taskId))

      // Update project progress if task belonged to a project
      if (task?.project_id) {
        await updateProjectProgress(task.project_id)
      }
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
      case 'in_progress': return <Clock className="w-5 h-5 text-blue-500" />
      default: return <Circle className="w-5 h-5 text-gray-400" />
    }
  }

  const getPriorityColor = (priority: string) => getPriorityStyles(priority)

  const getStatusColor = (status: string) => getStatusStyles(status)

  const todoTasks = tasks.filter(t => t.status === 'todo')
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h1>
          <Link href="/login" className="text-blue-600 hover:text-blue-800">
            Go to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center py-6 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Task Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Welcome back, {getDisplayName(currentMember, user?.email)}
              </p>
            </div>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4 w-full md:w-auto">
              <Link
                href="/projects"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium text-center"
              >
                Projects
              </Link>
              <Link
                href="/tasks/create"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Link>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center justify-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
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

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-blue-400" />
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

          <div className="bg-white overflow-hidden shadow rounded-lg">
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
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Tasks</h3>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8">
                  <Circle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new task.</p>
                  <div className="mt-6">
                    <Link
                      href="/tasks/create"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
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
                        {task.status === 'completed' ? (
                          <span className="text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">
                            Completed
                          </span>
                        ) : (
                          <button
                            onClick={() => updateTaskStatus(task.id, 'completed')}
                            className="text-sm font-medium text-blue-600 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-full transition-colors"
                          >
                            Complete
                          </button>
                        )}
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
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityStyles(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(task.status)}`}>
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
                        {task.status !== 'completed' ? (
                          <>
                            <Link
                              href={`/tasks/${task.id}/edit`}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this task?')) {
                                  deleteTask(task.id)
                                }
                              }}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <span className="text-gray-400 text-sm">Task completed</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Projects Overview */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Your Projects</h3>
              <Link
                href="/projects/create"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
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
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
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
                          className="bg-blue-600 h-2 rounded-full"
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
