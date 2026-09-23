import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowRight, Brain, Lock, Mail, User } from "lucide-react"
import api, { getApiError } from "../lib/api"

function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: "", email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleRegister = async (event) => {
    event.preventDefault()
    setError("")

    if (form.name.trim().length < 2) {
      setError("Please enter your full name.")
      return
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    try {
      setLoading(true)
      await api.post("/register", {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      navigate("/", { state: { registered: true } })
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to create your account."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <section className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden grid md:grid-cols-2">
        <div className="hidden md:flex bg-indigo-600 p-12 text-white flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center"><Brain size={25} /></div>
              <div><h1 className="font-bold text-xl">AI Career</h1><p className="text-sm text-indigo-200">Placement Assistant</p></div>
            </div>
            <div className="mt-20">
              <h2 className="text-4xl font-bold leading-tight">Turn preparation<br />into progress.</h2>
              <p className="mt-6 text-indigo-100 leading-relaxed">Build a focused career profile, improve your resume and prepare for the roles you want.</p>
            </div>
          </div>
          <p className="text-sm text-indigo-200">AI-powered career preparation platform</p>
        </div>

        <div className="p-8 md:p-12">
          <div className="max-w-md mx-auto">
            <div className="md:hidden flex items-center gap-3 mb-10">
              <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center"><Brain className="text-white" size={24} /></div>
              <div><h1 className="font-bold text-lg">AI Career</h1><p className="text-xs text-slate-500">Placement Assistant</p></div>
            </div>
            <div className="mb-8"><h2 className="text-3xl font-bold text-slate-900">Create your account</h2><p className="mt-2 text-slate-500">Start building your career plan today.</p></div>
            {error && <div role="alert" className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>}
            <form onSubmit={handleRegister} className="space-y-5">
              <label className="block text-sm font-semibold text-slate-700">Full name
                <div className="relative mt-2"><User size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input required name="name" value={form.name} onChange={handleChange} placeholder="Your full name" className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition" /></div>
              </label>
              <label className="block text-sm font-semibold text-slate-700">Email address
                <div className="relative mt-2"><Mail size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input required type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition" /></div>
              </label>
              <label className="block text-sm font-semibold text-slate-700">Password
                <div className="relative mt-2"><Lock size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input required minLength={8} type="password" name="password" value={form.password} onChange={handleChange} placeholder="At least 8 characters" className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition" /></div>
              </label>
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3.5 rounded-xl transition shadow-lg shadow-indigo-200">{loading ? "Creating account..." : <>Create account <ArrowRight size={19} /></>}</button>
            </form>
            <p className="mt-8 text-center text-sm text-slate-500">Already have an account? <Link to="/" className="text-indigo-600 font-semibold hover:text-indigo-700">Log in</Link></p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Register
