import { useEffect, useRef, useState } from "react"
import { ArrowRight, Camera, CameraOff, CheckCircle2, CircleAlert, Download, Loader2, Mic, MicOff, RotateCcw, Square } from "lucide-react"
import AppShell from "../components/AppShell"
import api, { getApiError } from "../lib/api"

const roles = ["frontend developer", "full-stack developer", "software engineer", "data scientist", "machine learning engineer"]

function Interview() {
  const [role, setRole] = useState(roles[0])
  const [session, setSession] = useState(null)
  const [current, setCurrent] = useState(0)
  const [answer, setAnswer] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [recordingUrl, setRecordingUrl] = useState("")
  const [error, setError] = useState("")
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const recognitionRef = useRef(null)

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraEnabled(false)
  }

  useEffect(() => () => {
    stopCamera()
    recognitionRef.current?.stop()
    if (recordingUrl) URL.revokeObjectURL(recordingUrl)
  }, [recordingUrl])

  useEffect(() => {
    if (cameraEnabled && videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current
  }, [cameraEnabled])

  const enableCamera = async () => {
    try {
      setError("")
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera access is not supported in this browser.")
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      setCameraEnabled(true)
    } catch (requestError) {
      setError(requestError.message || "Please allow camera and microphone access.")
    }
  }

  const toggleRecording = () => {
    if (!streamRef.current) return
    if (recording) {
      recorderRef.current?.stop()
      setRecording(false)
      return
    }
    chunksRef.current = []
    const recorder = new MediaRecorder(streamRef.current)
    recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data) }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" })
      if (recordingUrl) URL.revokeObjectURL(recordingUrl)
      setRecordingUrl(URL.createObjectURL(blob))
    }
    recorderRef.current = recorder
    recorder.start()
    setRecording(true)
  }

  const toggleTranscription = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError("Live transcription is not supported in this browser.")
      return
    }
    if (transcribing) {
      recognitionRef.current?.stop()
      setTranscribing(false)
      return
    }
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event) => {
      let transcript = ""
      for (let index = event.resultIndex; index < event.results.length; index += 1) transcript += event.results[index][0].transcript
      setAnswer((value) => `${value} ${transcript}`.trim())
    }
    recognition.onerror = () => setError("Live transcription stopped.")
    recognition.onend = () => setTranscribing(false)
    recognitionRef.current = recognition
    recognition.start()
    setTranscribing(true)
  }

  const start = async () => {
    try {
      setLoading(true)
      setError("")
      const response = await api.post("/interview/start", null, { params: { target_role: role } })
      setSession(response.data)
      setCurrent(0)
      setAnswer("")
      setResult(null)
      await enableCamera()
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to start an interview session."))
    } finally {
      setLoading(false)
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!answer.trim()) return
    try {
      setLoading(true)
      setError("")
      const response = await api.post("/interview/answer", null, { params: { session_id: session.session_id, question_number: current + 1, answer } })
      setResult(response.data)
      setAnswer("")
      if (recording) toggleRecording()
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to evaluate that answer."))
    } finally {
      setLoading(false)
    }
  }

  const finish = () => {
    stopCamera()
    recognitionRef.current?.stop()
    setSession(null)
    setResult(null)
    setCurrent(0)
    setRecordingUrl("")
  }

  const next = () => {
    if (current + 1 >= session.questions.length) {
      if (recording) toggleRecording()
      stopCamera()
    }
    setResult(null)
    setCurrent((value) => value + 1)
  }

  const renderFeedback = () => (
    <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
      <div className="flex items-center justify-between"><p className="font-semibold text-emerald-700">AI evaluation</p><span className="text-2xl font-bold text-emerald-700">{result.score}/10</span></div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{result.evaluation}</p>
      {result.ai_response && <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{result.ai_provider} feedback</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{result.ai_response}</p></div>}
      <button onClick={next} className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">{current + 1 === session.questions.length ? "Finish session" : "Next question"}<ArrowRight className="h-4 w-4" /></button>
    </div>
  )

  return <AppShell eyebrow="Practice with purpose" title="Live AI interview" description="Use your camera and microphone to practice naturally. The local evaluator remains available, with optional Google Gemini coaching.">
    {error && <div className="mb-6 flex items-start gap-3 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm text-orange-700"><CircleAlert className="h-5 w-5 shrink-0" />{error}</div>}
    {!session && <section className="mx-auto max-w-2xl rounded-[30px] bg-white/60 p-8 text-center shadow-sm sm:p-12"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600"><Camera className="h-7 w-7" /></div><h2 className="mt-6 text-2xl font-bold text-slate-800">Start a live interview</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Choose a role, then allow camera and microphone access for a realistic practice session.</p><select value={role} onChange={(event) => setRole(event.target.value)} className="mt-7 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-500 sm:w-80">{roles.map((item) => <option key={item}>{item}</option>)}</select><button onClick={start} disabled={loading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 sm:mx-auto sm:w-80">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Allow camera & start <ArrowRight className="h-5 w-5" /></>}</button></section>}
    {session && current >= session.questions.length && <section className="mx-auto max-w-2xl rounded-[30px] bg-white/60 p-8 text-center shadow-sm"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" /><h2 className="mt-5 text-2xl font-bold text-slate-800">Session complete</h2><p className="mt-2 text-sm text-slate-500">You completed every question in this practice set.</p>{recordingUrl && <a href={recordingUrl} download="ai-interview-practice.webm" className="mx-auto mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"><Download className="h-4 w-4" />Download recording</a>}<br /><button onClick={finish} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white"><RotateCcw className="h-4 w-4" />Start another</button></section>}
    {session && current < session.questions.length && <section className="mx-auto max-w-5xl rounded-[30px] bg-white/60 p-6 shadow-sm sm:p-8"><div className="mb-6 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">Question {current + 1} of {session.questions.length}</p><div className="mt-3 h-2 w-40 overflow-hidden rounded-full bg-slate-200 sm:w-64"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${((current + 1) / session.questions.length) * 100}%` }} /></div></div><button onClick={finish} className="text-sm font-semibold text-slate-500 hover:text-red-500">End session</button></div><div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]"><div><div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-900">{cameraEnabled ? <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" /> : <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400"><CameraOff className="h-8 w-8" /><span className="text-sm">Camera is off</span><button onClick={enableCamera} className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white">Enable camera</button></div>}{recording && <span className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white"><span className="h-2 w-2 rounded-full bg-white" />REC</span>}</div><div className="mt-3 flex flex-wrap gap-2"><button onClick={cameraEnabled ? stopCamera : enableCamera} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">{cameraEnabled ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}{cameraEnabled ? "Turn camera off" : "Turn camera on"}</button><button onClick={toggleRecording} disabled={!cameraEnabled} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm disabled:opacity-40">{recording ? <Square className="h-4 w-4 text-red-500" /> : <Mic className="h-4 w-4" />}{recording ? "Stop recording" : "Record practice"}</button></div></div><div><h2 className="text-2xl font-bold leading-tight text-slate-800">{session.questions[current].question}</h2>{!result ? <form onSubmit={submit}><textarea value={answer} onChange={(event) => setAnswer(event.target.value)} rows="8" placeholder="Type your answer or use live transcription..." className="mt-6 w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={toggleTranscription} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${transcribing ? "bg-red-50 text-red-600" : "bg-indigo-50 text-indigo-600"}`}>{transcribing ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}{transcribing ? "Stop transcription" : "Live transcribe"}</button><span className="text-xs text-slate-400">{transcribing ? "Listening..." : "Submit when ready."}</span></div><button disabled={loading || !answer.trim()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Submit answer <ArrowRight className="h-5 w-5" /></>}</button></form> : renderFeedback()}</div></div></section>}
  </AppShell>
}

export default Interview
