import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {useAuth} from "../hooks/useAuth"
import Modal from "../components/Modal"

export default function Auth() {
const [mode, setMode]= useState("login")
const [name,setName]=useState("")
const [email,setEmail]=useState("")
const [password,setPassword]=useState("")
const [role,setRole]=useState("student")
const [section,setSection]=useState("")
const [year,setYear]=useState("")

const [showModal, setShowModal] = useState(false)
const [modalMessage, setModalMessage] = useState("")
const [formError, setFormError] = useState("") //

const {login,register} = useAuth()
const navigate = useNavigate()

const handleSubmit = async (e)=>{
    e.preventDefault()      // 🚨 Default Behavior (Without preventDefault)

                                // Normally, when you submit a form:

                                // ❌ Page reloads
                                // ❌ All state is lost
                                // ❌ React app refreshes

                                // 👉 That’s how traditional HTML forms work.

                                // ✅ With e.preventDefault()
                                // e.preventDefault()

                                // 👉 It tells the browser:

                                // ❗ "Don't reload the page — I will handle everything using JavaScript"
    try{
        setFormError("")
        if(mode === "login"){
            const user = await login({email,password})
            if(!user){
                setFormError("Invalid credentials")
                return
            }

            const role = user.role?.toLowerCase?.() ?? ""

            // ✅ correct role-based redirect
            if (role === "admin") {
              navigate("/app/admin-dashboard");
            } 
            else if (role === "faculty") {
              navigate("/app/faculty-dashboard");
            } 
            else if (role === "student") {
              navigate("/app/student-dashboard");
            }
            
            }
            else{
                await register({name,email,role,section,year,password})
                
                 // ✅ modal instead of alert
                setModalMessage("Registration Successful! Please Login.")
                setShowModal(true)

                setMode("login")


        }
    }
    catch(err){
        console.log(err)
        const message = err.response?.data?.message || "Something went wrong"
        setFormError(message)
    }
}
return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-80 space-y-3"
      >
        <h2 className="text-xl font-bold text-center">
          {mode === "login" ? "Login" : "Register"}
        </h2>

        {formError && (
          <p className="text-sm text-red-600 text-center mt-2">{formError}</p>
        )}

        {/* NAME */}
        {mode === "register" && (
          <input
            type="text"
            placeholder="Name"
            className="w-full border p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/* ROLE */}
        {mode === "register" && (
          <select
            className="w-full border p-2"
            value={role}
            onChange={(e) => {
              setRole(e.target.value)
              setSection("")
              setYear("")
            }}
          >
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
          </select>
        )}

        {/* SECTION */}
        {mode === "register" && role === "student" && (
          <input
            type="text"
            placeholder="Section"
            className="w-full border p-2"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            required
          />
        )}

        {/* YEAR */}
        {mode === "register" && role === "student" && (
          <input
            type="number"
            placeholder="Year"
            className="w-full border p-2"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
            min={1}
          />
        )}

        {/* PASSWORD */}
        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {/* BUTTON */}
        <button className="w-full bg-blue-500 text-white p-2 rounded">
          {mode === "login" ? "Login" : "Register"}
        </button>

        {/* TOGGLE */}
        <p
          className="text-sm text-center text-blue-600 cursor-pointer"
          onClick={() =>
            setMode(mode === "login" ? "register" : "login")
          }
        >
          {mode === "login"
            ? "Don't have an account? Register"
            : "Already have an account? Login"}
        </p>
      </form>

      {/* MODAL */}
      {showModal && (
        <Modal
          message={modalMessage}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )

}
