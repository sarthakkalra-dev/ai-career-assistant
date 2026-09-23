import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem("access_token")) {
      localStorage.removeItem("access_token")
      window.location.href = "/"
    }
    return Promise.reject(error)
  }
)

export function getApiError(error, fallback = "Something went wrong. Please try again.") {
  const detail = error.response?.data?.detail
  if (typeof detail === "string") return detail
  if (detail?.message) return detail.message
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg
  return fallback
}

export default api
