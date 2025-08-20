'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, updateProjectProgress } from '@/lib/supabase'
import { dashboardDataManager, type DashboardData, type Task, type Project } from '@/lib/dashboardDataManager'
import { Plus, LogOut, Clock, CheckCircle, Circle, AlertCircle, TrendingUp, User, Calendar, BarChart3, RefreshCw, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { getDisplayName, getStatusStyles, getPriorityStyles } from '@/lib/utils'

// Enhanced state management with clear loading and error states
interface DashboardState {
  data: DashboardData | null
  loading: {
    initial: boolean
    tasks: boolean
    refreshing: boolean
  }
  error: {
    message: string | null
    type: 'fetch' | 'update' | null
  }
}

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  
  // Simplified state management with clear structure
  const [state, setState] = useState<DashboardState>({
    data: null,
    loading: {
      initial: true,
      tasks: false,
      refreshing: false
    },
    error: {
      message: null,
      type: null
    }
  })

  // Helper function to update loading state
  const setLoading = (key: keyof DashboardState['loading'], value: boolean) => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, [key]: value }
    }))
  }

  // Helper function to set error state
  const setError = (message: string | null, type: DashboardState['error']['type'] = null) => {
    setState(prev => ({
      ...prev,
      error: { message, type }
    }))
  }

  // Clear error state
  const clearError = () => setError(null)

  // Load dashboard data using the optimized data manager
  const loadDashboardData = useCallback(async (forceRefresh = false) => {
    if (!user?.email) return

    try {
      setLoading('initial', true)
      clearError()

      if (forceRefresh) {
        dashboardDataManager.clearAllCache()
      }

      // First get the current member
      const currentMember = await dashboardDataManager.getCurrentMember(user.email)
      
      // Then get all dashboard data in one optimized call
      const dashboardData = await dashboardDataManager.getDashboardData(currentMember.id)

      setState(prev => ({
        ...prev,
        data: dashboardData,
        loading: { ...prev.loading, initial: false },
        error: { message: null, type: null }
      }))

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data', 'fetch')
    } finally {
      setLoading('initial', false)
    }
  }, [user?.email])

  // Load data on component mount
  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Refresh data function for error recovery
  const refreshData = useCallback(async () => {
    setLoading('refreshing', true)
    await loadDashboardData(true)
    setLoading('refreshing', false)
  }, [loadDashboardData])

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    if (!state.data) return
    
    setLoading('tasks', true)
    
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
      const task = state.data.tasks.find((t: Task) => t.id === taskId)

      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)

      if (error) throw error
      
      // Update local state optimistically
      setState(prev => ({
        ...prev,
        data: prev.data ? {
          ...prev.data,
          tasks: prev.data.tasks.map((task: Task) => 
            task.id === taskId ? { ...task, ...updates } : task
          )
        } : null
      }))

      // Invalidate cache and update project progress
      dashboardDataManager.invalidateTaskCache()
      if (task?.project_id) {
        await updateProjectProgress(task.project_id)
        dashboardDataManager.invalidateProjectCache()
      }
    } catch (error) {
      console.error('Error updating task:', error)
      setError('Failed to update task. Please try again.', 'update')
    } finally {
      setLoading('tasks', false)
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!state.data) return
    
    setLoading('tasks', true)
    
    try {
      // Find the task to get its project_id before deletion
      const task = state.data.tasks.find((t: Task) => t.id === taskId)

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error
      
      // Update local state optimistically
      setState(prev => ({
        ...prev,
        data: prev.data ? {
          ...prev.data,
          tasks: prev.data.tasks.filter((task: Task) => task.id !== taskId)
        } : null
      }))

      // Invalidate cache and update project progress
      dashboardDataManager.invalidateTaskCache()
      if (task?.project_id) {
        await updateProjectProgress(task.project_id)
        dashboardDataManager.invalidateProjectCache()
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      setError('Failed to delete task. Please try again.', 'update')
    } finally {
      setLoading('tasks', false)
    }
  }

  const handleSignOut = async () => {
    dashboardDataManager.clearAllCache()
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

  const getPriorityColor = (priority: string) => getPriorityStyles(priority)
  const getStatusColor = (status: string) => getStatusStyles(status)

  // Derived state for better UX
  const { data } = state
  const tasks = data?.tasks || []
  const projects = data?.projects || []
  const currentMember = data?.currentMember
  
  const todoTasks = tasks.filter((t: Task) => t.status === 'todo')
  const inProgressTasks = tasks.filter((t: Task) => t.status === 'in_progress')
  const completedTasks = tasks.filter((t: Task) => t.status === 'completed')
  
  const isLoading = state.loading.initial
  const isRefreshing = state.loading.refreshing
  const hasError = !!state.error.message

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>
      {/* Modern Header with Glassmorphism Effect */}
      <div className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-200/60 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center py-4 gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: 'var(--autumn-600, #d4792f)' }}>
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-autumn-700 font-jura">
                                  Task Dashboard
                                </h1>
                <p className="mt-1 text-sm text-autumn-600 font-medium font-jura">
                  Welcome back, {getDisplayName(currentMember, user?.email)} 👋
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/calendar"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 font-jura border border-autumn-200 hover:bg-autumn-700"
                style={{ backgroundColor: 'var(--autumn-600, #d4792f)' }}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Calendar
              </Link>
              <Link
                href="/projects"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 font-jura border border-autumn-200 hover:bg-brown-600"
                style={{ backgroundColor: 'var(--brown-600, #a18072)' }}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Projects
              </Link>
              <Link
                href="/tasks/create"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-jura hover:bg-orange-600"
                style={{ backgroundColor: 'var(--orange-600, #ea580c)' }}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Link>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 text-sm text-white rounded-lg transition-all duration-200 font-jura hover:bg-autumn-700"
                style={{ backgroundColor: 'var(--autumn-600, #d4792f)' }}
              >
                <LogOut className="w-4 h-4 mr-1" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message with Modern Design */}
        {hasError && (
          <div className="mb-8 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-sm font-semibold text-red-800">Something went wrong</h3>
                <p className="mt-1 text-sm text-red-700">{state.error.message}</p>
              </div>
              <button
                onClick={refreshData}
                disabled={isRefreshing}
                className="inline-flex items-center px-4 py-2 bg-white hover:bg-red-50 border border-red-300 rounded-lg text-sm font-medium text-red-700 transition-all duration-200 disabled:opacity-50 shadow-sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Retrying...' : 'Retry'}
              </button>
            </div>
          </div>
        )}

        {/* Modern Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl shadow-lg mb-4">
                <RefreshCw className="animate-spin h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Dashboard</h3>
              <p className="text-sm text-gray-600">Fetching your latest data...</p>
            </div>
          </div>
        )}

        {/* Modern Stats Cards */}
        {!isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* To Do Tasks Card */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: 'var(--primary-600, #007f6d)' }}>
                      <Circle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 font-jura">To Do</p>
                      <p className="text-2xl font-bold text-gray-900 font-jura">{todoTasks.length}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${tasks.length > 0 ? (todoTasks.length / tasks.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* In Progress Tasks Card */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: 'var(--orange-500, #f97316)' }}>
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 font-jura">In Progress</p>
                      <p className="text-2xl font-bold text-gray-900 font-jura">{inProgressTasks.length}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500"
                        style={{ width: `${tasks.length > 0 ? (inProgressTasks.length / tasks.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Completed Tasks Card */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: 'var(--brown-600, #a18072)' }}>
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 font-jura">Completed</p>
                      <p className="text-2xl font-bold text-gray-900 font-jura">{completedTasks.length}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-brown-500 to-brown-600 rounded-full transition-all duration-500"
                        style={{ width: `${tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Projects Card */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: 'var(--autumn-600, #d4792f)' }}>
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 font-jura">Projects</p>
                      <p className="text-2xl font-bold text-gray-900 font-jura">{projects.length}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Link href="/projects/create" className="text-autumn-600 hover:text-autumn-800 text-sm font-medium">
                      Create →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Recent Tasks - Modern Card Design */}
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-autumn-50 to-autumn-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--autumn-600, #d4792f)' }}>
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 font-jura">Recent Tasks</h3>
                  <span className="bg-autumn-100 text-autumn-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {tasks.length} total
                  </span>
                </div>
                <Link
                  href="/tasks/create"
                  className="inline-flex items-center text-sm font-medium text-autumn-600 hover:text-autumn-700 transition-colors duration-200"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Task
                </Link>
              </div>
            </div>
            <div className="p-6">
              {state.loading.tasks ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-4">
                    <RefreshCw className="animate-spin h-6 w-6 text-primary-600" />
                  </div>
                  <p className="text-sm text-gray-600">Updating tasks...</p>
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Circle className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 font-jura">No tasks yet</h3>
                  <p className="text-gray-600 mb-6 max-w-sm mx-auto">Get started by creating your first task and boost your productivity!</p>
                  <Link
                    href="/tasks/create"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Task
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                  {tasks.slice(0, 10).map((task: Task, index) => (
                    <div key={task.id} className="group p-4 border border-gray-200 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-white hover:shadow-md transition-all duration-300 hover:border-primary-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          {/* Task Status Button */}
                          <div className="flex-shrink-0">
                            {task.status === 'completed' ? (
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              </div>
                            ) : task.canComplete ? (
                              <button
                                onClick={() => updateTaskStatus(task.id, 'completed')}
                                className="w-8 h-8 bg-primary-100 hover:bg-primary-200 rounded-full flex items-center justify-center transition-colors duration-200 group"
                                title={task.completionReason}
                              >
                                <Circle className="w-5 h-5 text-primary-600 group-hover:text-primary-700" />
                              </button>
                            ) : (
                              <div 
                                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center cursor-not-allowed"
                                title={task.completionReason}
                              >
                                <AlertCircle className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Task Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className={`font-medium text-sm ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'} font-jura`}>
                                {task.title}
                              </h4>
                              {task.project && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                                  {task.project.title}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2 flex-wrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityStyles(task.priority)}`}>
                                {task.priority}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(task.status)}`}>
                                {task.status.replace('_', ' ')}
                              </span>
                              {task.progress > 0 && (
                                <div className="flex items-center space-x-1">
                                  <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300"
                                      style={{ width: `${task.progress}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-gray-500 font-medium">{task.progress}%</span>
                                </div>
                              )}
                              {task.assignedMembers && task.assignedMembers.length > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                                  <User className="w-3 h-3 mr-1" />
                                  {task.assignedMembers.length}
                                </span>
                              )}
                            </div>
                            
                            {task.completionReason && (
                              <p className="text-xs text-gray-500 mt-1 italic">{task.completionReason}</p>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {task.status !== 'completed' ? (
                            <>
                              <Link
                                href={`/tasks/${task.id}/edit`}
                                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Link>
                              <button
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this task?')) {
                                    deleteTask(task.id)
                                  }
                                }}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          ) : (
                            <span className="text-green-600 text-xs font-medium bg-green-50 px-3 py-1 rounded-full">
                              ✓ Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Projects Overview - Modern Design */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--primary-600, #007f6d)' }}>
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 font-jura">Your Projects</h3>
                  <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {projects.length} active
                  </span>
                </div>
                <Link
                  href="/projects/create"
                  className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors duration-200"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  New Project
                </Link>
              </div>
            </div>
            <div className="p-6">
              {projects.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-10 w-10 text-purple-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 font-jura">No projects yet</h3>
                  <p className="text-gray-600 mb-6 max-w-sm mx-auto">Organize your tasks by creating your first project!</p>
                  <Link
                    href="/projects/create"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Project
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                  {projects.map((project: Project) => (
                    <div 
                      key={project.id} 
                      className="group p-4 border border-gray-200 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-white hover:shadow-md transition-all duration-300 cursor-pointer hover:border-purple-200" 
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {project.title.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors duration-200 font-jura">
                              {project.title}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              Created {new Date(project.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <Circle className="w-3 h-3 mr-1" />
                            {project.tasks_count || 0} tasks
                          </span>
                          <span className="flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                            {project.completed_tasks || 0} done
                          </span>
                        </div>
                        <span className="font-medium text-purple-600">
                          {Math.round(project.progress || 0)}% complete
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${project.progress || 0}%` }}
                        ></div>
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          Last updated {new Date(project.updated_at).toLocaleDateString()}
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <span className="text-xs text-purple-600 font-medium">
                            Click to view →
                          </span>
                        </div>
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
