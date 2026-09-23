import { useEffect, useState } from "react"
import { BriefcaseBusiness, CheckCircle2, CircleAlert, Loader2, MapPin, Send, Sparkles, X } from "lucide-react"
import AppShell from "../components/AppShell"
import api, { getApiError } from "../lib/api"

function Jobs() {
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState({})
  const [selectedJob, setSelectedJob] = useState(null)
  const [coverNote, setCoverNote] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const [jobsResponse, applicationsResponse] = await Promise.all([
          api.get("/jobs/recommendations"),
          api.get("/jobs/applications"),
        ])
        setJobs(jobsResponse.data.recommendations || [])
        setApplications(Object.fromEntries(
          (applicationsResponse.data.applications || []).map((application) => [application.job_id, application])
        ))
      } catch (requestError) {
        setError(getApiError(requestError, "Unable to load recommended jobs."))
      } finally {
        setLoading(false)
      }
    }
    loadJobs()
  }, [])

  const submitApplication = async (event) => {
    event.preventDefault()
    if (!selectedJob) return

    try {
      setSubmitting(true)
      setError("")
      const response = await api.post(`/jobs/${selectedJob.job_id}/apply`, { cover_note: coverNote })
      setApplications((current) => ({ ...current, [selectedJob.job_id]: response.data.application }))
      setSuccess(`Application sent to ${selectedJob.company}.`)
      setSelectedJob(null)
      setCoverNote("")
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to submit your application."))
    } finally {
      setSubmitting(false)
    }
  }

  return <AppShell eyebrow="Opportunities for you" title="Recommended jobs" description="Compare roles against your resume, then apply directly from your career workspace.">
    {error && <div className="mb-5 flex items-start gap-3 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm text-orange-700"><CircleAlert className="h-5 w-5 shrink-0" />{error}</div>}
    {success && <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700"><CheckCircle2 className="h-5 w-5 shrink-0" />{success}</div>}
    {loading ? <div className="flex justify-center rounded-[26px] bg-white/60 p-16"><Loader2 className="h-7 w-7 animate-spin text-indigo-500" /></div> : <div className="grid gap-5 xl:grid-cols-2">{jobs.map((job) => { const application = applications[job.job_id]; return <article key={job.job_id} className="rounded-[26px] bg-white/60 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10"><div className="flex items-start gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-lg font-bold text-indigo-600">{job.company?.[0]?.toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex flex-col justify-between gap-2 sm:flex-row"><div><h2 className="text-lg font-bold text-slate-800">{job.title}</h2><p className="text-sm text-slate-500">{job.company}</p></div><div className="flex items-center gap-1 text-sm font-bold text-emerald-600"><Sparkles className="h-4 w-4" />{Math.round(job.match_percentage)}% match</div></div><div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500"><span className="rounded-lg bg-slate-100 px-2.5 py-1">{job.job_type || "Full time"}</span>{job.location && <span className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1"><MapPin className="h-3 w-3" />{job.location}</span>}</div></div></div>{job.description && <p className="mt-5 text-sm leading-6 text-slate-500">{job.description}</p>}<div className="mt-5 border-t border-slate-100 pt-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Required skills</p><div className="flex flex-wrap gap-2">{job.required_skills.map((skill) => <span key={skill} className={`rounded-lg px-2.5 py-1 text-xs font-medium ${job.matched_skills.includes(skill) ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"}`}>{skill}</span>)}</div></div><button disabled={Boolean(application)} onClick={() => { setSelectedJob(job); setError("") }} className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition ${application ? "cursor-default bg-emerald-50 text-emerald-700" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>{application ? <><CheckCircle2 className="h-4 w-4" />Applied</> : <><Send className="h-4 w-4" />Apply now</>}</button></article> })}{!jobs.length && !error && <div className="rounded-[26px] bg-white/60 p-10 text-center text-slate-500"><BriefcaseBusiness className="mx-auto mb-3 h-8 w-8 text-indigo-400" />No matching jobs are available yet.</div>}</div>}
    {selectedJob && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedJob(null) }}><div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-[26px] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Application</p><h2 className="mt-1 text-xl font-bold text-slate-800">{selectedJob.title}</h2><p className="text-sm text-slate-500">{selectedJob.company}</p></div><button onClick={() => setSelectedJob(null)} aria-label="Close application dialog" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><form onSubmit={submitApplication}><label className="mt-6 block text-sm font-semibold text-slate-700">Note to the recruiter <span className="font-normal text-slate-400">(optional)</span><textarea value={coverNote} onChange={(event) => setCoverNote(event.target.value)} rows="5" maxLength="1000" placeholder="Share why this role interests you..." className="mt-2 w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></label><div className="mt-2 text-right text-xs text-slate-400">{coverNote.length}/1000</div><button disabled={submitting} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Send className="h-4 w-4" />Submit application</>}</button></form></div></div>}
  </AppShell>
}

export default Jobs
