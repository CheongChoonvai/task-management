'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, User, Calendar, DollarSign } from 'lucide-react'
import Link from 'next/link'

const projectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().optional(),
  status: z.enum(['planning', 'active', 'on-hold', 'completed']),
  priority: z.enum(['low', 'medium', 'high']),
  deadline: z.string().optional(),
  lead_id: z.string().optional(),
  members: z.array(z.string()).min(1, 'Select at least one member'),
})

type ProjectForm = z.infer<typeof projectSchema>

interface Member {
  id: string
  full_name: string | null
  email: string
}

export default function CreateProjectPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [members, setMembers] = useState<Member[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      status: 'planning',
      priority: 'medium',
      members: [],
    },
  })

  useEffect(() => {
    if (user) {
      fetchMembers()
    }
  }, [user])

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, full_name, email')
        .eq('is_active', true)
        .order('full_name')

      if (error) throw error
      setMembers(data || [])
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  const onSubmit = async (data: ProjectForm) => {
    if (!user) return

    setIsSubmitting(true)
    try {
      // Ensure the current user exists in members table
      const { data: currentMember, error: memberError } = await supabase
        .from('members')
        .select('id')
        .eq('email', user.email)
        .single()

      let leadId = data.lead_id || null

      // If no lead selected or member not found, try to use current user
      if (!leadId && !memberError && currentMember) {
        leadId = currentMember.id
      }

      const insertData = {
        title: data.title,
        description: data.description || null,
        status: data.status,
        priority: data.priority,
        deadline: data.deadline || null,
        lead_id: leadId,
      }

      // Insert project
      const { data: projectResult, error: projectError } = await supabase
        .from('projects')
        .insert([insertData])
        .select('id')
        .single();

      if (projectError) throw projectError;

      // Insert project_members records for each selected member
      const projectId = projectResult?.id;
      if (projectId && data.members.length > 0) {
        const memberRows = data.members.map(memberId => ({ project_id: projectId, member_id: memberId }));
        const { error: pmError } = await supabase
          .from('project_members')
          .insert(memberRows);
        if (pmError) throw pmError;
      }

      router.push('/projects')
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
              href="/projects"
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back to Projects
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Title *
              </label>
              <input
                type="text"
                {...register('title')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter project title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the project goals and objectives..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Status and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  {...register('priority')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

            {/* Lead and Deadline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Project Lead
                </label>
                <select
                  {...register('lead_id')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a project lead</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name || member.email}
                    </option>
                  ))}
                </select>
                {errors.lead_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.lead_id.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Deadline
                </label>
                <input
                  type="date"
                  {...register('deadline')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.deadline && (
                  <p className="mt-1 text-sm text-red-600">{errors.deadline.message}</p>
                )}
              </div>
            </div>

            {/* Members */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Members
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {members.map((member) => (
                  <label key={member.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={member.id}
                      {...register('members')}
                      className="form-checkbox h-4 w-4 text-blue-600"
                    />
                    <span>{member.full_name || member.email}</span>
                  </label>
                ))}
              </div>
              {errors.members && (
                <p className="mt-1 text-sm text-red-600">{errors.members.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <Link
                href="/projects"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
