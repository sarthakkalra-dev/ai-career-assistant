import { useEffect, useState } from "react"
import { Check, CircleAlert, Loader2, Target } from "lucide-react"
import AppShell from "../components/AppShell"
import api, { getApiError } from "../lib/api"

const roles = ["frontend developer", "full-stack developer", "software engineer", "data scientist", "machine learning engineer"]

function Skills() {
  const [role, setRole] = useState(roles[0])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = async (selectedRole = role) => {
    try { setError(""); const response = await api.get("/career/skill-gap", { params: { target_role: selectedRole } }); setData(response.data) } catch (requestError) { setError(getApiError(requestError, "Upload and analyze a resume before checking your skill gap.")) } finally { setLoading(false) }
  }

  // The initial request synchronizes this screen with the authenticated API.
  // oxlint-disable-next-line react(set-state-in-effect)
  useEffect(() => { load() }, [])

  return <AppShell eyebrow="Career intelligence" title="Your skill gap" description="See which capabilities your target role expects and focus your learning where it matters most.">
    <div className="mb-6 flex flex-col gap-3 rounded-[26px] bg-white/60 p-5 shadow-sm backdrop-blur-xl sm:flex-row sm:items-end sm:justify-between"><label className="text-sm font-semibold text-slate-700">Target role<select value={role} onChange={(event) => { setLoading(true); setRole(event.target.value); load(event.target.value) }} className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal outline-none focus:border-indigo-500 sm:w-80">{roles.map((item) => <option key={item}>{item}</option>)}</select></label><div className="flex items-center gap-2 text-sm text-slate-500"><Target className="h-4 w-4 text-indigo-500" />Based on your uploaded resume</div></div>
    {error && <div className="mb-6 flex items-start gap-3 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm text-orange-700"><CircleAlert className="h-5 w-5 shrink-0" />{error}</div>}
    {loading ? <div className="flex justify-center rounded-[26px] bg-white/60 p-16"><Loader2 className="h-7 w-7 animate-spin text-indigo-500" /></div> : data && <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]"><section className="rounded-[26px] bg-white/60 p-6 shadow-sm"><p className="text-sm font-semibold text-indigo-500">Role readiness</p><div className="mt-5 flex items-end gap-2"><span className="text-6xl font-bold text-slate-800">{Math.round(data.match_percentage)}</span><span className="mb-2 text-slate-400">%</span></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${data.match_percentage}%` }} /></div><p className="mt-4 text-sm text-slate-500">{data.skills_matched} of {data.total_required_skills} required skills detected.</p><div className="mt-8 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-emerald-50 p-4"><p className="text-2xl font-bold text-emerald-600">{data.skills_matched}</p><p className="text-xs text-emerald-700">Matched</p></div><div className="rounded-2xl bg-orange-50 p-4"><p className="text-2xl font-bold text-orange-600">{data.skills_missing}</p><p className="text-xs text-orange-700">To develop</p></div></div></section><section className="rounded-[26px] bg-white/60 p-6 shadow-sm"><h2 className="text-xl font-bold text-slate-800">Capability checklist</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{data.required_skills.map((skill) => { const matched = data.current_skills.includes(skill); return <div key={skill} className={`flex items-center gap-3 rounded-2xl border p-4 ${matched ? "border-emerald-100 bg-emerald-50/70" : "border-orange-100 bg-orange-50/70"}`}>{matched ? <Check className="h-5 w-5 text-emerald-500" /> : <CircleAlert className="h-5 w-5 text-orange-500" />}<span className="text-sm font-medium capitalize text-slate-700">{skill}</span></div> })}</div></section></div>}
  </AppShell>
}
export default Skills
