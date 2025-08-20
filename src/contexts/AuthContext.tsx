'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // If user just signed up and confirmed email, ensure member record exists
      if (event === 'SIGNED_IN' && session?.user) {
        await ensureMemberExists(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Function to ensure member record exists for the user
  const ensureMemberExists = async (user: unknown) => {
    if (!user || typeof user !== 'object' || user === null) return;
    const u = user as { id: string; email?: string; isNewUser?: boolean; user_metadata?: { full_name?: string } };
    try {
      // Check if member already exists
        const { data: existingMember } = await supabase
          .from('members')
          .select('id')
          .eq('id', u.id)
          .single()

      // Only create member if not found and this is a sign up event
        if (!existingMember && u.isNewUser) {
          const { error } = await supabase
            .from('members')
            .insert({
              id: u.id,
              email: u.email,
              full_name: u.user_metadata?.full_name || null,
            role: 'user',
            is_active: true
          })

        if (error) {
          console.error('Error creating member record:', error, error?.message, error?.details, error?.hint)
        }
      }
    } catch (error) {
      console.error('Error ensuring member exists:', error)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    session,
    loading,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
