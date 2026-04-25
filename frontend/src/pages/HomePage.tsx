
import type { User } from "../types";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";


function HomePage() {
const {user,logout} = useAuth()




return (
    <div className="bg-black text-gray-100 p-8 items-center font-mono min-h-screen">
    <div>
        <h1 className="border border-gray-700">
            Bienvenu sur votre DocManager
        </h1>
        {user && <p className="uppercase text-xs">Connecte autant que {user.email}</p>}
        <button onClick={logout}>se deconnecter</button>
        <Link to="/Categories">Voir mes Categories</Link>
    </div>
    </div>
    
)
}

export default HomePage