

const API_URL = "http://localhost:8000"

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token')

  // On construit les headers step by step
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>)
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  })

  if (response.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  return response
}

