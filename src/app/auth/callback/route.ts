import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error_description = searchParams.get('error_description')
  const error = searchParams.get('error')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const email = searchParams.get('email')
  const phone = searchParams.get('phone')

  console.log('Auth callback called with:', {
    code: code ? 'present' : 'missing',
    token_hash: token_hash ? 'present' : 'missing',
    type,
    error,
    error_description,
    next
  })

  // Handle explicit errors from Supabase
  if (error) {
    console.error('Auth callback error:', error, error_description)
    const errorUrl = `/auth/auth-code-error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(error_description || '')}`
    return NextResponse.redirect(`${new URL(request.url).origin}${errorUrl}`)
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Try code exchange first
  if (code) {
    console.log('Attempting to exchange code for session...')
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!exchangeError && data.session) {
      console.log('Session exchange successful, redirecting to:', next)
      return NextResponse.redirect(`${new URL(request.url).origin}${next}`)
    } else {
      console.error('Session exchange failed:', exchangeError)
    }
  }

  // Try token hash verification
  if (token_hash && type === 'email') {
    console.log('Attempting to verify OTP with token hash (email)...');
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token: token_hash,
      type: 'email',
      email: email || ''
    });
    if (!verifyError && data.session) {
      console.log('OTP verification successful, redirecting to:', next);
      return NextResponse.redirect(`${new URL(request.url).origin}${next}`);
    } else {
      console.error('OTP verification failed:', verifyError);
    }
  } else if (token_hash && type === 'sms') {
    console.log('Attempting to verify OTP with token hash (sms)...');
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token: token_hash,
      type: 'sms',
      phone: phone || ''
    });
    if (!verifyError && data.session) {
      console.log('OTP verification successful, redirecting to:', next);
      return NextResponse.redirect(`${new URL(request.url).origin}${next}`);
    } else {
      console.error('OTP verification failed:', verifyError);
    }
  } else if (token_hash) {
    console.error('Invalid OTP type:', type);
  }

  // If no auth parameters, just redirect to dashboard (maybe user is already logged in)
  console.log('No auth parameters found, redirecting to dashboard anyway')
  return NextResponse.redirect(`${new URL(request.url).origin}/dashboard`)
}
