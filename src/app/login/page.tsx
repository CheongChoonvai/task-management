'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { CheckCircle, ArrowLeft, Shield, Zap, Users } from 'lucide-react'
import Link from 'next/link'
import CustomAuth from '@/components/CustomAuth'

export default function LoginPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center fade-in">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Back to Home */}
      <div className="absolute top-6 left-6 z-10">
        <Link
          href="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
      </div>

      <div className="min-h-screen flex">
        {/* Left Side - Authentication Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            {/* Header */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Task vai
                </span>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back
              </h2>
              <p className="text-gray-600">
                Sign in to your account to continue managing your tasks
              </p>
            </div>

            {/* Authentication Component */}
            <div className="card-elevated p-8 fade-in">
              <CustomAuth onSuccess={() => router.push('/dashboard')} />
            </div>
          </div>
        </div>

        {/* Right Side - Feature Showcase (Hidden on mobile) */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 to-indigo-700 items-center justify-center p-12">
          <div className="max-w-lg text-white">
            <h3 className="text-3xl font-bold mb-6">
              Join thousands of productive teams
            </h3>
            
            <div className="space-y-6">
              {[
                {
                  icon: CheckCircle,
                  title: "Smart Organization",
                  description: "Keep your tasks organized with priorities, deadlines, and custom categories."
                },
                {
                  icon: Zap,
                  title: "Lightning Fast",
                  description: "Built for speed with instant sync across all your devices."
                },
                {
                  icon: Users,
                  title: "Team Collaboration",
                  description: "Work together seamlessly with shared projects and real-time updates."
                }
              ].map((feature, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">{feature.title}</h4>
                    <p className="text-blue-100 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6">
              {[
                { number: "10K+", label: "Active Users" },
                { number: "1M+", label: "Tasks Completed" },
                { number: "99.9%", label: "Uptime" }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold">{stat.number}</div>
                  <div className="text-blue-200 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
