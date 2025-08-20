'use client'

import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function AuthCodeErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error')
  const description = searchParams?.get('description')

  return (
  <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                TaskFlow
              </span>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Authentication Error
            </h2>
            <p className="text-gray-600">
              There was a problem with your authentication link
            </p>
          </div>

          {/* Error Details */}
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-800 mb-2">
                  {error ? `Authentication Error: ${error}` : 'Link Invalid or Expired'}
                </h3>
                <p className="text-sm text-red-700 mb-4">
                  {description ? description : 'The authentication link you clicked is either invalid, expired, or has already been used.'}
                </p>
                
                {!error && (
                  <div className="text-sm text-red-700">
                    <p className="font-medium mb-2">Possible reasons:</p>
                    <ul className="list-disc list-inside space-y-1 text-red-600">
                      <li>The link has expired (links are valid for limited time)</li>
                      <li>The link has already been used</li>
                      <li>The link was copied incorrectly</li>
                      <li>There was a network issue during authentication</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <div className="grid gap-3">
              <Link
                href="/login"
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 px-4 rounded-xl hover:from-primary-700 hover:to-primary-800 font-semibold transition-all duration-200 transform hover:scale-105 hover:shadow-lg text-center"
              >
                Try Signing In Again
              </Link>
              
              <Link
                href="/auth/forgot-password"
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 font-medium transition-colors text-center"
              >
                Request New Password Reset
              </Link>
            </div>
          </div>

          {/* Help */}
          <div className="bg-primary-50 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-primary-900 mb-2">Need Help?</h3>
            <div className="text-sm text-primary-800 space-y-2">
              <p>If you continue to experience issues:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Check your email for the most recent authentication link</li>
                <li>Make sure you&apos;re clicking the link from the same device/browser</li>
                <li>Try clearing your browser cache and cookies</li>
                <li>Request a new authentication email</li>
              </ul>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
