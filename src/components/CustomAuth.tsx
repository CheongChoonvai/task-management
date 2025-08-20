'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Mail, Lock, Loader, User } from 'lucide-react'

interface CustomAuthProps {
  onSuccess?: () => void
}

export default function CustomAuth({ onSuccess }: CustomAuthProps) {
  const [view, setView] = useState<'sign_in' | 'sign_up'>('sign_in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [autoSwitched, setAutoSwitched] = useState(false)


  // Simple email change handler
  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail)
    // Clear any previous error messages when user changes email
    if (message.toLowerCase().includes('invalid')) {
      setMessage('')
    }
  }

  // Basic email validation
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  const resendConfirmation = async () => {
    if (!email) {
      setMessage('Please enter your email address first.');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/dashboard')}`
        }
      });
      
      if (error) {
        setMessage(`Error resending email: ${error.message}`);
      } else {
        setMessage('Confirmation email sent! Please check your email (including spam folder).');
      }
  } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('An error occurred');
      }
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Basic email validation before submitting
    if (!isValidEmail(email)) {
      setMessage('Please enter a valid email address. Make sure it contains @ and a domain (e.g., user@example.com).');
      setLoading(false);
      return;
    }

    try {
      if (view === 'sign_in') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        setMessage('Sign in successful!')
      } else {
        // Clean signup process
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/dashboard')}`,
            data: {
              full_name: fullName || null
            }
          }
        });
        
        if (error) {
          if (error.message.toLowerCase().includes('user already registered')) {
            setMessage('An account with this email already exists. Please sign in or use the "Resend Confirmation Email" button if you haven\'t confirmed your email yet.');
          } else {
            setMessage(`Signup failed: ${error.message}`);
          }
        } else {
          setMessage('Account created successfully! Please check your email to confirm your account.');
          setView('sign_in');
        }
      }
  } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage('An error occurred');
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex bg-gray-100 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => setView('sign_in')}
          className={`flex-1 py-2 px-4 text-sm font-jura rounded-md transition-all ${
            view === 'sign_in'
              ? 'bg-surface text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          style={view === 'sign_in' ? { color: 'var(--primary-600, #007f6d)', fontFamily: 'Jura, sans-serif' } : { fontFamily: 'Jura, sans-serif' }}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setView('sign_up')}
          className={`flex-1 py-2 px-4 text-sm font-jura rounded-md transition-all ${
            view === 'sign_up'
              ? 'bg-surface text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          style={view === 'sign_up' ? { color: 'var(--primary-600, #007f6d)', fontFamily: 'Jura, sans-serif' } : { fontFamily: 'Jura, sans-serif' }}
        >
          Sign Up
        </button>
      </div>



      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            <span className="font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>Email address</span>
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              placeholder="Your email address"
              required
              disabled={loading}
            />
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            {isCheckingEmail && (
              <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-500 w-5 h-5 animate-spin" />
            )}
          </div>
        </div>

        {/* Full Name Field - Only for Sign Up */}
        {view === 'sign_up' && (
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
              <span className="font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>Full Name</span>
            </label>
            <div className="relative">
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                placeholder="Your full name"
                disabled={loading}
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>
        )}

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            <span className="font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>{view === 'sign_in' ? 'Password' : 'Create a password'}</span>
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pl-11 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              placeholder={view === 'sign_in' ? 'Your password' : 'Choose a secure password'}
              required
              disabled={loading}
              minLength={view === 'sign_up' ? 6 : undefined}
            />
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {view === 'sign_up' && (
            <p className="mt-1 text-xs text-gray-500">
              Password must be at least 6 characters long
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 px-4 rounded-lg font-jura transition-all duration-200 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transform hover:-translate-y-0.5"
          style={{ fontFamily: 'Jura, sans-serif', background: 'linear-gradient(to right, var(--primary-600, #007f6d), var(--primary-700, #006557))' }}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <Loader className="w-5 h-5 mr-2 animate-spin" />
              {view === 'sign_in' ? 'Signing in...' : 'Creating account...'}
            </div>
          ) : (
            view === 'sign_in' ? 'Sign in' : 'Create account'
          )}
        </button>
      </form>

      {/* Forgot Password Link */}
      {view === 'sign_in' && (
        <div className="text-center">
          <a
            href="/auth/forgot-password"
            className="text-sm text-primary-600 hover:text-primary-800 font-jura transition-colors"
            style={{ color: 'var(--primary-600, #007f6d)', fontFamily: 'Jura, sans-serif' }}
          >
            Forgot your password?
          </a>
        </div>
      )}

      {/* Messages */}
      {message && !autoSwitched && (
        <div className={`p-3 rounded-lg ${
          message.includes('successful') || message.includes('created')
            ? 'bg-green-50 text-green-800 border border-green-200 font-jura'
            : 'bg-red-50 text-red-800 border border-red-200 font-jura'
        }`}>
          <p className="text-sm font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>{message}</p>
          {/* Show resend button for confirmation-related messages */}
          {(message.includes('check your email') || message.includes('already exists')) && (
            <button
              type="button"
              onClick={resendConfirmation}
              disabled={loading}
              className="mt-2 text-xs bg-primary-600 text-white px-3 py-1 rounded font-jura hover:bg-primary-700 disabled:opacity-50"
              style={{ backgroundColor: 'var(--primary-600, #007f6d)', fontFamily: 'Jura, sans-serif' }}
            >
              {loading ? 'Sending...' : 'Resend Confirmation Email'}
            </button>
          )}
        </div>
      )}

      {/* Helper Text */}
      <div className="text-center text-sm text-gray-600">
        {view === 'sign_in' ? (
          <p className="font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => setView('sign_up')}
              className="text-primary-600 hover:text-primary-800 font-jura transition-colors"
              style={{ color: 'var(--primary-600, #007f6d)', fontFamily: 'Jura, sans-serif' }}
            >
              Sign up
            </button>
          </p>
        ) : (
          <p className="font-jura" style={{ fontFamily: 'Jura, sans-serif' }}>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => setView('sign_in')}
              className="text-primary-600 hover:text-primary-800 font-jura transition-colors"
              style={{ color: 'var(--primary-600, #007f6d)', fontFamily: 'Jura, sans-serif' }}
            >
              Sign in
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
