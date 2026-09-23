import { useEffect, useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import {
  BarChart3,
  Brain,
  BriefcaseBusiness,
  FileText,
  Home,
  LogOut,
  Map,
  Menu,
  Mic,
  Settings,
  Sparkles,
  X,
} from "lucide-react"
import api from "../lib/api"

const navigation = [
  { label: "Dashboard", path: "/dashboard", icon: Home },
  { label: "Resume", path: "/resume", icon: FileText },
  { label: "Skill gap", path: "/skills", icon: Brain },
  { label: "Roadmap", path: "/roadmap", icon: Map },
  { label: "Jobs", path: "/jobs", icon: BriefcaseBusiness },
  { label: "Interview", path: "/interview", icon: Mic },
  { label: "Settings", path: "/settings", icon: Settings },
]

function AppShell({ children, title, eyebrow, description }) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    api.get("/profile").then((response) => setProfile(response.data)).catch(() => {
      localStorage.removeItem("access_token")
      navigate("/")
    })
  }, [navigate])

  const logout = () => {
    localStorage.removeItem("access_token")
    navigate("/", { replace: true })
  }

  const sidebar = (
    <aside className="flex h-full w-72 flex-col rounded-[30px] bg-white/65 p-5 shadow-[0_20px_60px_rgba(79,70,229,0.10)] backdrop-blur-2xl">
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25"><Sparkles className="h-5 w-5 text-white" /></div>
        <div><p className="text-sm font-bold text-slate-800">AI Career</p><p className="text-xs text-slate-500">Placement Assistant</p></div>
      </div>
      <nav className="flex-1 space-y-1">
        {navigation.map(({ label, path, icon: Icon }) => (
          <NavLink key={path} to={path} onClick={() => setMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20" : "text-slate-500 hover:bg-white hover:text-indigo-600"}`}>
            <Icon className="h-5 w-5" />{label}
          </NavLink>
        ))}
      </nav>
      <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-4 text-white shadow-lg shadow-indigo-500/20"><BarChart3 className="mb-3 h-5 w-5" /><p className="text-sm font-semibold">Keep your momentum</p><p className="mt-1 text-xs leading-relaxed text-white/75">Small, focused improvements add up to a stronger application.</p></div>
      <button onClick={logout} className="mt-4 flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-500 transition hover:text-red-500"><LogOut className="h-5 w-5" />Log out</button>
    </aside>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef2ff] via-[#f8f7ff] to-[#e0f2fe] text-slate-800">
      <div className="fixed inset-0 pointer-events-none overflow-hidden"><div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-300/20 blur-3xl" /><div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-purple-300/20 blur-3xl" /></div>
      <div className="relative flex min-h-screen gap-0 lg:p-5">
        <div className="hidden lg:block">{sidebar}</div>
        {menuOpen && <div className="fixed inset-0 z-40 bg-slate-900/20 lg:hidden" onClick={() => setMenuOpen(false)} />}
        <div className={`fixed inset-y-0 left-0 z-50 p-4 transition-transform lg:hidden ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}><div className="relative h-full">{sidebar}<button onClick={() => setMenuOpen(false)} aria-label="Close navigation" className="absolute right-7 top-7 text-slate-400"><X className="h-5 w-5" /></button></div></div>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <header className="mb-8 flex items-start gap-4">
            <button onClick={() => setMenuOpen(true)} aria-label="Open navigation" className="mt-1 rounded-xl bg-white/70 p-2 text-slate-600 lg:hidden"><Menu className="h-5 w-5" /></button>
            <div><p className="text-sm font-semibold text-indigo-500">{eyebrow}</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>}</div>
            {profile && <div className="ml-auto hidden items-center gap-3 sm:flex"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 font-bold text-white">{profile.name?.[0]?.toUpperCase()}</div><div><p className="text-sm font-semibold text-slate-700">{profile.name}</p><p className="text-xs text-slate-400">{profile.degree || "Student"}</p></div></div>}
          </header>
          {children}
        </main>
      </div>
    </div>
  )
}

export default AppShell
