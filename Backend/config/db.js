import {connect} from "mongoose";
import {config} from "dotenv";


config()
export const connectDB= async()=>{
    try{
        await connect(process.env.DB_URL)
        console.log("DB connected successfully")
    }

    catch (err){
        console.log(err);
    }
    
}