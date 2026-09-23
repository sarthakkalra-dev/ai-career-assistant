```jsx
import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import api, { getApiError } from "../lib/api"
import { Brain, Mail, Lock, ArrowRight } from "lucide-react"

function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const registeredMessage = location.state?.registered

  const handleLogin = async (event) => {
    event.preventDefault()

    setError("")

    if (!email || !password) {
      setError("Please enter your email and password.")
      return
    }

    try {
      setLoading(true)

      const formData = new URLSearchParams()

      formData.append("username", email.trim().toLowerCase())
      formData.append("password", password)

      const response = await api.post(
        "/login",
        formData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      )

      localStorage.setItem(
        "access_token",
        response.data.access_token
      )

      navigate("/dashboard")
    } catch (error) {
      setError(
        getApiError(
          error,
          "Unable to connect to the backend."
        )
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">

      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden grid md:grid-cols-2">

        {/* Left Section */}

        <div className="hidden md:flex bg-indigo-600 p-12 text-white flex-col justify-between">

          <div>

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                <Brain size={25} />
              </div>

              <div>

                <h1 className="font-bold text-xl">
                  AI Career
                </h1>

                <p className="text-sm text-indigo-200">
                  Placement Assistant
                </p>

              </div>

            </div>

            <div className="mt-20">

              <h2 className="text-4xl font-bold leading-tight">
                Build your career.
                <br />
                Prepare smarter.
              </h2>

              <p className="mt-6 text-indigo-100 leading-relaxed">
                Analyze your resume, discover skill gaps,
                follow your personalized roadmap and prepare
                for interviews with AI-powered assistance.
              </p>

            </div>

          </div>

          <p className="text-sm text-indigo-200">
            AI-powered career preparation platform
          </p>

        </div>

        {/* Login Section */}

        <div className="p-8 md:p-12">

          <div className="max-w-md mx-auto">

            {/* Mobile Logo */}

            <div className="md:hidden flex items-center gap-3 mb-10">

              <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center">
                <Brain className="text-white" size={24} />
              </div>

              <div>

                <h1 className="font-bold text-lg">
                  AI Career
                </h1>

                <p className="text-xs text-slate-500">
                  Placement Assistant
                </p>

              </div>

            </div>

            <div className="mb-8">

              <h2 className="text-3xl font-bold text-slate-900">
                Welcome back 👋
              </h2>

              <p className="mt-2 text-slate-500">
                Login to continue your career journey.
              </p>

              {registeredMessage && (
                <p className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
                  Account created. You can log in now.
                </p>
              )}

            </div>

            {/* Error */}

            {error && (

              <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {error}
              </div>

            )}

            <form
              onSubmit={handleLogin}
              className="space-y-5"
            >

              {/* Email */}

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email address
                </label>

                <div className="relative">

                  <Mail
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
                  />

                </div>

              </div>

              {/* Password */}

              <div>

                <div className="flex justify-between mb-2">

                  <label className="text-sm font-semibold text-slate-700">
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-sm text-indigo-600 font-medium hover:text-indigo-700"
                  >
                    Forgot password?
                  </button>

                </div>

                <div className="relative">

                  <Lock
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
                  />

                </div>

              </div>

              {/* Login Button */}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3.5 rounded-xl transition shadow-lg shadow-indigo-200"
              >

                {loading ? (
                  "Logging in..."
                ) : (
                  <>
                    Login
                    <ArrowRight size={19} />
                  </>
                )}

              </button>

            </form>

            <div className="mt-8 text-center">

              <p className="text-sm text-slate-500">
                Don't have an account?{" "}

                <Link
                  to="/register"
                  className="text-indigo-600 font-semibold hover:text-indigo-700"
                >
                  Create account
                </Link>
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}

export default Login
```
