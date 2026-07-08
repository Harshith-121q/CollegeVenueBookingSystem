  /* eslint-disable react-refresh/only-export-components */
  import { createContext, useState, useCallback , useEffect } from "react"
  import API from "../api/axios"

  export const AuthContext = createContext()

  export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {                        // this useEffect is used for restore the user credentials also after the user refreshes the page
      const initAuth = async () => {
        setLoading(true)

        const storedToken = localStorage.getItem("token")
        console.log("Stored Token:",storedToken)

        if (!storedToken) {
          setLoading(false)
          return
        }

        setToken(storedToken)

          try {
            const res = await API.get("/common-route/me")
            setUser(res.data.payload)
          } catch {
            localStorage.removeItem("token")
            setToken(null)
            setUser(null)
          }
          finally{
            setLoading(false)
          }
      }

      initAuth()
    }, [])

    // 🔐 LOGIN
    const login = useCallback(async (credentials) => {
      setLoading(true)
      setError("")

      try {
        const response = await API.post("/common-route/login", credentials)

        const { payload, token: newToken } = response.data

        setToken(newToken)
        setUser(payload)
        localStorage.setItem("token", newToken)

        return payload

      } catch (err) {
        const message = err.response?.data?.message || "Login failed"
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    }, [])

    // 📝 REGISTER
    const register = useCallback(async (userData) => {
      setLoading(true)
      setError("")

      try {
        const response = await API.post("/common-route/register", userData)
        return response.data

      } catch (err) {
        const message = err.response?.data?.message || "Registration failed"
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    }, [])

    // 🚪 LOGOUT
    const logout = useCallback(async () => {
      setLoading(true)

      try {
        await API.post("/common-route/logout") // token auto attached

        setToken(null)
        setUser(null)
        localStorage.removeItem("token")

      } catch (err) {
        console.error("Logout Error:", err)
      } finally {
        setLoading(false)
      }
    }, [token])

  //   const getCurrentUser = async () => {
  //   try {
  //     const res = await axios.get("/common-route/me", {
  //       headers: {
  //         Authorization: `Bearer ${localStorage.getItem("token")}`
  //       }
  //     });

  //     setUser(res.data.payload);
  //   } catch (err) {
  //     console.log(err);
  //     setUser(null);
  //   }
  // }


    return (
      <AuthContext.Provider
        value={{
          user,
          token,
          login,
          register,
          logout,
          loading,
          error,
        }}
      >
        {children}
      </AuthContext.Provider>
    )
  }