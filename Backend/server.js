import exp from "express"
import cors from "cors"
import dotenv from "dotenv"
import { connectDB } from "./config/db.js"
import { errorHandler } from "./middleware/errorHandling.js"
import { commanApp } from "./routes/authRoute.js"
import { venueApp } from "./routes/venueRoute.js"
import { venueBookingApp } from "./routes/venueBookingRoute.js"
import cookieParser from "cookie-parser"
import { verifyApiKey } from "./middleware/verifyApiKey.js"
import { handleAiDecision } from "./controllers/venueBookingController.js"

dotenv.config()

const app = exp() // 1.
// ✅ CORS HERE
// CORS allowed origins: localhost for dev and Vercel production/preview domains
const allowedOrigins = [
  "http://localhost:5173",
  "https://college-venue-booking-system.vercel.app",
  "https://college-venue-booking-system-p0348zhk4.vercel.app",
]

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (e.g., mobile apps, curl)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error('CORS policy: Origin not allowed'), false)
  },
  credentials: true,
}))
// ✅ Middlewares
app.use(exp.json())   // body parser middleware`
app.use(cookieParser())  // 2.

// ✅ Routes
app.use("/common-route",commanApp)  // 3.
app.use("/venue",venueApp);
app.use("/venue_booking",venueBookingApp)
app.post("/api/booking/ai-decision", verifyApiKey, handleAiDecision)

// ✅ Error handler (always last)
app.use(errorHandler)// error handling middleware it should be in the last of 
// using all middleware   // 3.
connectDB()// 4.


const PORT = process.env.PORT||5000
app.listen(PORT, () => {
  console.log("Server running on port 5000");
});


// Request → Middleware 1 → Middleware 2 → Route → Error Handler
