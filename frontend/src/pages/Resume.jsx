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
  Upload,
  FileCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Loader2,
  RefreshCw,
} from "lucide-react"

function Resume() {
  const [file, setFile] = useState(null)
  const [resumeText, setResumeText] = useState("")
  const [analysis, setAnalysis] = useState(null)

  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const loadResumeData = async () => {
      try {
        const token = localStorage.getItem("access_token")

        if (!token) {
          window.location.href = "/"
          return
        }

        await api.get("/profile")

        try {
          const textResponse = await api.get("/resume/text")

          if (textResponse.data?.text) {
            setResumeText(textResponse.data.text)
          }
        } catch {
          console.log("No existing resume text found.")
        }

        try {
          const analysisResponse = await api.get("/resume/analyze")

          setAnalysis(analysisResponse.data)
        } catch {
          console.log("No existing resume analysis found.")
        }

      } catch (err) {
        console.error(err)
        localStorage.removeItem("access_token")
        window.location.href = "/"
      } finally {
        setLoading(false)
      }
    }

    loadResumeData()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    window.location.href = "/"
  }

  const handleFileChange = (selectedFile) => {
    setError("")
    setSuccess("")

    if (!selectedFile) {
      return
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    const extension = selectedFile.name
      .split(".")
      .pop()
      ?.toLowerCase()

    if (
      !allowedTypes.includes(selectedFile.type) &&
      !["pdf", "docx"].includes(extension)
    ) {
      setError("Please upload a PDF or DOCX resume.")
      return
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Resume file must be smaller than 5 MB.")
      return
    }

    setFile(selectedFile)
  }

  const handleInputChange = (event) => {
    const selectedFile = event.target.files?.[0]
    handleFileChange(selectedFile)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragActive(false)

    const droppedFile = event.dataTransfer.files?.[0]
    handleFileChange(droppedFile)
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a resume first.")
      return
    }

    try {
      setUploading(true)
      setError("")
      setSuccess("")

      const formData = new FormData()
      formData.append("file", file)

      const response = await api.post("/resume/upload", formData)

      setSuccess(
        response.data?.message || "Resume uploaded successfully."
      )

      await loadResumeText()
      await analyzeResume()

    } catch (err) {
      console.error("Resume upload failed:", err)

      setError(
        err.response?.data?.detail ||
          "Resume upload failed. Please try again."
      )
    } finally {
      setUploading(false)
    }
  }

  const loadResumeText = async () => {
    try {
      const response = await api.get("/resume/text")

      setResumeText(response.data?.text || "")
    } catch (err) {
      console.error("Resume text loading failed:", err)
    }
  }

  const analyzeResume = async () => {
    try {
      setAnalyzing(true)
      setError("")

      const response = await api.get("/resume/analyze")

      setAnalysis(response.data)

    } catch (err) {
      console.error("Resume analysis failed:", err)

      setError(
        err.response?.data?.detail ||
          "Unable to analyze the resume."
      )
    } finally {
      setAnalyzing(false)
    }
  }

  const menuItems = [
    {
      name: "Dashboard",
      icon: Home,
      path: "/dashboard",
    },
    {
      name: "Resume",
      icon: FileText,
      active: true,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#eef2ff] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-500">
            Loading Resume Analyzer...
          </p>
        </div>
      </div>
    )
  }

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
                      window.location.href = item.path
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
                      <ArrowUpRight className="w-4 h-4 ml-auto" />
                    )}
                  </button>
                )
              })}

            </nav>

            {/* AI Card */}
            <div className="rounded-2xl bg-gradient-to-br from-indigo-500/90 to-purple-600/90 p-4 text-white shadow-lg shadow-indigo-500/20">

              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                <Sparkles className="w-4 h-4" />
              </div>

              <p className="text-sm font-semibold">
                AI Resume Coach
              </p>

              <p className="text-xs text-white/75 mt-1 leading-relaxed">
                Optimize your resume and improve your chances of getting shortlisted.
              </p>

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

          {/* Header */}
          <header className="mb-8">

            <p className="text-sm text-indigo-500 font-semibold">
              AI Resume Analyzer
            </p>

            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mt-1">
              Optimize Your Resume
            </h2>

            <p className="text-sm text-slate-500 mt-2 max-w-2xl">
              Upload your resume and let the AI analyze your skills,
              experience and career readiness.
            </p>

          </header>

          {/* Alerts */}
          {error && (
            <div className="mb-6 rounded-2xl bg-red-50/80 backdrop-blur-xl border border-red-100 p-4 flex items-center gap-3 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-2xl bg-emerald-50/80 backdrop-blur-xl border border-emerald-100 p-4 flex items-center gap-3 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
              <p className="text-sm">{success}</p>
            </div>
          )}

          {/* UPLOAD SECTION */}
          <section className="rounded-[30px] bg-white/55 backdrop-blur-2xl border border-white/80 shadow-[0_20px_60px_rgba(79,70,229,0.08)] p-6 sm:p-8 mb-6">

            <div className="flex items-center justify-between mb-6">

              <div>

                <h3 className="text-xl font-bold text-slate-800">
                  Upload Resume
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  PDF or DOCX • Maximum 5 MB
                </p>

              </div>

              <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>

            </div>

            <input
              id="resume-upload"
              type="file"
              accept=".pdf,.docx"
              onChange={handleInputChange}
              className="hidden"
            />

            <label
              htmlFor="resume-upload"
              onDragOver={(event) => {
                event.preventDefault()
                setDragActive(true)
              }}
              onDragLeave={() => {
                setDragActive(false)
              }}
              onDrop={handleDrop}
              className={`relative block rounded-[25px] border-2 border-dashed p-8 sm:p-12 text-center cursor-pointer transition-all ${
                dragActive
                  ? "border-indigo-500 bg-indigo-50/70"
                  : "border-indigo-200/70 bg-white/30 hover:bg-white/50 hover:border-indigo-300"
              }`}
            >

              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Upload className="w-7 h-7 text-white" />
              </div>

              <h4 className="text-lg font-semibold text-slate-700 mt-5">
                {file
                  ? file.name
                  : "Drop your resume here"}
              </h4>

              <p className="text-sm text-slate-400 mt-2">
                or click to browse from your computer
              </p>

              {file && (
                <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-semibold">
                  <FileCheck className="w-4 h-4" />
                  Ready to upload
                </div>
              )}

            </label>

            <div className="flex flex-col sm:flex-row gap-3 mt-5">

              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload & Analyze
                  </>
                )}
              </button>

              <button
                onClick={analyzeResume}
                disabled={!resumeText || analyzing}
                className="sm:w-48 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/70 border border-white text-slate-600 font-semibold hover:bg-white disabled:opacity-50 transition"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Re-analyze
                  </>
                )}
              </button>

            </div>

          </section>

          {/* ANALYSIS */}
          {analysis && (
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* SCORE */}
              <div className="rounded-[30px] bg-white/55 backdrop-blur-2xl border border-white/80 shadow-[0_20px_60px_rgba(79,70,229,0.08)] p-6">

                <p className="text-xs uppercase tracking-wider font-semibold text-indigo-500">
                  Resume Performance
                </p>

                <h3 className="text-xl font-bold text-slate-800 mt-1">
                  Overall Score
                </h3>

                <div className="flex justify-center py-8">

                  <div className="relative w-44 h-44">

                    <svg
                      className="w-full h-full -rotate-90"
                      viewBox="0 0 120 120"
                    >
                      <circle
                        cx="60"
                        cy="60"
                        r="48"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="10"
                        className="text-slate-200"
                      />

                      <circle
                        cx="60"
                        cy="60"
                        r="48"
                        fill="none"
                        stroke="url(#resumeGradient)"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray="301.6"
                        strokeDashoffset={
                          301.6 -
                          (Math.min(
                            Number(analysis.resume_score ?? 0),
                            100
                          ) /
                            100) *
                            301.6
                        }
                      />

                      <defs>
                        <linearGradient
                          id="resumeGradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold text-slate-800">
                        {analysis.resume_score ?? 0}
                      </span>

                      <span className="text-xs text-slate-400">
                        out of 100
                      </span>
                    </div>

                  </div>

                </div>

                <div className="rounded-2xl bg-indigo-50/70 p-4 text-center">

                  <p className="text-sm font-semibold text-indigo-700">
                    {Number(
                      analysis.score ??
                        analysis.analysis_score ??
                        0
                    ) >= 80
                      ? "Strong Resume"
                      : "Room for Improvement"}
                  </p>

                  <p className="text-xs text-indigo-500 mt-1">
                    Keep improving your profile.
                  </p>

                </div>

              </div>

              {/* STRENGTHS */}
              <div className="rounded-[30px] bg-white/55 backdrop-blur-2xl border border-white/80 shadow-[0_20px_60px_rgba(79,70,229,0.08)] p-6">

                <p className="text-xs uppercase tracking-wider font-semibold text-emerald-500">
                  What you're doing well
                </p>

                <h3 className="text-xl font-bold text-slate-800 mt-1 mb-5">
                  Strengths
                </h3>

                <div className="space-y-3">

                  {(
                    analysis.strengths ||
                    analysis.skills ||
                    [
                      "Technical skills",
                      "Education details",
                      "Project experience",
                    ]
                  )
                    .slice(0, 5)
                    .map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100/50"
                      >
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />

                        <p className="text-sm text-slate-600">
                          {typeof item === "string"
                            ? item
                            : item.name || item.skill || "Skill identified"}
                        </p>
                      </div>
                    ))}

                </div>

              </div>

              {/* IMPROVEMENTS */}
              <div className="rounded-[30px] bg-white/55 backdrop-blur-2xl border border-white/80 shadow-[0_20px_60px_rgba(79,70,229,0.08)] p-6">

                <p className="text-xs uppercase tracking-wider font-semibold text-orange-500">
                  AI suggestions
                </p>

                <h3 className="text-xl font-bold text-slate-800 mt-1 mb-5">
                  Improve Your Resume
                </h3>

                <div className="space-y-3">

                  {(
                    analysis.suggestions ||
                    analysis.improvements ||
                    [
                      "Add measurable achievements",
                      "Improve project descriptions",
                      "Highlight relevant technical skills",
                    ]
                  )
                    .slice(0, 5)
                    .map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-2xl bg-orange-50/60 border border-orange-100/50"
                      >
                        <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />

                        <p className="text-sm text-slate-600">
                          {typeof item === "string"
                            ? item
                            : item.text ||
                              item.message ||
                              "Consider improving this section."}
                        </p>
                      </div>
                    ))}

                </div>

              </div>

            </section>
          )}

          {/* RESUME TEXT */}
          {resumeText && (
            <section className="mt-6 rounded-[30px] bg-white/55 backdrop-blur-2xl border border-white/80 shadow-[0_20px_60px_rgba(79,70,229,0.08)] p-6">

              <div className="flex items-center justify-between mb-5">

                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-indigo-500">
                    Extracted content
                  </p>

                  <h3 className="text-xl font-bold text-slate-800 mt-1">
                    Resume Preview
                  </h3>
                </div>

                <FileCheck className="w-5 h-5 text-emerald-500" />

              </div>

              <div className="max-h-96 overflow-y-auto rounded-2xl bg-white/50 border border-white/70 p-5">

                <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-slate-600">
                  {resumeText}
                </pre>

              </div>

            </section>
          )}

        </main>

      </div>

    </div>
  )
}

export default Resume