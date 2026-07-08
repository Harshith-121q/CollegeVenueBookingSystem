import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://collegevenuebookingsystem.onrender.com'
})

// Add token to every request
API.interceptors.request.use((config)=>{
    const token = localStorage.getItem('token')
    if(token){
        config.headers.Authorization= `Bearer ${token}` 
    }
    return config
})

// ✅ RESPONSE INTERCEPTOR (handles errors like 401)
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    return Promise.reject(err)
  }
)

export default API