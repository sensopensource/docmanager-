import { BrowserRouter, Routes, Route } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import HomePage from "./pages/HomePage"
import ProtectedRoute from "./components/ProtectedRoute"
import RegisterPage from "./pages/RegisterPage"
import CategoriesPage from "./pages/CategoriesPage"
import DocumentsPage from "./pages/DocumentsPage"
import ToastContainer from "./components/ToastContainer"
import { AuthProvider } from "./contexts/AuthContext"
import { ToastProvider } from "./contexts/ToastContext"
import { SearchProvider } from "./contexts/SearchContext"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <SearchProvider>
              <Routes>
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/home" element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                } />
                <Route path="/categories" element={
                  <ProtectedRoute>
                    <CategoriesPage />
                  </ProtectedRoute>
                } />
                <Route path="/documents" element={
                  <ProtectedRoute>
                    <DocumentsPage />
                  </ProtectedRoute>
                } />
              </Routes>
            </SearchProvider>
          </BrowserRouter>
          <ToastContainer />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App
