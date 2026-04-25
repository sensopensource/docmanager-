
import { useState,type FormEvent,type ChangeEvent} from "react"
import { useNavigate,Link} from "react-router-dom"
import type { LoginResponse } from "../types"
import { apiFetch } from "../api"
  
  


function LoginPage() {
  const navigate = useNavigate()
  const [email,setEmail] = useState<string>('')
  const [mdp,setMdp] = useState<string>('')
  const [logError,setLogError] = useState<string>('')
  
 
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault() // pour bloque le reload classique de la page html

    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', mdp)

    console.log('debug: ' ,formData.toString())

    const response = await apiFetch("/auth/login",{
      method: 'POST',
      body: formData
    })
    
    if (response.ok) {
    setLogError('')
    const data: LoginResponse = await response.json()
    localStorage.setItem('token',data.access_token)
    navigate("/home")
    } else { 
      setLogError('Erreur de connexion')
    }
  }



  return(
    <div className="min-h-screen bg-black text-gray-100 font-mono flex items-center justify-center px-11">
    <div className="w-full max-w-md">
    <div className="text-xs uppercase tracking-wider text-gray-500 mb-3">
      Access Drive
      <h1 className="text-3x1 font-semibold text-gray-300">welcome back</h1>
      </div>
    <form onSubmit={handleSubmit}
    className="bg-zinc-950 border border-zinc-800 p-7 space-y-4">
    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1.5">
      Email 
      <input 
        type="email"
        value={email}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        placeholder="email"
        autoComplete="off"
        className="w-full bg-black border border-zinc-800 text-gray-100 px-3 py-2 text-sm focus:outline-none focus:border-zinc-600"
        />
    </label>
    <label>
      Mot de passe
      <input
        type="password"
        value={mdp}
        onChange={(m: React.ChangeEvent<HTMLInputElement>) => setMdp(m.target.value)}
        placeholder="mot de passe"
        className="w-full bg-black border border-zinc-800 text-gray-100 px-3 py-2 text-sm focus:outline-none focus:border-zinc-600"
      />
    </label>

    <button type="submit"
    className="w-full bg-stone-200 text-stone-900 font-semibold py-2 text-sm hover:bg-stone-100 transition-colors">
      Se Logger
    </button>
    <br>
    </br>
    {logError && <p style={{color: 'red'}}>{logError}</p>}
    
    
    </form>
    <div className="mt-6 text-center text-sm text-gray-400">
      no account yet ?{' '}
      <Link to="/register" className="text-gray-200 hover:underline">
        set up your Drive 
      </Link>
    </div>
    </div>
    </div>
  )
}

export default LoginPage

  