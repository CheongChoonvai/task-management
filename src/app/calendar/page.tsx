'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Calendar, momentLocalizer, Event } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { ArrowLeft, Calendar as CalendarIcon, AlertCircle, Plus } from 'lucide-react'
import Link from 'next/link'
import { getStatusStyles, getPriorityStyles } from '@/lib/utils'

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment)

interface Task {
  id: string
  title: string
  description: string | null
  project_id: string | null
  status: string
  priority: string
  progress: number
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  project?: {
    title: string
    status: string
  }
}

interface Project {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  deadline: string | null
  created_at: string
  updated_at: string
}

interface CalendarEvent extends Event {
  id: string
  type: 'task' | 'project'
  priority?: string
  status?: string
  description?: string | null
  originalData: Task | Project
}

interface CalendarState {
  tasks: Task[]
  projects: Project[]
  events: CalendarEvent[]
  loading: boolean
  error: string | null
  currentMember: { id: string; email: string; full_name?: string } | null
}

export default function CalendarPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [state, setState] = useState<CalendarState>({
    tasks: [],
    projects: [],
    events: [],
    loading: true,
    error: null,
    currentMember: null
  })

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  // Load current member
  const loadCurrentMember = useCallback(async () => {
    if (!user?.email) return null

    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('email', user.email)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error loading current member:', error)
      return null
    }
  }, [user?.email])

  // Load tasks and projects data
  const loadCalendarData = useCallback(async () => {
    if (!user?.email) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Get current member first
      const currentMember = await loadCurrentMember()
      if (!currentMember) {
        throw new Error('Member not found')
      }

      // Load tasks created by the user first
      const { data: userTasksData, error: userTasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          project:projects(title, status)
        `)
        .eq('created_by', currentMember.id)
        .order('created_at', { ascending: false })

      if (userTasksError) throw userTasksError

      // Load tasks from projects where user is a member
      const { data: memberProjectIds, error: memberProjectError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('member_id', currentMember.id)

      if (memberProjectError) throw memberProjectError

      let projectTasksData = []
      if (memberProjectIds && memberProjectIds.length > 0) {
        const projectIds = memberProjectIds.map(p => p.project_id)
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            *,
            project:projects(title, status)
          `)
          .in('project_id', projectIds)
          .order('created_at', { ascending: false })

        if (error) throw error
        projectTasksData = data || []
      }

      // Combine and deduplicate tasks
      const allTasks = [...(userTasksData || []), ...projectTasksData]
      const uniqueTasks = allTasks.filter((task, index, self) => 
        index === self.findIndex(t => t.id === task.id)
      )

      // Load projects where user is lead
      const { data: leadProjectsData, error: leadProjectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('lead_id', currentMember.id)
        .order('created_at', { ascending: false })

      if (leadProjectsError) throw leadProjectsError

      // Load projects where user is a member
      let memberProjectsData = []
      if (memberProjectIds && memberProjectIds.length > 0) {
        const projectIds = memberProjectIds.map(p => p.project_id)
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .in('id', projectIds)
          .order('created_at', { ascending: false })

        if (error) throw error
        memberProjectsData = data || []
      }

      // Combine and deduplicate projects
      const allProjects = [...(leadProjectsData || []), ...memberProjectsData]
      const uniqueProjects = allProjects.filter((project, index, self) => 
        index === self.findIndex(p => p.id === project.id)
      )

      // Convert data to calendar events
      const events: CalendarEvent[] = []

      // Add task events
      uniqueTasks?.forEach(task => {
        // Task due date event
        if (task.due_date) {
          events.push({
            id: `task-due-${task.id}`,
            title: `📋 ${task.title} (Due)`,
            start: new Date(task.due_date),
            end: new Date(task.due_date),
            type: 'task',
            priority: task.priority,
            status: task.status,
            description: task.description,
            originalData: task,
            resource: {
              type: 'task-due',
              priority: task.priority,
              status: task.status
            }
          })
        }

        // Task completion event
        if (task.completed_at) {
          events.push({
            id: `task-completed-${task.id}`,
            title: `✅ ${task.title} (Completed)`,
            start: new Date(task.completed_at),
            end: new Date(task.completed_at),
            type: 'task',
            priority: task.priority,
            status: task.status,
            description: task.description,
            originalData: task,
            resource: {
              type: 'task-completed',
              priority: task.priority,
              status: task.status
            }
          })
        }

        // Task creation event (for recent tasks)
        const createdDate = new Date(task.created_at)
        const now = new Date()
        const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24)
        
        if (daysDiff <= 30) { // Show creation events for tasks created in last 30 days
          events.push({
            id: `task-created-${task.id}`,
            title: `🆕 ${task.title} (Created)`,
            start: createdDate,
            end: createdDate,
            type: 'task',
            priority: task.priority,
            status: task.status,
            description: task.description,
            originalData: task,
            resource: {
              type: 'task-created',
              priority: task.priority,
              status: task.status
            }
          })
        }
      })

      // Add project events
      uniqueProjects?.forEach(project => {
        // Project deadline event
        if (project.deadline) {
          events.push({
            id: `project-deadline-${project.id}`,
            title: `🎯 ${project.title} (Deadline)`,
            start: new Date(project.deadline),
            end: new Date(project.deadline),
            type: 'project',
            priority: project.priority,
            status: project.status,
            description: project.description,
            originalData: project,
            resource: {
              type: 'project-deadline',
              priority: project.priority,
              status: project.status
            }
          })
        }

        // Project creation event (for recent projects)
        const createdDate = new Date(project.created_at)
        const now = new Date()
        const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24)
        
        if (daysDiff <= 60) { // Show creation events for projects created in last 60 days
          events.push({
            id: `project-created-${project.id}`,
            title: `🚀 ${project.title} (Started)`,
            start: createdDate,
            end: createdDate,
            type: 'project',
            priority: project.priority,
            status: project.status,
            description: project.description,
            originalData: project,
            resource: {
              type: 'project-created',
              priority: project.priority,
              status: project.status
            }
          })
        }
      })

      setState({
        tasks: uniqueTasks || [],
        projects: uniqueProjects || [],
        events,
        loading: false,
        error: null,
        currentMember
      })

    } catch (error) {
      console.error('Error loading calendar data:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load calendar data'
      }))
    }
  }, [user?.email, loadCurrentMember])

  useEffect(() => {
    loadCalendarData()
  }, [loadCalendarData])

  // Custom event style getter
  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#d4792f' // autumn-600 as default
    let borderColor = '#d4792f'
    
    if (event.type === 'task') {
      const resource = event.resource as { type: string; priority?: string }
      
      if (resource?.type === 'task-due') {
        if (event.priority === 'high') {
          backgroundColor = '#dc2626' // red-600
          borderColor = '#dc2626'
        } else if (event.priority === 'medium') {
          backgroundColor = '#ea580c' // orange-600  
          borderColor = '#ea580c'
        } else {
          backgroundColor = '#a18072' // brown-600
          borderColor = '#a18072'
        }
      } else if (resource?.type === 'task-completed') {
        backgroundColor = '#a18072' // brown-600
        borderColor = '#a18072'
      } else if (resource?.type === 'task-created') {
        backgroundColor = '#d4792f' // autumn-600
        borderColor = '#d4792f'
      }
    } else if (event.type === 'project') {
      const resource = event.resource as { type: string }
      
      if (resource?.type === 'project-deadline') {
        backgroundColor = '#7c3aed' // purple-600
        borderColor = '#7c3aed'
      } else if (resource?.type === 'project-created') {
        backgroundColor = '#4f46e5' // indigo-600
        borderColor = '#4f46e5'
      }
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '12px',
        padding: '2px 6px'
      }
    }
  }

  // Handle event selection
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event)
  }

  // Handle navigation to create pages
  const handleNavigateToCreate = (type: 'task' | 'project') => {
    if (type === 'task') {
      router.push('/tasks/create')
    } else {
      router.push('/projects/create')
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-200/60 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center py-4 gap-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Link>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: 'var(--autumn-600, #d4792f)' }}>
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-autumn-700 to-autumn-800 bg-clip-text text-transparent font-jura">
                  Calendar View
                </h1>
                <p className="mt-1 text-sm text-autumn-600 font-medium font-jura">
                  Your tasks and projects timeline
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleNavigateToCreate('task')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-jura hover:bg-orange-600"
                style={{ backgroundColor: 'var(--orange-600, #ea580c)' }}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </button>
              <button
                onClick={() => handleNavigateToCreate('project')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-jura hover:bg-brown-600"
                style={{ backgroundColor: 'var(--brown-600, #a18072)' }}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {state.error && (
          <div className="mb-8 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-sm font-semibold text-red-800">Error loading calendar</h3>
                <p className="mt-1 text-sm text-red-700">{state.error}</p>
              </div>
              <button
                onClick={loadCalendarData}
                className="inline-flex items-center px-4 py-2 bg-white hover:bg-red-50 border border-red-300 rounded-lg text-sm font-medium text-red-700 transition-all duration-200 shadow-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {state.loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl shadow-lg mb-4">
                <CalendarIcon className="animate-pulse h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Calendar</h3>
              <p className="text-sm text-gray-600">Fetching your tasks and projects...</p>
            </div>
          </div>
        )}

        {/* Calendar Legend */}
        {!state.loading && (
          <div className="mb-6 bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 font-jura">Legend</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-600 rounded"></div>
                <span className="text-sm text-gray-700">High Priority Due</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-600 rounded"></div>
                <span className="text-sm text-gray-700">Medium Priority Due</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-600 rounded"></div>
                <span className="text-sm text-gray-700">Low Priority Due / Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-600 rounded"></div>
                <span className="text-sm text-gray-700">Project Deadline</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-500 rounded"></div>
                <span className="text-sm text-gray-700">Task Created</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-indigo-600 rounded"></div>
                <span className="text-sm text-gray-700">Project Started</span>
              </div>
            </div>
          </div>
        )}

        {/* Calendar */}
        {!state.loading && state.events.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div style={{ height: '700px' }}>
                <Calendar
                  localizer={localizer}
                  events={state.events}
                  startAccessor="start"
                  endAccessor="end"
                  eventPropGetter={eventStyleGetter}
                  onSelectEvent={handleSelectEvent}
                  views={['month', 'week', 'day', 'agenda']}
                  defaultView="month"
                  popup
                  className="font-jura"
                  style={{ fontFamily: 'Jura, sans-serif' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!state.loading && state.events.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarIcon className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 font-jura">No events to display</h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">Create your first task or project to see events on the calendar!</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => handleNavigateToCreate('task')}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Task
                </button>
                <button
                  onClick={() => handleNavigateToCreate('project')}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Project
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Event Details Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 font-jura">Event Details</h3>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 font-jura">{selectedEvent.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {moment(selectedEvent.start).format('MMMM D, YYYY [at] h:mm A')}
                    </p>
                  </div>
                  
                  {selectedEvent.description && (
                    <div>
                      <h5 className="font-medium text-gray-700 font-jura">Description</h5>
                      <p className="text-sm text-gray-600 mt-1">{selectedEvent.description}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4">
                    {selectedEvent.priority && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityStyles(selectedEvent.priority)}`}>
                        {selectedEvent.priority}
                      </span>
                    )}
                    {selectedEvent.status && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(selectedEvent.status)}`}>
                        {selectedEvent.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    {selectedEvent.type === 'task' && (
                      <Link
                        href={`/tasks/${selectedEvent.originalData.id}/edit`}
                        className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 text-center"
                        style={{ backgroundColor: 'var(--primary-600, #007f6d)' }}
                      >
                        Edit Task
                      </Link>
                    )}
                    {selectedEvent.type === 'project' && (
                      <Link
                        href={`/projects/${selectedEvent.originalData.id}`}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 text-center"
                      >
                        View Project
                      </Link>
                    )}
                    <button
                      onClick={() => setSelectedEvent(null)}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
