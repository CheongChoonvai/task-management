'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Plus, Calendar, User, TrendingUp, DollarSign } from 'lucide-react'
import Link from 'next/link'

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
  project_members?: ProjectMember[]
  tasks_count?: number
  completed_tasks?: number
}

interface ProjectMember {
  id: string
  member_id: string
}

interface Task {
  id: string
  status: string
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && user.email) {
      fetchProjects()
    }
  }, [user]) // Note: fetchProjects dependency warning will remain until we convert to useCallback

  const fetchProjects = async () => {
    try {
      // Get current member id by user email
      if (!user || !user.email) {
        throw new Error('User or user email is not available');
      }
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id')
        .eq('email', user.email)
        .single();
      if (memberError || !memberData) throw memberError || new Error('Member not found');
      const memberId = memberData.id;

      // Get projects where user is a member
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`*, lead:members!projects_lead_id_fkey(full_name, email), project_members:project_members(id, member_id)`) // join project_members
        .order('created_at', { ascending: false });
      if (projectsError) throw projectsError;

      // Filter projects to only those where project_members includes current member
      const filteredProjects = (projectsData || []).filter((project: Project) =>
        project.project_members?.some((pm: ProjectMember) => pm.member_id === memberId)
      );

      // Get task counts for each filtered project
      const projectsWithCounts = await Promise.all(
        filteredProjects.map(async (project: Project) => {
          const { data: tasksData } = await supabase
            .from('tasks')
            .select('id, status')
            .eq('project_id', project.id);
          const tasks_count = tasksData?.length || 0;
          const completed_tasks = tasksData?.filter((task: Task) => task.status === 'completed').length || 0;
          return {
            ...project,
            tasks_count,
            completed_tasks
          };
        })
      );
      setProjects(projectsWithCounts);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
  case 'planning': return 'bg-autumn-100 text-autumn-800'
      case 'active': return 'bg-orange-100 text-orange-800'
      case 'on-hold': return 'bg-brown-100 text-brown-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-orange-100 text-orange-800'
      case 'low': return 'bg-brown-100 text-brown-800'
      default: return 'bg-gray-100 text-gray-800'
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
  <div className="bg-surface shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-autumn-600 font-jura" style={{ color: 'var(--autumn-600, #d4792f)', fontFamily: 'Jura, sans-serif' }}>Projects</h1>
              <p className="mt-1 text-sm text-autumn-500 font-jura" style={{ color: 'var(--autumn-500, #e8954a)', fontFamily: 'Jura, sans-serif' }}>
                Manage your projects and track progress
              </p>
            </div>
            <div className="flex space-x-3">
              <Link href="/calendar" className="text-autumn-600 hover:text-autumn-800 font-jura" style={{ color: 'var(--autumn-600, #d4792f)', fontFamily: 'Jura, sans-serif' }}>
                Calendar
              </Link>
              <Link href="/dashboard" className="text-autumn-600 hover:text-autumn-800 font-jura" style={{ color: 'var(--autumn-600, #d4792f)', fontFamily: 'Jura, sans-serif' }}>
                Dashboard
              </Link>
              <Link
                href="/projects/create"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-jura rounded-md shadow-sm text-white bg-autumn-600 hover:bg-autumn-700"
                style={{ backgroundColor: 'var(--autumn-600, #d4792f)', fontFamily: 'Jura, sans-serif' }}
              >
                <Plus className="w-4 h-4 mr-2 text-white" />
                New Project
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12 font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-autumn-600 mx-auto"></div>
            <p className="mt-2 text-autumn-500 font-jura" style={{ color: 'var(--autumn-500, #e8954a)', fontFamily: 'Jura, sans-serif' }}>Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <TrendingUp className="w-12 h-12 text-autumn-400" style={{ color: 'var(--autumn-400, #f1a973)' }} />
            </div>
            <h3 className="text-lg font-medium text-autumn-600 mb-2 font-jura" style={{ color: 'var(--autumn-600, #d4792f)', fontFamily: 'Jura, sans-serif' }}>No projects yet</h3>
            <p className="text-autumn-500 mb-6 font-jura" style={{ color: 'var(--autumn-500, #e8954a)', fontFamily: 'Jura, sans-serif' }}>Get started by creating your first project</p>
            <Link
              href="/projects/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-jura rounded-md shadow-sm text-white bg-autumn-600 hover:bg-autumn-700"
              style={{ backgroundColor: 'var(--autumn-600, #d4792f)', fontFamily: 'Jura, sans-serif' }}
            >
              <Plus className="w-4 h-4 mr-2 text-white" />
              Create Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-surface rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer font-jura"
                style={{ fontFamily: 'Jura, sans-serif' }}
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <div className="p-6">
                  {/* Project Header */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-autumn-600 truncate font-jura" style={{ color: 'var(--autumn-600, #d4792f)', fontFamily: 'Jura, sans-serif' }}>
                      {project.title}
                    </h3>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 text-xs font-jura font-medium rounded-full ${getStatusColor(project.status)}`}>{project.status}</span>
                      <span className={`px-2 py-1 text-xs font-jura font-medium rounded-full ${getPriorityColor(project.priority)}`}>{project.priority}</span>
                    </div>
                  </div>

                  {/* Description */}
                  {project.description && (
                    <p className="text-sm text-primary-500 mb-4 line-clamp-2 font-jura" style={{ color: 'var(--primary-500, #008774)', fontFamily: 'Jura, sans-serif' }}>
                      {project.description}
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-primary-500 mb-1 font-jura" style={{ color: 'var(--primary-500, #008774)', fontFamily: 'Jura, sans-serif' }}>
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%`, backgroundColor: 'var(--primary-600, #007f6d)' }}
                      ></div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-600 font-jura" style={{ color: 'var(--primary-600, #007f6d)', fontFamily: 'Jura, sans-serif' }}>{project.tasks_count || 0}</div>
                      <div className="text-xs text-primary-500 font-jura" style={{ color: 'var(--primary-500, #008774)', fontFamily: 'Jura, sans-serif' }}>Total Tasks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 font-jura" style={{ color: 'var(--green-600, #16a34a)', fontFamily: 'Jura, sans-serif' }}>{project.completed_tasks || 0}</div>
                      <div className="text-xs text-primary-500 font-jura" style={{ color: 'var(--primary-500, #008774)', fontFamily: 'Jura, sans-serif' }}>Completed</div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-sm text-primary-500 font-jura" style={{ color: 'var(--primary-500, #008774)', fontFamily: 'Jura, sans-serif' }}>
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1 text-primary-600" style={{ color: 'var(--primary-600, #007f6d)' }} />
                      <span>{project.lead?.full_name || project.lead?.email || 'Unassigned'}</span>
                    </div>
                    {project.deadline && (
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-primary-600" style={{ color: 'var(--primary-600, #007f6d)' }} />
                        <span>{new Date(project.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Budget */}
                  {project.budget > 0 && (
                    <div className="mt-2 flex items-center text-sm text-primary-500 font-jura" style={{ color: 'var(--primary-500, #008774)', fontFamily: 'Jura, sans-serif' }}>
                      <DollarSign className="w-4 h-4 mr-1 text-primary-600" style={{ color: 'var(--primary-600, #007f6d)' }} />
                      <span>${project.budget.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
