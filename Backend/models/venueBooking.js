import {Schema,Types,model} from "mongoose";


const venueBookingSchema = new Schema({
    venue:{
        type:Types.ObjectId,
        ref:"Venue",
        required:[true,"Venue is required "]
    },
    user:{
        type:Types.ObjectId,
        ref:"User",
        required:[true,"User id is required "]
    },
    date:{
        type:Date,
        required:true
    },
    startTime:{
        type:String,
        required:true
    },
    endTime:{
        type:String,
        required:true
    },
    bookedStatus:{
        type:String,
        enum:["pending","booked","cancelled","rejected"],
        default:"pending"
    },
    reason:{
        type:String,
        //required:"true"
    },
    aiStatus:{
        type:String,
        enum:["pending","approved","rejected"],
        default:"pending"
    },
    aiReason:{
        type:String,
    },
},{
    timestamps:true
}); 

export const VenueBookingModel = model("VenueBooking",venueBookingSchema);