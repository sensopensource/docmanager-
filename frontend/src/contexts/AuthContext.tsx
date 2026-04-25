import { createContext, useState, useEffect, useContext, type ReactNode } from "react"
import { apiFetch } from "../api"
import type { User } from "../types"

// 1. Le type de ce qu'on va partager
type AuthContextType = {
  user: User | null
  logout: () => void
}

// 2. Le contexte (valeur par défaut = null au cas ou un composant lit sans Provider)
const AuthContext = createContext<AuthContextType | null>(null)

// 3. Le Provider — composant à mettre autour de l'app
type ProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: ProviderProps) {
  const [user, setUser] = useState<User | null>(null)

  // Fetch user au chargement si token présent
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token')
      if (!token) return   // pas connecté, on ne fetch pas

      const response = await apiFetch("/auth/me")
      if (response.ok) {
        const data: User = await response.json()
        setUser(data)
      }
    }
    fetchUser()
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// 4. Hook custom pour consommer le contexte plus facilement
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider")
  }
  return context
}
