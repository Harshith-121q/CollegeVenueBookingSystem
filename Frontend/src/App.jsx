import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
// import { RoleProvider } from "./context/RoleContext"
// import { NotificationProvider } from "./context/NotificationContext"

import RootLayout from "./pages/RootLayout"

import Auth from "./pages/Auth"
import StudentDashbord from "./pages/StudentDashbord"
import FacultyDashboard from "./pages/FacultyDashboard"
import AdminDashboard from "./pages/AdminDashboard"
import VenueBooking from "./pages/VenueBooking"
import BookingRequests from "./pages/BookingRequests"
import ApprovalQueue from "./pages/ApprovalQueue"
import SectionStudents from "./pages/SectionStudents"

import ProtectedRoute from "./routes/ProtectedRoute"
import RoleBasedRoute from "./routes/RoleBasedRoute"

const routeObj = createBrowserRouter([
  { path: "/", element: <Auth /> },
  {
    path: "/app",
    element: <RootLayout />,
    children: [
      { path: "student-dashboard", element: <ProtectedRoute><StudentDashbord /></ProtectedRoute> },
      { path: "faculty-dashboard", element: <ProtectedRoute><FacultyDashboard /></ProtectedRoute> },
      { path: "admin-dashboard", element: <ProtectedRoute><RoleBasedRoute requiredRole="admin"><AdminDashboard /></RoleBasedRoute></ProtectedRoute> },
      { path: "venue-booking", element: <ProtectedRoute><VenueBooking /></ProtectedRoute> },
      { path: "booking-requests", element: <ProtectedRoute><BookingRequests /></ProtectedRoute> },
      { path: "approval-queue", element: <ProtectedRoute><RoleBasedRoute requiredRole="admin"><ApprovalQueue /></RoleBasedRoute></ProtectedRoute> },
      { path: "section-students", element: <ProtectedRoute><RoleBasedRoute requiredRole="faculty"><SectionStudents /></RoleBasedRoute></ProtectedRoute> },
    ]
  },
])

function App() {
  return (
    <AuthProvider>
      {/* <RoleProvider> */}
        {/* <NotificationProvider> */}
          <RouterProvider router={routeObj} />
        {/* </NotificationProvider> */}
      {/* </RoleProvider> */}
    </AuthProvider>
  )
}

export default App


