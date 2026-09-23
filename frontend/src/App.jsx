import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/DashboardOverview"
import Resume from "./pages/Resume"
import Skills from "./pages/Skills"
import Roadmap from "./pages/Roadmap"
import Jobs from "./pages/Jobs"
import Interview from "./pages/Interview"
import Settings from "./pages/Settings"

function ProtectedRoute({ children }) {
  return localStorage.getItem("access_token") ? children : <Navigate to="/" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/dashboard"
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
        />

        <Route
          path="/resume"
          element={<ProtectedRoute><Resume /></ProtectedRoute>}
        />

        <Route path="/skills" element={<ProtectedRoute><Skills /></ProtectedRoute>} />
        <Route path="/roadmap" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
        <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
        <Route path="/interview" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App