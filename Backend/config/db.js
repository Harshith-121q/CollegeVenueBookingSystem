import {connect} from "mongoose";
import {config} from "dotenv";


config()
export const connectDB= async()=>{
    try{
        const dbUrl = process.env.DB_URL
        if (!dbUrl) {
            console.error("❌ ERROR: DB_URL environment variable is not set!")
            console.error("Please set DB_URL in your Render environment variables or .env file")
            process.exit(1)
        }
        console.log("Attempting to connect to:", dbUrl.replace(/([^:]+:[^@]+)@/, '***:***@'))
        await connect(dbUrl)
        console.log("✅ DB connected successfully")
    }

    catch (err){
        console.error("❌ Database Connection Error:", err.message);
        console.error("Please verify:")
        console.error("1. DB_URL is set in Render environment variables")
        console.error("2. MongoDB Atlas firewall allows Render IP")
        console.error("3. Connection string is correct")
        process.exit(1)
    }
    
}