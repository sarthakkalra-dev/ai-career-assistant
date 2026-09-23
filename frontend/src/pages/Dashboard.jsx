import { useEffect, useState } from "react"
import api from "../lib/api"

import {
  Home,
  FileText,
  Brain,
  Map,
  Briefcase,
  Mic,
  Settings,
  LogOut,
  Bell,
  ArrowUpRight,
  TrendingUp,
  Target,
  Award,
  ChevronRight,
  Sparkles,
  Search,
} from "lucide-react"

function Dashboard() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!localStorage.getItem("access_token")) {
          window.location.href = "/"
          return
        }

        const response = await api.get("/profile")

        setProfile(response.data)
      } catch (error) {
        console.error("Profile loading failed:", error)
        localStorage.removeItem("access_token")
        window.location.href = "/"
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    window.location.href = "/"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#eef2ff] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-500">
            Loading your career dashboard...
          </p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const menuItems = [
    {
      name: "Dashboard",
      icon: Home,
      active: true,
      path: "/dashboard",
    },
    {
      name: "Resume",
      icon: FileText,
      path: "/resume",
    },
    {
      name: "Skills",
      icon: Brain,
      path: "/skills",
    },
    {
      name: "Roadmap",
      icon: Map,
      path: "/roadmap",
    },
    {
      name: "Jobs",
      icon: Briefcase,
      path: "/jobs",
    },
    {
      name: "Interview",
      icon: Mic,
      path: "/interview",
    },
    {
      name: "Settings",
      icon: Settings,
      path: "/settings",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef2ff] via-[#f8f7ff] to-[#e0f2fe] text-slate-800">

      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl" />
      </div>

      <div className="relative flex min-h-screen">

        {/* SIDEBAR */}
        <aside className="hidden lg:flex w-72 p-5">

          <div className="w-full rounded-[30px] bg-white/55 backdrop-blur-2xl border border-white/70 shadow-[0_20px_60px_rgba(79,70,229,0.10)] p-5 flex flex-col">

            {/* Logo */}
            <div className="flex items-center gap-3 px-2 mb-10">

              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>

              <div>
                <h1 className="font-bold text-slate-800 text-sm">
                  AI Career
                </h1>
                <p className="text-xs text-slate-500">
                  Placement Assistant
                </p>
              </div>

            </div>

            {/* Navigation */}
            <nav className="space-y-2 flex-1">

              {menuItems.map((item) => {
                const Icon = item.icon

                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      if (item.path) {
                        window.location.href = item.path
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                      item.active
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20"
                        : "text-slate-500 hover:bg-white/70 hover:text-indigo-600"
                    }`}
                  >
                    <Icon className="w-5 h-5" />

                    <span className="text-sm font-medium">
                      {item.name}
                    </span>

                    {item.active && (
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    )}
                  </button>
                )
              })}

            </nav>

            {/* Upgrade Card */}
            <div className="rounded-2xl bg-gradient-to-br from-indigo-500/90 to-purple-600/90 p-4 text-white shadow-lg shadow-indigo-500/20">

              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                <Sparkles className="w-4 h-4" />
              </div>

              <p className="text-sm font-semibold">
                AI Career Coach
              </p>

              <p className="text-xs text-white/75 mt-1 leading-relaxed">
                Improve your skills and prepare for your dream job.
              </p>

              <button className="mt-4 w-full py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-medium transition">
                Explore AI Tools
              </button>

            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="mt-4 flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-500 transition"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">
                Logout
              </span>
            </button>

          </div>

        </aside>

        {/* MAIN */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">

          {/* Top Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8">

            <div>
              <p className="text-sm text-slate-500 mb-1">
                Good evening,
              </p>

              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-800">
                {profile.name}
              </h2>

              <p className="text-sm text-slate-500 mt-2">
                Let's build your career together.
              </p>
            </div>

            <div className="flex items-center gap-3">

              {/* Search */}
              <button className="hidden sm:flex w-11 h-11 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/80 items-center justify-center text-slate-500 hover:text-indigo-600 shadow-sm">
                <Search className="w-5 h-5" />
              </button>

              {/* Notification */}
              <button className="relative w-11 h-11 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/80 flex items-center justify-center text-slate-500 hover:text-indigo-600 shadow-sm">
                <Bell className="w-5 h-5" />

                <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full" />
              </button>

              {/* Profile */}
              <div className="flex items-center gap-3 pl-2">

                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
                  {profile.name?.charAt(0)?.toUpperCase()}
                </div>

                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-slate-700">
                    {profile.name}
                  </p>

                  <p className="text-xs text-slate-400">
                    {profile.degree || "Student"}
                  </p>
                </div>

              </div>

            </div>

          </header>

          {/* Mobile Navigation */}
          <div className="lg:hidden mb-6 overflow-x-auto">
            <div className="flex gap-2 min-w-max">

              {menuItems.map((item) => {
                const Icon = item.icon

                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      if (item.path) {
                        window.location.href = item.path
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm ${
                      item.active
                        ? "bg-indigo-500 text-white"
                        : "bg-white/60 text-slate-500"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </button>
                )
              })}

            </div>
          </div>

          {/* Profile Glass Card */}
          <section className="relative overflow-hidden rounded-[30px] bg-white/55 backdrop-blur-2xl border border-white/80 shadow-[0_20px_60px_rgba(79,70,229,0.10)] p-6 sm:p-8 mb-6">

            <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-indigo-300/20 blur-3xl" />

            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">

              <div className="flex items-center gap-5">

                <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-indigo-500/20">
                  {profile.name?.charAt(0)?.toUpperCase()}
                </div>

                <div>
                  <p className="text-sm text-indigo-500 font-medium mb-1">
                    Your Career Profile
                  </p>

                  <h3 className="text-2xl font-bold text-slate-800">
                    {profile.name}
                  </h3>

                  <p className="text-sm text-slate-500 mt-1">
                    {profile.degree || "B.Tech CSE"}
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    {profile.college || "JC Bose University of Science and Technology"}
                  </p>
                </div>

              </div>

              <button
                onClick={() => {
                  window.location.href = "/settings"
                }}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/70 border border-white text-sm font-semibold text-slate-600 hover:bg-white transition shadow-sm"
              >
                View Profile
                <ArrowUpRight className="w-4 h-4" />
              </button>

            </div>

          </section>

          {/* STAT CARDS */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">

            {/* Resume */}
            <div className="group rounded-[26px] bg-white/55 backdrop-blur-2xl border border-white/80 p-5 shadow-[0_15px_45px_rgba(79,70,229,0.08)] hover:-translate-y-1 transition-all duration-300">

              <div className="flex items-start justify-between">

                <div className="w-11 h-11 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <FileText className="w-5 h-5" />
                </div>

                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-500">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +8%
                </span>

              </div>

              <p className="text-sm text-slate-500 mt-5">
                Resume Score
              </p>

              <div className="flex items-end gap-2 mt-1">
                <span className="text-3xl font-bold text-slate-800">
                  86
                </span>
                <span className="text-sm text-slate-400 mb-1">
                  /100
                </span>
              </div>

              <div className="h-2 bg-slate-200/70 rounded-full mt-4 overflow-hidden">
                <div className="h-full w-[86%] bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
              </div>

            </div>

            {/* Skills */}
            <div className="group rounded-[26px] bg-white/55 backdrop-blur-2xl border border-white/80 p-5 shadow-[0_15px_45px_rgba(79,70,229,0.08)] hover:-translate-y-1 transition-all duration-300">

              <div className="flex items-start justify-between">

                <div className="w-11 h-11 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                  <Brain className="w-5 h-5" />
                </div>

                <span className="text-xs font-semibold text-slate-400">
                  Growing
                </span>

              </div>

              <p className="text-sm text-slate-500 mt-5">
                Skill Readiness
              </p>

              <div className="flex items-end gap-2 mt-1">
                <span className="text-3xl font-bold text-slate-800">
                  72
                </span>
                <span className="text-sm text-slate-400 mb-1">
                  %
                </span>
              </div>

              <div className="h-2 bg-slate-200/70 rounded-full mt-4 overflow-hidden">
                <div className="h-full w-[72%] bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
              </div>

            </div>

            {/* Interview */}
            <div className="group rounded-[26px] bg-white/55 backdrop-blur-2xl border border-white/80 p-5 shadow-[0_15px_45px_rgba(79,70,229,0.08)] hover:-translate-y-1 transition-all duration-300">

              <div className="flex items-start justify-between">

                <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <Mic className="w-5 h-5" />
                </div>

                <span className="text-xs font-semibold text-emerald-500">
                  Excellent
                </span>

              </div>

              <p className="text-sm text-slate-500 mt-5">
                Interview Score
              </p>

              <div className="flex items-end gap-2 mt-1">
                <span className="text-3xl font-bold text-slate-800">
                  8
                </span>
                <span className="text-sm text-slate-400 mb-1">
                  /10
                </span>
              </div>

              <div className="h-2 bg-slate-200/70 rounded-full mt-4 overflow-hidden">
                <div className="h-full w-[80%] bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" />
              </div>

            </div>

            {/* Goal */}
            <div className="group rounded-[26px] bg-white/55 backdrop-blur-2xl border border-white/80 p-5 shadow-[0_15px_45px_rgba(79,70,229,0.08)] hover:-translate-y-1 transition-all duration-300">

              <div className="flex items-start justify-between">

                <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Target className="w-5 h-5" />
                </div>

                <Award className="w-5 h-5 text-amber-400" />

              </div>

              <p className="text-sm text-slate-500 mt-5">
                Career Goal
              </p>

              <p className="text-lg font-bold text-slate-800 mt-1">
                Full Stack Developer
              </p>

              <p className="text-xs text-slate-400 mt-2">
                68% journey completed
              </p>

            </div>

          </section>

          {/* LOWER CONTENT */}
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* ROADMAP */}
            <div className="xl:col-span-2 rounded-[30px] bg-white/55 backdrop-blur-2xl border border-white/80 shadow-[0_20px_60px_rgba(79,70,229,0.08)] p-6 sm:p-7">

              <div className="flex items-center justify-between mb-7">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
                    Your journey
                  </p>

                  <h3 className="text-xl font-bold text-slate-800 mt-1">
                    Career Roadmap
                  </h3>
                </div>

                <button
                  onClick={() => {
                    window.location.href = "/roadmap"
                  }}
                  className="text-sm font-semibold text-indigo-600 flex items-center gap-1 hover:gap-2 transition-all"
                >
                  View all
                  <ArrowUpRight className="w-4 h-4" />
                </button>

              </div>

              <div className="relative">

                {/* Timeline line */}
                <div className="absolute left-[17px] top-3 bottom-3 w-px bg-gradient-to-b from-indigo-400 via-purple-300 to-slate-200" />

                <div className="space-y-7">

                  {/* Step 1 */}
                  <div className="relative flex gap-5">

                    <div className="relative z-10 w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                      <span className="w-2 h-2 bg-white rounded-full" />
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-slate-800">
                            Resume Optimization
                          </h4>
                          <p className="text-xs text-slate-400 mt-1">
                            Improve your resume with AI suggestions
                          </p>
                        </div>

                        <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-600 font-semibold w-fit">
                          Completed
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Step 2 */}
                  <div className="relative flex gap-5">

                    <div className="relative z-10 w-9 h-9 rounded-full bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                      <span className="w-2 h-2 bg-white rounded-full" />
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-slate-800">
                            Skill Development
                          </h4>
                          <p className="text-xs text-slate-400 mt-1">
                            Build skills required for your target role
                          </p>
                        </div>

                        <span className="text-xs px-3 py-1.5 rounded-full bg-purple-100 text-purple-600 font-semibold w-fit">
                          In Progress
                        </span>
                      </div>

                      <div className="mt-3 h-1.5 bg-slate-200/70 rounded-full max-w-md">
                        <div className="h-full w-[72%] bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" />
                      </div>

                    </div>

                  </div>

                  {/* Step 3 */}
                  <div className="relative flex gap-5">

                    <div className="relative z-10 w-9 h-9 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
                      <span className="w-2 h-2 bg-slate-300 rounded-full" />
                    </div>

                    <div className="flex-1">

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">

                        <div>
                          <h4 className="font-semibold text-slate-500">
                            Mock Interview
                          </h4>

                          <p className="text-xs text-slate-400 mt-1">
                            Practice real interview questions with AI
                          </p>
                        </div>

                        <span className="text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 font-semibold w-fit">
                          Upcoming
                        </span>

                      </div>

                    </div>

                  </div>

                  {/* Step 4 */}
                  <div className="relative flex gap-5">

                    <div className="relative z-10 w-9 h-9 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
                      <span className="w-2 h-2 bg-slate-300 rounded-full" />
                    </div>

                    <div className="flex-1">

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">

                        <div>
                          <h4 className="font-semibold text-slate-500">
                            Job Applications
                          </h4>

                          <p className="text-xs text-slate-400 mt-1">
                            Apply to jobs matched with your profile
                          </p>
                        </div>

                        <span className="text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 font-semibold w-fit">
                          Upcoming
                        </span>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </div>

            {/* JOBS */}
            <div className="rounded-[30px] bg-white/55 backdrop-blur-2xl border border-white/80 shadow-[0_20px_60px_rgba(79,70,229,0.08)] p-6">

              <div className="flex items-center justify-between mb-6">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-purple-500">
                    AI matched
                  </p>

                  <h3 className="text-xl font-bold text-slate-800 mt-1">
                    Recommended Jobs
                  </h3>
                </div>

                <Briefcase className="w-5 h-5 text-indigo-500" />

              </div>

              <div className="space-y-4">

                {/* Job 1 */}
                <div className="group p-4 rounded-2xl bg-white/65 border border-white/80 hover:bg-white hover:shadow-lg hover:shadow-indigo-500/5 transition-all cursor-pointer">

                  <div className="flex items-start gap-3">

                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                      T
                    </div>

                    <div className="flex-1 min-w-0">

                      <h4 className="font-semibold text-sm text-slate-800">
                        Frontend Developer
                      </h4>

                      <p className="text-xs text-slate-400 mt-1">
                        Tech Company
                      </p>

                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-[11px] px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600">
                          React
                        </span>

                        <span className="text-[11px] px-2 py-1 rounded-lg bg-purple-50 text-purple-600">
                          JavaScript
                        </span>
                      </div>

                    </div>

                    <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition" />

                  </div>

                </div>

                {/* Job 2 */}
                <div className="group p-4 rounded-2xl bg-white/65 border border-white/80 hover:bg-white hover:shadow-lg hover:shadow-indigo-500/5 transition-all cursor-pointer">

                  <div className="flex items-start gap-3">

                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                      D
                    </div>

                    <div className="flex-1 min-w-0">

                      <h4 className="font-semibold text-sm text-slate-800">
                        Python Developer
                      </h4>

                      <p className="text-xs text-slate-400 mt-1">
                        Software Solutions
                      </p>

                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-[11px] px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600">
                          Python
                        </span>

                        <span className="text-[11px] px-2 py-1 rounded-lg bg-blue-50 text-blue-600">
                          FastAPI
                        </span>
                      </div>

                    </div>

                    <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition" />

                  </div>

                </div>

                {/* Job 3 */}
                <div className="group p-4 rounded-2xl bg-white/65 border border-white/80 hover:bg-white hover:shadow-lg hover:shadow-indigo-500/5 transition-all cursor-pointer">

                  <div className="flex items-start gap-3">

                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                      W
                    </div>

                    <div className="flex-1 min-w-0">

                      <h4 className="font-semibold text-sm text-slate-800">
                        Full Stack Intern
                      </h4>

                      <p className="text-xs text-slate-400 mt-1">
                        Web Technologies
                      </p>

                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-[11px] px-2 py-1 rounded-lg bg-orange-50 text-orange-600">
                          Full Stack
                        </span>

                        <span className="text-[11px] px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600">
                          SQL
                        </span>
                      </div>

                    </div>

                    <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition" />

                  </div>

                </div>

              </div>

              <button
                onClick={() => {
                  window.location.href = "/jobs"
                }}
                className="w-full mt-5 py-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-sm font-semibold transition"
              >
                Explore all jobs
              </button>

            </div>

          </section>

        </main>

      </div>

    </div>
  )
}

export default Dashboard