'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { updateProjectProgress } from '@/services/projects'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Calendar, TrendingUp } from 'lucide-react'
import Link from 'next/link'

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['todo', 'in_progress', 'completed']),
  due_date: z.string().optional(),
  project_id: z.string().optional(),
  progress: z.number().min(0).max(100),
  project_contribution: z.number().min(0).max(100),
})

type TaskForm = z.infer<typeof taskSchema>

interface Task {
  id: string
  title: string
  description: string | null
  project_id: string | null
  status: string
  priority: string
  progress: number
  project_contribution: number
  due_date: string | null
  created_by: string | null
}

interface Project {
  id: string
  title: string
  status: string
}

interface Member {
  id: string
  full_name: string | null
  email: string
}

export default function EditTaskPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const taskId = params.id as string
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [task, setTask] = useState<Task | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [currentMember, setCurrentMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAssigned, setIsAssigned] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
  })

  const selectedProject = watch('project_id')

  useEffect(() => {
    if (user) {
      fetchCurrentMember()
    }
  }, [user])

  useEffect(() => {
    if (currentMember && taskId) {
      fetchTask()
      fetchProjects()
      checkAssignment()
    }
  }, [currentMember, taskId])

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

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, status')
        .order('title')

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const fetchTask = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single()

      if (error) throw error

      setTask(data)
      reset({
        title: data.title,
        description: data.description || '',
        priority: data.priority,
        status: data.status,
        due_date: data.due_date ? data.due_date.substring(0, 16) : '',
        project_id: data.project_id || '',
        progress: data.progress,
        project_contribution: data.project_contribution,
      })
    } catch (error) {
      console.error('Error fetching task:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  // Check if current member is assigned to this task
  const checkAssignment = async () => {
    try {
      if (!currentMember) {
        setIsAssigned(false)
        return
      }
      
      const { data, error } = await supabase
        .from('task_assign')
        .select('member_id')
        .eq('task_id', taskId)
        .eq('member_id', currentMember.id)
        .single()
      setIsAssigned(!!data)
    } catch {
      setIsAssigned(false)
    }
  }

  const onSubmit = async (data: TaskForm) => {
    if (!user || !task) return

    setIsSubmitting(true)
    try {
  const updates: Record<string, unknown> = {
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        status: data.status,
        due_date: data.due_date || null,
        project_id: data.project_id || null,
        progress: data.progress,
        project_contribution: data.project_contribution,
        updated_at: new Date().toISOString(),
      }

      if (data.status === 'completed' && task.status !== 'completed') {
        updates.completed_at = new Date().toISOString()
        updates.progress = 100
      } else if (data.status !== 'completed' && task.status === 'completed') {
        updates.completed_at = null
      }

      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)

      if (error) throw error

      // Update project progress if task is associated with a project
      if (data.project_id) {
        await updateProjectProgress(data.project_id)
      }

      router.push('/dashboard')
    } catch (error) {
      console.error('Error updating task:', error)
      alert('Failed to update task. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const projectId = task?.project_id

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      // Update project progress if task was associated with a project
      if (projectId) {
        await updateProjectProgress(projectId)
      }

      router.push('/dashboard')
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('Failed to delete task. Please try again.')
    }
  }

  // Top-level conditional rendering
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>
      {/* Header */}
      <div className="bg-surface shadow-sm border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
              href="/dashboard"
              className="flex items-center text-primary-700 hover:text-primary-900 mr-4 font-jura"
            >
              <ArrowLeft className="w-5 h-5 mr-1 text-primary-700" />
              <span className="font-jura">Back to Dashboard</span>
            </Link>
            <h1 className="text-3xl font-bold text-primary-900 font-jura ml-2">Edit Task</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-surface shadow rounded-lg">
          <form className="space-y-6 p-6 font-jura">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2 font-jura">
                Task Title *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-jura"
                placeholder="Enter task title"
                style={{ fontFamily: 'Jura, sans-serif' }}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2 font-jura">
                Description
              </label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-jura"
                placeholder="Describe what needs to be done..."
                style={{ fontFamily: 'Jura, sans-serif' }}
              />
            </div>

            {/* Project Selection */}
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2 font-jura">
                <TrendingUp className="w-4 h-4 inline mr-1 text-primary-700" />
                Project (Optional)
              </label>
              <select
                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-jura"
                style={{ fontFamily: 'Jura, sans-serif' }}
              >
                <option className="font-jura">No project (standalone task)</option>
                <option className="font-jura">Sample Project (active)</option>
              </select>
            </div>

            {/* Status and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2 font-jura">
                  Status
                </label>
                <select
                  className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-jura"
                  style={{ fontFamily: 'Jura, sans-serif' }}
                >
                  <option className="font-jura">To Do</option>
                  <option className="font-jura">In Progress</option>
                  <option className="font-jura">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2 font-jura">
                  Priority
                </label>
                <select
                  className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-jura"
                  style={{ fontFamily: 'Jura, sans-serif' }}
                >
                  <option className="font-jura">Low</option>
                  <option className="font-jura">Medium</option>
                  <option className="font-jura">High</option>
                </select>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2 font-jura">
                <Calendar className="w-4 h-4 inline mr-1 text-primary-700" />
                Due Date
              </label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-jura"
                style={{ fontFamily: 'Jura, sans-serif' }}
              />
            </div>

            {/* Progress and Project Contribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2 font-jura">
                  Progress (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-jura"
                  placeholder="0"
                  style={{ fontFamily: 'Jura, sans-serif' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2 font-jura">
                  Project Contribution (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-jura"
                  placeholder="0"
                  style={{ fontFamily: 'Jura, sans-serif' }}
                />
                <p className="mt-1 text-xs text-primary-600 font-jura">
                  How much this task contributes to the overall project completion
                </p>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-between">
              <button
                type="button"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-jura"
                style={{ backgroundColor: '#dc2626', color: '#fff', fontFamily: 'Jura, sans-serif' }}
              >
                Delete Task
              </button>
              <div className="flex space-x-3">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 border border-primary-300 rounded-lg text-primary-700 hover:bg-primary-50 transition-colors font-jura"
                  style={{ fontFamily: 'Jura, sans-serif' }}
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-400 text-white rounded-lg hover:bg-primary-500 transition-colors font-jura"
                  style={{ backgroundColor: 'var(--primary-600, #007f6d)', fontFamily: 'Jura, sans-serif' }}
                >
                  Update Task
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
