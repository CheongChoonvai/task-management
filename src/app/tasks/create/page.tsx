"use client"
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  project_id: z.string().min(1, 'Select a project'),
  assigned_members: z.array(z.string()).min(1, 'Assign at least one member'),
  progress: z.number().min(0).max(100).optional(),
  project_contribution: z.number().min(0).max(100).optional(),
})

type TaskForm = z.infer<typeof taskSchema>

interface Project {
  id: string
  title: string
  description: string | null
  status: string
}

interface Member {
  id: string
  full_name: string | null
  email: string
}

interface ProjectMember {
  member_id: string
  members: {
    full_name: string | null
    email: string
  }[]
}

export default function CreateTaskPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [preselectedProject, setPreselectedProject] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [currentMember, setCurrentMember] = useState<Member | null>(null)
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      status: 'todo',
      priority: 'medium',
      progress: 0,
      project_contribution: 0,
    },
  })

  const selectedProject = watch('project_id')

  useEffect(() => {
    if (user) {
      fetchProjects()
      fetchCurrentMember()
    }
  }, [user])

  // Read preselected project from URL on client-side to avoid useSearchParams prerender issue
  useEffect(() => {
    try {
      const sp = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
      setPreselectedProject(sp.get('project'))
    } catch (e) {
      // ignore
    }
  }, [])

  // Fetch members for selected project
  useEffect(() => {
    if (selectedProject) {
      fetchProjectMembers(selectedProject)
    } else {
      setProjectMembers([])
    }
  }, [selectedProject])

  const fetchProjectMembers = async (projectId: string) => {
    try {
      const res = await fetch(`/api/project-members?projectId=${encodeURIComponent(projectId)}`)
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        console.error('project-members API error', res.status, body)
        throw new Error(`Failed to fetch project members: ${res.status} ${body}`)
      }
  const data = await res.json()
  console.debug('project-members raw response', data)
      setProjectMembers(data || [])
    } catch (error) {
      console.error('Error fetching project members:', error)
    }
  }


  // Set preselected project when projects are loaded
  useEffect(() => {
    if (preselectedProject && projects.length > 0) {
      const project = projects.find(p => p.id === preselectedProject)
      if (project) {
        setValue('project_id', preselectedProject)
      }
    }
  }, [preselectedProject, projects, setValue])

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

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, description, status')
        .order('title')

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const onSubmit = async (data: TaskForm) => {
    if (!user || !currentMember) return

    setIsSubmitting(true)
    try {
      const insertData = {
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        status: data.status,
        due_date: data.due_date || null,
        project_id: data.project_id,
        created_by: currentMember.id,
        progress: data.progress || 0,
        project_contribution: data.project_contribution || 0,
      }

      // Insert task
      const { data: taskResult, error: taskError } = await supabase
        .from('tasks')
        .insert([insertData])
        .select('id')
        .single()
      if (taskError) throw taskError

      // Insert into task_assign for each assigned member
      const taskId = taskResult?.id
      if (taskId && data.assigned_members.length > 0) {
        const assignRows = data.assigned_members.map(memberId => ({ task_id: taskId, member_id: memberId }))
        const { error: assignError } = await supabase
          .from('task_assign')
          .insert(assignRows)
        if (assignError) throw assignError
      }

      // Update project progress
      if (data.project_id) {
        await updateProjectProgress(data.project_id)
      }

      router.push('/dashboard')
    } catch (error) {
      console.error('Error creating task:', error)
      alert('Failed to create task. Please try again.')
    } finally {
      setIsSubmitting(false)
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

  return (
  <div className="min-h-screen bg-gray-50 font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>
      {/* Header */}
  <div className="bg-gray-50 shadow-sm border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>
          <div className="flex items-center py-6">
            <Link
              href="/dashboard"
              className="flex items-center text-primary-600 hover:text-primary-800 font-jura mr-4"
              style={{ color: 'var(--primary-600, #007f6d)', fontFamily: 'Jura, sans-serif' }}
            >
              <ArrowLeft className="w-5 h-5 mr-1 text-primary-600" style={{ color: 'var(--primary-600, #007f6d)' }} />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-primary-600 font-jura" style={{ color: 'var(--primary-600, #007f6d)', fontFamily: 'Jura, sans-serif' }}>Create New Task</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div className="bg-surface shadow rounded-lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6 font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>Task Title <span className="text-primary-600">*</span></span>
              </label>
              <input
                type="text"
                {...register('title')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-jura"
                placeholder="Enter task title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>Description</span>
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-jura"
                placeholder="Describe what needs to be done..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Project Selection (Required) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TrendingUp className="w-4 h-4 inline mr-1 text-primary-600" style={{ color: 'var(--primary-600, #007f6d)' }} />
                <span className="font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>Project <span className="text-primary-600">*</span></span>
              </label>
              <select
                {...register('project_id')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-jura"
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title} ({project.status})
                  </option>
                ))}
              </select>
              {projects.length === 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  No projects available. <Link href="/projects/create" className="text-primary-600 hover:text-primary-800 font-jura" style={{ color: 'var(--primary-600, #007f6d)', fontFamily: 'Jura, sans-serif' }}>Create a project first</Link>
                </p>
              )}
              {errors.project_id && (
                <p className="mt-1 text-sm text-red-600">{errors.project_id.message}</p>
              )}
            </div>

            {/* Member Assignment (multi-select) */}
            {selectedProject && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>Assign Members</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="col-span-1 md:col-span-2">
                    <div className="border border-gray-200 rounded-md bg-gray-50 max-h-48 overflow-auto p-2">
                      {projectMembers.length === 0 ? (
                        <p className="text-sm text-gray-500 m-2">No members found for this project.</p>
                      ) : (
                        projectMembers.map((pm) => {
                          const memberObj = Array.isArray(pm.members) ? pm.members[0] : pm.members
                          const name = memberObj?.full_name || memberObj?.email || 'Unknown'
                          const id = `assign-${pm.member_id}`
                          return (
                            <label key={pm.member_id} htmlFor={id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                              <input
                                id={id}
                                type="checkbox"
                                value={pm.member_id}
                                {...register('assigned_members')}
                                className="h-4 w-4 text-primary-600 rounded border-gray-300"
                              />
                              <span className="ml-2 text-black text-sm truncate">{name}</span>
                            </label>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>
                {errors.assigned_members && (
                  <p className="mt-1 text-sm text-red-600">{errors.assigned_members.message}</p>
                )}
              </div>
            )}

            {/* Status and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>Status</span>
                </label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-jura"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>Priority</span>
                </label>
                <select
                  {...register('priority')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-jura"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                {errors.priority && (
                  <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
                )}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1 text-primary-600" style={{ color: 'var(--primary-600, #007f6d)' }} />
                <span className="font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>Due Date</span>
              </label>
              <input
                type="datetime-local"
                {...register('due_date')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-jura"
              />
              {errors.due_date && (
                <p className="mt-1 text-sm text-red-600">{errors.due_date.message}</p>
              )}
            </div>

            {/* Progress and Project Contribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>Initial Progress (%)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  {...register('progress', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-jura"
                  placeholder="0"
                />
                {errors.progress && (
                  <p className="mt-1 text-sm text-red-600">{errors.progress.message}</p>
                )}
              </div>

              {selectedProject && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>Project Contribution (%)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    {...register('project_contribution', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-jura"
                    placeholder="0"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    How much this task contributes to the overall project completion
                  </p>
                  {errors.project_contribution && (
                    <p className="mt-1 text-sm text-red-600">{errors.project_contribution.message}</p>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <Link
                href="/dashboard"
                className="px-4 py-2 border border-gray-300 rounded-lg text-primary-600 hover:bg-primary-50 font-jura transition-colors"
                style={{ color: 'var(--primary-600, #007f6d)', fontFamily: 'Jura, sans-serif', borderColor: 'var(--primary-600, #007f6d)' }}
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg font-jura hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ backgroundColor: 'var(--primary-600, #007f6d)', fontFamily: 'Jura, sans-serif' }}
              >
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
