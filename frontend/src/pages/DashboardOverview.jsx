import { useEffect, useState } from "react"
import { ArrowRight, BriefcaseBusiness, CheckCircle2, CircleAlert, FileText, Loader2, Map, Target, TrendingUp } from "lucide-react"
import { Link } from "react-router-dom"
import AppShell from "../components/AppShell"
import api, { getApiError } from "../lib/api"

const card = "rounded-[26px] border border-white/80 bg-white/60 p-5 shadow-[0_15px_45px_rgba(79,70,229,0.08)] backdrop-blur-xl"

function DashboardOverview() {
  const [data, setData] = useState({ profile: null, analysis: null, skillGap: null, roadmap: null, jobs: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const profileResponse = await api.get("/profile")
        const [analysis, skillGap, roadmap, jobs] = await Promise.allSettled([
          api.get("/resume/analyze"),
          api.get("/career/skill-gap", { params: { target_role: "frontend developer" } }),
          api.get("/career/roadmap", { params: { target_role: "frontend developer" } }),
          api.get("/jobs/recommendations"),
        ])
        setData({
          profile: profileResponse.data,
          analysis: analysis.status === "fulfilled" ? analysis.value.data : null,
          skillGap: skillGap.status === "fulfilled" ? skillGap.value.data : null,
          roadmap: roadmap.status === "fulfilled" ? roadmap.value.data : null,
          jobs: jobs.status === "fulfilled" ? jobs.value.data.recommendations || [] : [],
        })
      } catch (requestError) {
        setError(getApiError(requestError, "Unable to load your career dashboard."))
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#eef2ff]"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>

  const { profile, analysis, skillGap, roadmap, jobs } = data
  const hasResume = Boolean(analysis)
  const score = analysis?.resume_score ?? 0
  const readiness = Math.round(skillGap?.match_percentage ?? 0)
  const nextStep = roadmap?.roadmap?.[0]

  return <AppShell eyebrow="Your career command center" title={`Good to see you, ${profile?.name || "there"}.`} description="Your latest career signals, next action, and opportunities are collected here automatically.">
    {error && <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600"><CircleAlert className="h-5 w-5 shrink-0" />{error}</div>}
    {!hasResume && <section className="mb-6 flex flex-col gap-5 rounded-[28px] bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white shadow-xl shadow-indigo-500/20 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-indigo-100">Your next best action</p><h2 className="mt-1 text-2xl font-bold">Upload your resume to unlock your plan</h2><p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100">We will automatically analyze your skills, calculate role readiness, create a roadmap, and match you with jobs.</p></div><Link to="/resume" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50">Upload resume <ArrowRight className="h-4 w-4" /></Link></section>}
    <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"><div className={card}><div className="flex items-center justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600"><FileText className="h-5 w-5" /></div><TrendingUp className="h-4 w-4 text-emerald-500" /></div><p className="mt-5 text-sm text-slate-500">Resume score</p><p className="mt-1 text-3xl font-bold text-slate-800">{score}<span className="text-sm font-normal text-slate-400"> /100</span></p><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${score}%` }} /></div></div><div className={card}><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-purple-600"><Target className="h-5 w-5" /></div><p className="mt-5 text-sm text-slate-500">Role readiness</p><p className="mt-1 text-3xl font-bold text-slate-800">{readiness}<span className="text-sm font-normal text-slate-400">%</span></p><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${readiness}%` }} /></div></div><div className={card}><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600"><Map className="h-5 w-5" /></div><p className="mt-5 text-sm text-slate-500">Roadmap progress</p><p className="mt-1 text-3xl font-bold text-slate-800">{roadmap ? roadmap.total_steps : 0}<span className="text-sm font-normal text-slate-400"> steps</span></p><p className="mt-3 text-xs text-slate-400">Personalized for frontend development</p></div><div className={card}><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-600"><BriefcaseBusiness className="h-5 w-5" /></div><p className="mt-5 text-sm text-slate-500">Matched opportunities</p><p className="mt-1 text-3xl font-bold text-slate-800">{jobs.length}</p><p className="mt-3 text-xs text-slate-400">Ranked by your detected skills</p></div></section>
    <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]"><div className={card}><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">Recommended next</p><h2 className="mt-1 text-xl font-bold text-slate-800">Your roadmap</h2></div><Link to="/roadmap" className="text-sm font-semibold text-indigo-600">View all</Link></div>{nextStep ? <div className="mt-6 flex items-start gap-4 rounded-2xl bg-indigo-50/70 p-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500 font-bold text-white">1</div><div><p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Start here</p><h3 className="mt-1 font-semibold capitalize text-slate-800">{nextStep.skill}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{nextStep.topic}</p></div></div> : <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">Upload and analyze a resume to generate your roadmap.</div>}</div><div className={card}><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-purple-500">AI matched</p><h2 className="mt-1 text-xl font-bold text-slate-800">Top opportunities</h2></div><Link to="/jobs" className="text-sm font-semibold text-indigo-600">Browse all</Link></div><div className="mt-5 space-y-3">{jobs.slice(0, 3).map((job) => <div key={job.job_id} className="flex items-center gap-3 rounded-2xl bg-white/70 p-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 font-bold text-indigo-600">{job.company?.[0]}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{job.title}</p><p className="text-xs text-slate-400">{job.company}</p></div><span className="text-xs font-bold text-emerald-600">{Math.round(job.match_percentage)}%</span></div>)}{!jobs.length && <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">Job matches appear after resume analysis.</div>}</div></div></section><section className="mt-6 rounded-[26px] bg-white/60 p-5 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-500">Detected strengths</p><div className="mt-3 flex flex-wrap gap-2">{analysis?.detected_skills?.slice(0, 10).map((skill) => <span key={skill} className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium capitalize text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />{skill}</span>) || <span className="text-sm text-slate-500">Upload a resume to see your detected skills.</span>}</div></div><Link to="/skills" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">Explore skill gaps <ArrowRight className="h-4 w-4" /></Link></div></section>
  </AppShell>
}

export default DashboardOverview
