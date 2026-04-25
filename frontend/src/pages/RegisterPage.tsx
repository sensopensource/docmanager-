import React, { useState, type FormEvent } from "react"
import type { Token } from "../types"
import { useNavigate } from "react-router-dom"


function RegisterPage() {

const [nom,setNom] = useState<string>('')
const [email,setEmail] = useState<string>('')
const [mdp,setMdp] = useState<string>('')
const [mdp2,setMdp2] = useState<string>('')


const navigate = useNavigate()

const [errorLog1,seterrorLog1] = useState<string | null>(null)

const handleSubmit = async (e:FormEvent) => {
    e.preventDefault()

    if (mdp2 === mdp) {
      
      const payload = {'email': email,'password': mdp,'nom':nom}
      
      const response = await fetch("http://localhost:8000/auth/register", {
      method: 'POST',
      headers: {'Content-type': 'application/json'},
      body: JSON.stringify(payload) }) 
      
      const data: Token = await response.json()

      if (response.ok) {
        localStorage.setItem('token',data.access_token)
        navigate("/home")
      }
      else {seterrorLog1('compte existe deja')}
    }
    else {seterrorLog1('Verifier les 2 mdps')}
    
}




    
return (
        <div>
            <form onSubmit={handleSubmit}>
                <label>
                  Nom
                  <input type="text"
                         placeholder="votre nom"
                         value={nom}
                         onChange={(n: React.ChangeEvent<HTMLInputElement>) => setNom(n.target.value)}/>
                 </label>
                 <label>
                    Email
                    <input type="email"
                           placeholder="votre email"
                           value={email}
                           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}/>
                 </label>
                 <label>
                    Mot de passe
                    <input type="password"
                           placeholder="votre mot de passe"
                           value={mdp}
                           onChange={(m: React.ChangeEvent<HTMLInputElement>) => setMdp(m.target.value)}/>
                 </label>
                 <label>
                    Confirmer
                    <input type="password"
                           placeholder="confirmer votre mot de passe"
                           value={mdp2}
                           onChange={(m2: React.ChangeEvent<HTMLInputElement>) => setMdp2(m2.target.value)}/>
                 </label>
                 <label>
                    s'enregistrer
                    <button type="submit">
                        Creer un compte
                    </button>
                 </label>
            </form>
            {errorLog1 && <p style={{color: 'red'}}>{errorLog1}</p>}
        </div>
    )
}
export default RegisterPage