import { BrowserRouter,Routes,Route } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import HomePage from "./pages/HomePage"
import ProtectedRoute from "./components/ProtectedRoute"
import RegisterPage from "./pages/RegisterPage"
import CategoriesPage from "./pages/CategoriesPage"
import { AuthProvider } from "./contexts/AuthContext"
import { QueryClient,QueryClientProvider } from "@tanstack/react-query"

const queryClient = new QueryClient

function App() {

  return (
    <QueryClientProvider client={queryClient}>
     <AuthProvider>
       <BrowserRouter>
          <Routes>
            <Route path="/register" element={<RegisterPage/>}/>
            <Route path="/login" element={<LoginPage/>}/>
            <Route path="/home" element={<ProtectedRoute>
                                        <HomePage/>
                                     </ProtectedRoute>}/>
            <Route path="/Categories" element={<ProtectedRoute>
                                              <CategoriesPage/>
                                          </ProtectedRoute>}/>
        
          </Routes>
        </BrowserRouter>
      </AuthProvider>
   </QueryClientProvider> 
  )
}

export default App