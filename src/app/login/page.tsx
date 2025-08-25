'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { CheckCircle, ArrowLeft, Zap, Users } from 'lucide-react'
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
  <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <div className="text-center fade-in">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
  <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 font-jura">

      <div className="min-h-screen flex">
        {/* Left Side - Authentication Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            {/* Header */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
     style={{ backgroundColor: 'var(--primary-600, #007f6d)' }}>
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <span className="font-jura text-3xl font-bold" style={{ color: 'var(--primary-500, #008774)', fontFamily: 'Jura, sans-serif' }}>
                  Task vai
                </span>
              </div>
              
              <h2 className="font-jura text-3xl font-bold text-primary-600 mb-2">
                Welcome back
              </h2>
              <p className="font-jura text-primary-600">
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
  <div className="hidden lg:flex flex-1 items-center justify-center p-12"
     style={{ backgroundColor: 'var(--primary-600, #007f6d)' }}>
          <div className="max-w-lg text-white">
            <h3 className="font-jura text-3xl font-bold mb-6 text-primary-600">
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
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
     style={{ backgroundColor: 'var(--primary-400, #009883)' }}>
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-jura font-semibold mb-2 text-primary-600">{feature.title}</h4>
                    <p className="font-jura text-primary-600 text-sm leading-relaxed">{feature.description}</p>
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
                  <div className="font-jura text-2xl font-bold text-primary-600">{stat.number}</div>
                  <div className="font-jura text-primary-600 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

{/* <button
  className="w-full py-3 px-6 rounded-lg font-semibold text-white shadow-lg focus:outline-none transition-all duration-200 font-jura"
  style={{ backgroundColor: 'var(--primary-500, #008774)' }}
>
  Sign In
</button>

<a className="font-jura text-primary-500 hover:underline">Forgot your password?</a>

<a className="font-jura text-primary-500 hover:underline">Don't have an account? Sign up</a>

<button
  className="w-full py-3 px-6 rounded-lg font-semibold text-white shadow-lg focus:outline-none transition-all duration-200 font-jura"
  style={{ backgroundColor: 'var(--primary-500, #008774)' }}
>
  Create account
</button>

<div className="font-jura text-red-600 font-semibold mt-2">Signup failed: Database error saving new user</div>

<a className="font-jura text-primary-500 hover:underline">Already have an account? Sign in</a> */}
