'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { CheckCircle, Clock, Users, Zap, BarChart3, Shield, ArrowRight, Star } from 'lucide-react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center fade-in">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation Header */}
      <nav className="relative z-10 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Task Vai
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#benefits" className="text-gray-600 hover:text-gray-900 transition-colors">Benefits</a>
              <Link
                href="/login"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - F-Pattern: Strong horizontal line at top */}
      <section className="relative overflow-hidden pt-16 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Main content (F-pattern left column) */}
            <div className="slide-up">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Organize your
                <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  tasks like a pro
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Streamline your workflow with our intuitive task management platform. 
                Create, organize, and track your progress with ease.
              </p>
              
              {/* CTA Buttons - F-pattern: Important action items */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  href="/login"
                  className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 hover:shadow-xl flex items-center justify-center"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
            
            {/* Right side - Visual (F-pattern right side) */}
            <div className="relative">
              <div className="relative z-10 bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Mock Dashboard Preview */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">My Dashboard</h3>
                    <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  {/* Mock task items */}
                  {[
                    { title: "Design system review", status: "completed", priority: "high" },
                    { title: "Client presentation", status: "in_progress", priority: "medium" },
                    { title: "Team standup meeting", status: "todo", priority: "low" },
                  ].map((task, i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-4 h-4 rounded-full ${
                        task.status === 'completed' ? 'bg-green-500' :
                        task.status === 'in_progress' ? 'bg-yellow-500' : 'bg-gray-300'
                      }`}></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{task.title}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-20 animate-pulse delay-1000"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - F-pattern: Secondary horizontal scan */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to stay organized
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed to help you manage tasks efficiently and boost your productivity.
            </p>
          </div>
          
          {/* Feature Grid - 8pt Grid System */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: CheckCircle,
                title: "Smart Task Management",
                description: "Create, organize, and prioritize tasks with our intuitive interface."
              },
              {
                icon: Clock,
                title: "Deadline Tracking",
                description: "Never miss a deadline with smart reminders and calendar integration."
              },
              {
                icon: Users,
                title: "Team Collaboration",
                description: "Work together seamlessly with shared workspaces and real-time updates."
              },
              {
                icon: BarChart3,
                title: "Progress Analytics",
                description: "Track your productivity with detailed insights and progress reports."
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Built with modern technology for instant loading and smooth interactions."
              },
              {
                icon: Shield,
                title: "Secure & Private",
                description: "Your data is protected with enterprise-grade security and encryption."
              }
            ].map((feature, i) => (
              <div key={i} className="card p-8 hover:shadow-lg transition-all duration-200 group">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section - F-pattern: Third horizontal scan */}
      <section id="benefits" className="py-24 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Boost your productivity by 3x
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                  Join thousands of professionals who have transformed their workflow with Task Vai.
              </p>
              
              <div className="space-y-6">
                {[
                  { metric: "150%", label: "Increase in task completion" },
                  { metric: "2.5hrs", label: "Time saved per day" },
                  { metric: "95%", label: "User satisfaction rate" }
                ].map((stat, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{stat.metric}</span>
                    </div>
                    <span className="text-gray-700 font-medium">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="space-y-4">
                  <div className="h-4 bg-gradient-to-r from-green-500 to-green-600 rounded-full w-3/4"></div>
                  <div className="h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full w-1/2"></div>
                  <div className="h-4 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full w-5/6"></div>
                  <div className="h-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Task Vai</span>
              </div>
              <p className="text-gray-400">
                The modern way to manage your tasks and boost productivity.
              </p>
            </div>
            
            {[
              {
                title: "Product",
                links: ["Features", "Pricing", "Security", "Integrations"]
              },
              {
                title: "Company", 
                links: ["About", "Blog", "Careers", "Contact"]
              },
              {
                title: "Support",
                links: ["Help Center", "Documentation", "API", "Status"]
              }
            ].map((section, i) => (
              <div key={i}>
                <h3 className="font-semibold mb-4">{section.title}</h3>
                <ul className="space-y-2">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="text-gray-400 hover:text-white transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Task Vai. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
