import { useEffect, useState } from "react"
import { ArrowRight, Check, CircleAlert, Loader2, MapPinned } from "lucide-react"
import AppShell from "../components/AppShell"
import api, { getApiError } from "../lib/api"

const roles = ["frontend developer", "full-stack developer", "software engineer", "data scientist", "machine learning engineer"]

function Roadmap() {
  const [role, setRole] = useState(roles[0])
  const [data, setData] = useState(null)
  const [completedSkills, setCompletedSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingSkill, setSavingSkill] = useState("")
  const [error, setError] = useState("")

  const load = async (selectedRole = role) => {
    try {
      setError("")
      const [roadmapResponse, progressResponse] = await Promise.all([
        api.get("/career/roadmap", { params: { target_role: selectedRole } }),
        api.get("/career/roadmap/progress", { params: { target_role: selectedRole } }),
      ])
      setData(roadmapResponse.data)
      setCompletedSkills(progressResponse.data.completed_skills || [])
    } catch (requestError) {
      setError(getApiError(requestError, "Upload and analyze a resume before generating a roadmap."))
    } finally {
      setLoading(false)
    }
  }

  // The initial request synchronizes this screen with the authenticated API.
  // oxlint-disable-next-line react(set-state-in-effect)
  useEffect(() => { load() }, [])

  const toggleStep = async (skill) => {
    const completed = !completedSkills.includes(skill)
    try {
      setSavingSkill(skill)
      await api.put("/career/roadmap/progress", null, { params: { target_role: role, skill, completed } })
      setCompletedSkills((current) => completed ? [...current, skill] : current.filter((item) => item !== skill))
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to save roadmap progress."))
    } finally {
      setSavingSkill("")
    }
  }

  const steps = data?.roadmap || []
  const completedCount = steps.filter((step) => completedSkills.includes(step.skill)).length
  const completion = steps.length ? Math.round((completedCount / steps.length) * 100) : 0
  const nextStep = steps.find((step) => !completedSkills.includes(step.skill))

  return (
    <AppShell eyebrow="Your next chapter" title="Career roadmap" description="Turn your skill gaps into an ordered plan, then mark each milestone complete as you build momentum.">
      <div className="mb-6 flex flex-col gap-4 rounded-[26px] bg-white/60 p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <label className="text-sm font-semibold text-slate-700">Target role
          <select value={role} onChange={(event) => { setLoading(true); setRole(event.target.value); load(event.target.value) }} className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal outline-none focus:border-indigo-500 sm:w-80">
            {roles.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        {data && <div className="min-w-56"><div className="flex justify-between text-sm"><span className="font-semibold text-slate-700">{completedCount}/{steps.length} completed</span><span className="text-indigo-600">{completion}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all" style={{ width: `${completion}%` }} /></div></div>}
      </div>
      {error && <div className="mb-5 flex items-start gap-3 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm text-orange-700"><CircleAlert className="h-5 w-5 shrink-0" />{error}</div>}
      {loading && <div className="flex justify-center rounded-[26px] bg-white/60 p-16"><Loader2 className="h-7 w-7 animate-spin text-indigo-500" /></div>}
      {!loading && data && <section className="rounded-[26px] bg-white/60 p-6 shadow-sm">
        <div className="mb-7 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600"><MapPinned className="h-5 w-5" /></div><div><h2 className="text-xl font-bold text-slate-800">Build from your gaps</h2><p className="text-sm text-slate-500">{nextStep ? `Your next focus is ${nextStep.skill}.` : "You completed every step in this roadmap."}</p></div></div>
        {data.ai_response && <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-indigo-700">{data.ai_provider} guidance</p><span className="text-xs text-indigo-500">Google-style coaching</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{data.ai_response}</p></div>}
        <div className="relative space-y-4 before:absolute before:bottom-5 before:left-5 before:top-5 before:w-px before:bg-indigo-200">
          {steps.map((item) => { const completed = completedSkills.includes(item.skill); const saving = savingSkill === item.skill; return <article key={item.skill} className="relative flex gap-4"><div className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-lg transition ${completed ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-indigo-500 text-white shadow-indigo-500/20"}`}>{completed ? <Check className="h-5 w-5" /> : item.step}</div><div className={`flex-1 rounded-2xl border p-4 transition ${completed ? "border-emerald-100 bg-emerald-50/60" : "border-white/80 bg-white/70"}`}><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center"><h3 className={`font-semibold capitalize ${completed ? "text-emerald-800 line-through" : "text-slate-800"}`}>{item.skill}</h3><span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${completed ? "bg-emerald-100 text-emerald-700" : "bg-indigo-50 text-indigo-600"}`}>{completed ? "completed" : item.status}</span></div><p className="mt-2 text-sm leading-6 text-slate-500">{item.topic}</p><button disabled={saving} onClick={() => toggleStep(item.skill)} className={`mt-3 flex items-center gap-2 text-xs font-semibold ${completed ? "text-emerald-700" : "text-indigo-600"}`}>{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : completed ? <Check className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}{completed ? "Mark as incomplete" : "Mark complete"}</button></div></article> })}
        </div>
      </section>}
    </AppShell>
  )
}

export default Roadmap
