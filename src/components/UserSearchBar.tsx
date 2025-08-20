import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  full_name?: string
}

interface UserSearchBarProps {
  onSelectUser?: (user: User) => void
}

export default function UserSearchBar({ onSelectUser }: UserSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const trimmed = searchTerm.trim()
    if (!trimmed) {
      setSearchResults([])
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    const search = setTimeout(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .or(`email.ilike.%${trimmed}%,full_name.ilike.%${trimmed}%`)
      if (error) {
        setError('Error searching users')
        setSearchResults([])
      } else {
        setSearchResults(data || [])
      }
      setLoading(false)
    }, 400)
    return () => clearTimeout(search)
  }, [searchTerm])

  return (
    <div className="w-full max-w-md mx-auto">
      <input
        type="text"
  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        placeholder="Search users by name or email..."
      />
      {loading && <div className="mt-2 text-sm text-gray-500">Searching...</div>}
      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
      {searchResults.length > 0 && (
  <ul className="mt-2 bg-surface border border-gray-200 rounded-xl max-h-60 overflow-y-auto shadow">
          {searchResults.map(u => (
            <li key={u.id} className="flex items-center justify-between px-3 py-2 hover:bg-primary-50">
              <span>{u.full_name || u.email}</span>
              {onSelectUser && (
                <button
                  type="button"
                  className="text-primary-600 hover:text-primary-800 text-xs font-medium"
                  onClick={() => onSelectUser(u)}
                >Select</button>
              )}
            </li>
          ))}
        </ul>
      )}
      {searchTerm && !loading && searchResults.length === 0 && !error && (
        <div className="mt-2 text-sm text-gray-500">No users found.</div>
      )}
    </div>
  )
}
