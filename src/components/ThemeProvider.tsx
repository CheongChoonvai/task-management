"use client"

import { useEffect, useState } from "react"

type Theme = "light" | "dark"

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme | null>(null)

  useEffect(() => {
    // read saved theme or system preference
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') as Theme | null : null
    if (saved) {
      setTheme(saved)
      document.documentElement.setAttribute('data-theme', saved)
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      const initial = prefersDark ? 'dark' : 'light'
      setTheme(initial)
      document.documentElement.setAttribute('data-theme', initial)
    }
  }, [])

  useEffect(() => {
    if (!theme) return
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  // expose a simple API via window for quick toggling in dev (optional)
  useEffect(() => {
    // @ts-ignore
    window.__setTheme = (t: Theme) => setTheme(t)
  }, [])

  return <>{children}</>
}
